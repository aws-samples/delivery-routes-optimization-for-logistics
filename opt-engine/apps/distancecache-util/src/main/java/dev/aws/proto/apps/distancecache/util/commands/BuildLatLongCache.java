/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.distancecache.util.commands;

import dev.aws.proto.apps.distancecache.util.data.DdbDistanceCacheBuilderService;
import dev.aws.proto.apps.distancecache.util.loader.LocationLoader;
import dev.aws.proto.core.routing.cache.persistence.latlong.S3FilePersistence;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.routing.location.ILocation;
import dev.aws.proto.core.routing.route.GraphhopperLoader;
import dev.aws.proto.core.routing.route.GraphhopperRouter;
import dev.aws.proto.core.util.aws.SsmUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import picocli.CommandLine;

import java.io.File;
import java.io.FileNotFoundException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Callable;

@CommandLine.Command(name = "build-lat-long", description = "Build Lat/Long DistanceCache and export")
public class BuildLatLongCache implements Callable<Integer> {
    private static final Logger logger = LoggerFactory.getLogger(BuildLatLongCache.class);

    @CommandLine.Option(names = "--location", description = "Lat/long input source. ddb, file")
    private String locationType = "ddb";

    @CommandLine.Option(names = {"--location-file"}, description = "The file containing the list of lat/longs as input")
    private File locationsFile = null;

    @CommandLine.Option(names = "--warehouse", description = "Warehouse code")
    private String warehouse = "";

    @CommandLine.Option(names = {"-p", "--persistence"}, description = "file, s3 [later: redis, neptune]")
    private String persistenceType = "file";

    @CommandLine.Option(names = "--routing-profile", description = "car, motorcycle")
    private String routingProfile = "car";

    @CommandLine.Option(names = "--local-osm-dir", description = "The directory to look the OSM file for")
    private String localOsmDir = "~/.graphhopper/openstreetmap";

    @CommandLine.Option(names = "--local-graphhopper-dir", description = "The graphhopper cache dir")
    private String localGraphhopperDir = "~/.graphhopper/graphhopper";

    @CommandLine.Option(names = "--local-osm-file", description = "The OSM file")
    private String osmFile = "mapfile.osm.pbf";

    @CommandLine.Option(names = {"-o", "--output"}, description = "The output file")
    private String outputFilename = "output.latlongcache";

    @CommandLine.Option(names = "--bucketname", description = "The DistanceCache file S3 bucket name")
    private String bucketName = null;

    @CommandLine.Option(names = "--tablename", description = "The DistanceCache file release information DDB table name")
    private String ddbCacheTableName = null;

    private String buildDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    private String s3OutputFilenamePrefix = "cache/";
    @CommandLine.Option(names = {"-os3", "--outputS3"}, description = "The OSM file")
    private String s3OutputFilenameDefault = null;
    private String s3OutputFilename = null;

    @CommandLine.Option(names = {"-ddb", "--loctablename"}, description = "DynamoDB Source Table Name")
    private String ddbLocTableName = null;

    public static class InvalidLocationInputException extends Exception {
        public InvalidLocationInputException(String s) {
            super(s);
        }
    };

