/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.cache.persistence.latlong;

import dev.aws.proto.core.routing.cache.persistence.CachePersistenceException;
import dev.aws.proto.core.routing.cache.persistence.ICachePersistence;
import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.CoordinateWithId;
import dev.aws.proto.core.routing.location.ILocation;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.s3.model.CSVOutput;

import java.io.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

/**
 * Persist a lat/long distance cache object to a file, or load it from a file.
 * <p>
 * File format:
 * <p>
 * Bytes     -- Content
 * 4         -- Number of points
 * [Dim x (8 + 8)] -- Lat/Long doubles
 * [Dim * Dim x [8 (meters, long) + 8 (seconds, long) ] ] -- Distances
 */
public class FilePersistence implements ICachePersistence<DistanceMatrix> {
    private static final Logger logger = LoggerFactory.getLogger(FilePersistence.class);

    @Getter
    private final String cacheFilePath;

    public FilePersistence(String cacheFilePath) {
        this.cacheFilePath = cacheFilePath;
    }

    /**
     * Persist the cache into a file.
     *
     * @param distanceMatrix The cache object.
     */
    @Override
    public void buildCache(DistanceMatrix distanceMatrix) {
        logger.info("Exporting DistanceMatrix (dim = {})", distanceMatrix.getMetrics().getDimension());

        try (FileOutputStream fos = new FileOutputStream(this.cacheFilePath)) {
            DataOutputStream outputStream = new DataOutputStream(new BufferedOutputStream(fos));

            int dim = distanceMatrix.getMetrics().getDimension();
            outputStream.writeInt(dim);

            ILocation[] locationArr = new ILocation[dim];
            distanceMatrix.getMatrix().keySet().toArray(locationArr);

            for (int i = 0; i < dim; i++) {
                Coordinate coordinate = locationArr[i].coordinate();

                outputStream.writeDouble(coordinate.getLatitude());
                outputStream.writeDouble(coordinate.getLongitude());
            }

            for (int i = 0; i < dim; i++) {
                for (int j = 0; j < dim; j++) {
                    Distance dist_ij = distanceMatrix.distanceBetween(locationArr[i], locationArr[j]);
                    outputStream.writeLong(dist_ij.getDistanceInMeters());
                    outputStream.writeLong(dist_ij.getDistanceInSeconds());
                }
            }

            outputStream.flush();

            logger.info(" dim ===>>> {}",locationArr.length);
            if(locationArr.length > 0 && locationArr[0].coordinate() instanceof CoordinateWithId) {
                try (BufferedWriter bw = new BufferedWriter(new FileWriter(this.cacheFilePath+".keymap"))) {
                    for (int i = 0; i < dim; i++) {
                        CoordinateWithId cc = (CoordinateWithId)locationArr[i].coordinate();
                        bw.write(i+","+cc.getId());
                        bw.newLine();
                    }

                    bw.flush();
                } catch (IOException ioEx2) {
                    logger.error("Error writing keymap to data output stream. {}", ioEx2.getMessage());
                    ioEx2.printStackTrace();
                }
            }
        } catch (IOException ioEx) {
            logger.error("Error writing distanceMatrix to data output stream. {}", ioEx.getMessage());
            ioEx.printStackTrace();
        }

        logger.info("Successfully wrote distanceMatrix to {}", this.cacheFilePath);
    }

    /**
     * Load the distance cache from a file.
     *
     * @return The cache object.
     */
    @Override
    public DistanceMatrix importCache() {
        logger.info("Importing DistanceMatrix from {}", this.cacheFilePath);
        long start = System.currentTimeMillis();

        HashMap<Integer, String> keymap = importCacheKeyMap();
        Map<String, ILocation> locationIdMap = new HashMap<>();
        Map<ILocation, Map<ILocation, Distance>> matrix = new HashMap<>();

        try (FileInputStream fis = new FileInputStream(this.cacheFilePath)) {
            DataInputStream inputStream = new DataInputStream(new BufferedInputStream(fis));

            int dim = inputStream.readInt();
            ILocation[] locationArr = new ILocation[dim];

            for (int i = 0; i < dim; i++) {
                double latitude = inputStream.readDouble();
                double longitude = inputStream.readDouble();
                Coordinate c = new Coordinate(latitude, longitude);

                final String locId = String.valueOf(i);
                ILocation loc = new ILocation() {
                    @Override
                    public String id() {
                        return keymap.get(locId);
                    }

                    @Override
                    public Coordinate coordinate() {
                        return c;
                    }
                };

                locationArr[i] = loc;

                if(keymap.containsKey(i)) locationIdMap.put(keymap.get(i), loc);
            }

            for (int i = 0; i < dim; i++) {
                Map<ILocation, Distance> row = new HashMap<>();
                for (int j = 0; j < dim; j++) {
                    long meters_ij = inputStream.readLong();
                    long seconds_ij = inputStream.readLong();

                    Distance dist_ij = Distance.ofValue(meters_ij, seconds_ij);
                    row.put(locationArr[j], dist_ij); // TODO: review indexing
                }

                matrix.put(locationArr[i], row);
            }

            logger.info("Successfully imported DistanceMatrix from {} (dim = {}).", this.cacheFilePath, dim);

            DistanceMatrix dm = DistanceMatrix.fromMatrix(matrix);
            dm.setLocationKeyMap(locationIdMap);

            return dm;
        } catch (IOException ioEx) {
            logger.error("Error reading distanceMatrix from data input stream. {}", ioEx.getMessage());
            ioEx.printStackTrace();

            throw new CachePersistenceException("Error while importing DistanceMatrix", ioEx);
        }
    }

    public HashMap<Integer, String> importCacheKeyMap(){
        logger.info("Importing DistanceMatrix KeyMap from {}", this.cacheFilePath);
        HashMap<Integer, String> keymap = new HashMap<>();
        if(new File(this.cacheFilePath+".keymap").isFile()) {
            try (BufferedReader br = new BufferedReader(new FileReader(this.cacheFilePath+".keymap"))) {
                String line;
                while((line = br.readLine()) != null){
                    String[] km = line.split(",");
                    keymap.put(Integer.valueOf(km[0]), km[1]);
                }
            } catch (IOException ioEx) {
                logger.error("Error reading distanceMatrix to data output stream. {}", ioEx.getMessage());
                ioEx.printStackTrace();
            }
        }
        logger.info("Successfully imported DistanceMatrix KeyMap from {} (dim = {}).", this.cacheFilePath, keymap.size());
        return keymap;
    }
}
