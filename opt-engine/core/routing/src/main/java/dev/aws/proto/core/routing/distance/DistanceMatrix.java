/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.distance;

import dev.aws.proto.core.routing.location.ILocation;
import dev.aws.proto.core.routing.route.GraphhopperRouter;
import lombok.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

public class DistanceMatrix implements IDistanceMatrix<Distance> {
    private static final Logger logger = LoggerFactory.getLogger(DistanceMatrix.class);

    @Getter
    private final Map<ILocation, Map<ILocation, Distance>> matrix;
    @Getter
    private final long generatedTime;

    @Getter
    private final DistanceMatrix.Metrics metrics;

    @Getter
    @Setter
    private Map<String, ILocation> locationKeyMap;

    private DistanceMatrix(Map<ILocation, Map<ILocation, Distance>> matrix, long generatedTime) {
        this.matrix = matrix;
        this.generatedTime = generatedTime;

        this.metrics = new Metrics(generatedTime, matrix.size());
    }

    public ILocation getLocationById(String locationID) {
        return locationKeyMap.get(locationID);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Metrics {
        private long generatedTimeInMs;
        private int dimension;
    }

    @Override
    public Distance distanceBetween(ILocation origin, ILocation destination) {
        logger.trace("Calculating distance between {} and {}", origin, destination);

        Map<ILocation, Distance> distanceRow = this.matrix.get(origin);

        return distanceRow.get(destination);
    }

    @Override
    public Distance distanceBetween(String originID, String destinationID) {
        ILocation origin = getLocationById(originID);
        ILocation destination = getLocationById(destinationID);
        return distanceBetween(origin, destination);
    }

    public static DistanceMatrix fromMatrix(Map<ILocation, Map<ILocation, Distance>> matrix) {
        return new DistanceMatrix(matrix, 0);
    }

    public static DistanceMatrix generate(List<ILocation> locationList, GraphhopperRouter router) {
        long start = System.currentTimeMillis();
        int locCnt = locationList.size();
        ILocation[] locations = new ILocation[locCnt];
        locationList.toArray(locations);

        logger.debug("DMatrix :: dimension = {}x{} ({} cells)", locCnt, locCnt, locCnt * locCnt);

        // create inverse lookup
        Map<ILocation, Integer> locIdxLookup = new HashMap<>();
        for (int i = 0; i < locCnt; i++) {
            locIdxLookup.put(locations[i], i);
        }

        Distance[][] distances = new Distance[locCnt][locCnt];

        int cellCnt = locCnt * locCnt;
        AtomicInteger ctr = new AtomicInteger(0);
        int onePercentOr1000 = Math.max((cellCnt / 100), 1000);

        IntStream.range(0, cellCnt)
                .parallel()
                .forEach(idx -> {
                    int i = idx / locCnt;
                    int j = idx % locCnt;

                    Distance d = router.travelDistance(locations[i].coordinate(), locations[j].coordinate());
                    distances[i][j] = d;

                    int localCtr = ctr.incrementAndGet();
                    if (localCtr % onePercentOr1000 == 0) {
                        logger.debug("Processing {}/{} ({}%)", localCtr, cellCnt, ((double) localCtr / cellCnt) * 100);
                    }
                });

        Map<ILocation, Map<ILocation, Distance>> matrix = new HashMap<>();
        for (int i = 0; i < locCnt; i++) {
            Map<ILocation, Distance> row = new HashMap<>();
            for (int j = 0; j < locCnt; j++) {
                row.put(locations[j], distances[j][i]); // TODO: review indexing
            }

            matrix.put(locations[i], row);
        }

        long generatedTime = System.currentTimeMillis() - start;

        logger.debug("DistanceMatrix :: calc time = {}ms :: dim = {}x{} :: per cell = {}ms", generatedTime, locCnt, locCnt, ((double) generatedTime / (locCnt * locCnt)));
        logger.debug("DistanceMatrix :: errors = {}", router.getErrorCnt().get());
        router.getErrorCnt().set(0);
        return new DistanceMatrix(matrix, generatedTime);
    }
}
