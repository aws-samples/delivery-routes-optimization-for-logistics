/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.distancecache.util.commands;

import dev.aws.proto.core.routing.cache.persistence.latlong.FilePersistence;
import dev.aws.proto.core.routing.cache.persistence.latlong.S3FilePersistence;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.util.aws.SsmUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import picocli.CommandLine;

import java.io.File;
import java.util.concurrent.Callable;

@CommandLine.Command(name = "import-lat-long", header = "Import lat-long cache file")
public class ImportLatLongCache implements Callable<Integer> {
    private static final Logger logger = LoggerFactory.getLogger(ImportLatLongCache.class);

    @CommandLine.Parameters(index = "0", description = "The cache file")
    private File cacheFile;

    @Override
    public Integer call() throws Exception {
        logger.info("Importing cache file from {}", cacheFile.toPath().toString());

        try {
            FilePersistence filePersistence = new FilePersistence(cacheFile.toPath().toString());
            DistanceMatrix distanceMatrix = filePersistence.importCache();

            int dim = distanceMatrix.getMetrics().getDimension();
            logger.info("Distance Matrix loaded successfully to memory.");
            logger.info("Number of lat/long pairs: {}", dim);
            logger.info("Matrix size: {}x{} ({} cells)", dim, dim, dim * dim);
            logger.info("Matrix size: {}x{} ({} cells)", dim, dim, dim * dim);

            String bucketName = SsmUtility.getParameterValue("/DevProto/S3/DistanceCache/BucketName");
            String fileName = "cache/output.latlongcache";
            S3FilePersistence s3FilePersistence = new S3FilePersistence(bucketName, fileName);
            s3FilePersistence.buildCache(distanceMatrix);
            return 0;
        } catch (Exception ex) {
            logger.error("Error while loading distance cache file: {}", ex.getMessage());
            ex.printStackTrace();

            return 1;
        }
    }
}