    @Override
    public Integer call() {
        if(s3OutputFilenameDefault == null) s3OutputFilenameDefault = s3OutputFilenamePrefix+"output.latlongcache";
        if(s3OutputFilename == null) s3OutputFilename = s3OutputFilenamePrefix + warehouse + "_"+buildDateTime+"_" + "output.latlongcache";

        if(bucketName == null) bucketName = SsmUtility.getParameterValue("/DevProto/S3/DistanceCache/BucketName");
        if(ddbCacheTableName == null) ddbCacheTableName = SsmUtility.getParameterValue("/DevProto/DDB/DistanceCache/TableName");
        if(ddbLocTableName == null) ddbLocTableName = SsmUtility.getParameterValue("/DevProto/Ddb/CustomerLocations/TableName");

        DdbDistanceCacheBuilderService ddbCacheTable = new DdbDistanceCacheBuilderService(ddbCacheTableName);

        logger.debug("Parameters:");
        logger.debug("\tlocation type = {}", locationType);
        if(Objects.equals(locationType, "file")) logger.debug("\tlocationsFile = {}", locationsFile.toPath().toString());
        else logger.debug("\tlocationsTable = {}", ddbLocTableName);
        logger.debug("\twarehouse = {}", warehouse);
        logger.debug("\tpersistenceType = {}", persistenceType);
        logger.debug("\trouting profile = {}", routingProfile);
        logger.debug("\tlocalOsmDir = {}", localOsmDir);
        logger.debug("\tlocalGraphhopperDir = {}", localGraphhopperDir);
        logger.debug("\tosmFile = {}", osmFile);
        logger.debug("\toutputFilename = {}", outputFilename);
        logger.debug("\tbucketName = {}", bucketName);
        logger.debug("\ts3OutputFilename = {}", s3OutputFilename);
        logger.debug("\ttableName = {}", ddbCacheTableName);
        logger.debug("\n");

        List<ILocation> locationList = null;
        GraphhopperRouter router = null;
        DistanceMatrix distanceMatrix = null;

        // load customer locations
        try{
            if("file".equals(locationType)) {
                // get location data from file
                if(locationsFile == null || !locationsFile.isFile()) {
                    throw new FileNotFoundException("Location file is not found.");
                }

                String locationFilePath = locationsFile.toPath().toString();
                logger.info("Loading locations file {}", locationFilePath);

                if(locationFilePath.endsWith(".json")) {
                    locationList = LocationLoader.loadLocationsFromJsonFile(locationsFile);
                } else if(locationFilePath.endsWith(".csv")) {
                    locationList = LocationLoader.loadLocationsFromCsvFile(locationsFile);
                } else {
                    throw new InvalidLocationInputException("Not supported file type : " + locationFilePath);
                }
            } else if("ddb".equals(locationType)) {
                // get location data from DynamoDB
                DdbDistanceCacheBuilderService ddbLoc = new DdbDistanceCacheBuilderService(ddbLocTableName);
                List<Map<String,String>> customerLocations = ddbLoc.getLocationList(warehouse);

                locationList = LocationLoader.loadLocationsFromDdb(customerLocations);
            } else {
                throw new InvalidLocationInputException("Not supported location type : " + locationType);
            }

            if(locationList == null || locationList.isEmpty()) {
                throw new InvalidLocationInputException("There are no locations in warehouse [" + warehouse + "]");
            }
        } catch (Exception e) {
            logger.error("Location load error : {}", e.getMessage());
            ddbCacheTable.putBuildResult(warehouse, buildDateTime, -1, "FAIL", "Location data load failure");
            return -1;
        }

        int dim = locationList.size();
        logger.info("Loaded {} lat/long pairs", dim);
        logger.info("This will result a {}x{} distance matrix cache ({} cells).", dim, dim, dim * dim);

        double bytesNum = (4 + dim * (8 + 8) + (dim * dim) * (8 + 8));
        double mb = (bytesNum / 1024.0) / 1024.0;
        logger.info("Predicted size of the cache file: {} MB", String.format("%.3f", mb));

        try {
            logger.info("Attempting to load Graphhopper...");
            GraphhopperLoader ghLoader = new GraphhopperLoader(localOsmDir, localGraphhopperDir, osmFile);
            ghLoader.initAndLoad();

            logger.info("Initializing Graphhopper Router...");
            router = new GraphhopperRouter(ghLoader.getHopper(), routingProfile);
        } catch (Exception e) {
            logger.error("Cannot initialize GraphHopper router : {}", e.getMessage());
            ddbCacheTable.putBuildResult(warehouse, buildDateTime, -1, "FAIL", "Cannot initialize routing engine");
            return -1;
        }

        try {
            logger.info("Generating DistanceMatrix (dim = {})", dim);
            distanceMatrix = DistanceMatrix.generate(locationList, router);
            logger.info("DistanceMatrix generated successfully.");
        } catch (Exception e) {
            logger.error("Error on generate distance matrix : {}", e.getMessage());
            ddbCacheTable.putBuildResult(warehouse, buildDateTime, dim, "FAIL", "Error on generate distance matrix");
            return -1;
        }

        try {
            S3FilePersistence s3FilePersistence = new S3FilePersistence(bucketName, s3OutputFilename, s3OutputFilenameDefault);
            s3FilePersistence.buildCache(distanceMatrix);
        } catch (Exception e) {
            logger.error("Error on upload distance cache to S3 bucket : {}", e.getMessage());
            ddbCacheTable.putBuildResult(warehouse, buildDateTime, dim, "FAIL", "Error on upload distance cache to S3 bucket");
            return -1;
        }

        ddbCacheTable.putBuildResult(warehouse, buildDateTime, dim, "SUCCESS", "");
        logger.info("DistanceMatrix upload successfully.");

        return 0;
    }
}
