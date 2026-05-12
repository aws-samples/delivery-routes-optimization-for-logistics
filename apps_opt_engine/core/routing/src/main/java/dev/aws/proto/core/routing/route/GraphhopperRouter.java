/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * GraphHopper 11 migration notes:
 *   - FlagEncoderFactory was removed. Profiles are identified by name only ("car", "motorcycle").
 *   - GHRequest, GHResponse, ResponsePath, PointList APIs are unchanged.
 */
package dev.aws.proto.core.routing.route;

import com.graphhopper.GHRequest;
import com.graphhopper.GHResponse;
import com.graphhopper.GraphHopper;
import com.graphhopper.ResponsePath;
import com.graphhopper.util.PointList;
import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.distance.IDistanceCalculator;
import dev.aws.proto.core.routing.location.Coordinate;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * The GraphHopper router.
 * Performs distance calculations and gets paths between two lat/lng coordinates.
 */
public class GraphhopperRouter implements IDistanceCalculator {
    private static final Logger logger = LoggerFactory.getLogger(GraphhopperRouter.class);
    private static final RoundingMode roundingMode = RoundingMode.HALF_EVEN;

    /**
     * The allowed profiles for routing. If extended, ensure the GraphHopper
     * profiles and solver-config match accordingly.
     */
    public static final String PROFILE_CAR = "car";
    public static final String PROFILE_MOTORCYCLE = "motorcycle";
    // GraphHopper 11 only ships a built-in CustomModel for "car" by default; if you need
    // motorcycle you must register your own custom model in GraphhopperLoader.
    private static final String[] ALLOWED_PROFILES = {PROFILE_CAR};

    private final GraphHopper graphhopper;
    private final String profile;
    private final int gpsAccuracy;

    /** A counter for routing errors. */
    @Getter
    private final AtomicInteger errorCnt;

    public GraphhopperRouter(GraphHopper graphhopper, String profile) {
        this(graphhopper, profile, -1);
    }

    public GraphhopperRouter(GraphHopper graphhopper, String profile, int gpsAccuracy) {
        if (graphhopper == null) {
            throw new IllegalArgumentException("Graphhopper router cannot be null.");
        }
        if (Arrays.stream(ALLOWED_PROFILES).noneMatch(profile::equals)) {
            throw new IllegalArgumentException(
                    String.format("%s is not a supported profile. Allowed profile values are [%s]",
                            profile, String.join(", ", ALLOWED_PROFILES)
                    )
            );
        }

        this.graphhopper = graphhopper;
        this.profile = profile;
        this.gpsAccuracy = gpsAccuracy;
        this.errorCnt = new AtomicInteger(0);
    }

    private GHResponse getRoute(double fromLat, double fromLng, double toLat, double toLng) {
        if (gpsAccuracy >= 0 && gpsAccuracy <= 8) {
            fromLat = BigDecimal.valueOf(fromLat).setScale(gpsAccuracy, roundingMode).doubleValue();
            fromLng = BigDecimal.valueOf(fromLng).setScale(gpsAccuracy, roundingMode).doubleValue();
            toLat = BigDecimal.valueOf(toLat).setScale(gpsAccuracy, roundingMode).doubleValue();
            toLng = BigDecimal.valueOf(toLng).setScale(gpsAccuracy, roundingMode).doubleValue();
        }

        logger.trace("getRoute between {}/{} and {}/{}", fromLat, fromLng, toLat, toLng);

        GHRequest ghRequest = new GHRequest(fromLat, fromLng, toLat, toLng);
        ghRequest.setProfile(this.profile);
        return graphhopper.route(ghRequest);
    }

    /**
     * Gets a routing path between two geo points.
     */
    public List<Coordinate> getPath(Coordinate origin, Coordinate destination) {
        logger.trace("getPath between {} and {}", origin, destination);
        GHResponse ghResponse = this.getRoute(
                origin.getLatitude(), origin.getLongitude(), destination.getLatitude(), destination.getLongitude());

        PointList points = ghResponse.getBest().getPoints();
        return StreamSupport.stream(points.spliterator(), false)
                .map(ghPoint3D -> new Coordinate(ghPoint3D.lat, ghPoint3D.lon))
                .collect(Collectors.toList());
    }

    /**
     * Gets the travel distance between two geo points. Returns -1 values when GraphHopper
     * cannot determine the route.
     */
    @Override
    public Distance travelDistance(Coordinate from, Coordinate to) {

        logger.trace("Calculating distance between {} and {}", from, to);

        GHResponse ghResponse = this.getRoute(from.getLatitude(), from.getLongitude(), to.getLatitude(), to.getLongitude());

        if (ghResponse.hasErrors()) {
            for (Throwable err : ghResponse.getErrors()) {
                logger.debug("Error while calculating route between {}/{} and {}/{}: {}", from.getLatitude(), from.getLongitude(), to.getLatitude(), to.getLongitude(), err.getMessage());
                errorCnt.incrementAndGet();
            }

            return Distance.ofValue(-1, -1);
        }

        ResponsePath bestPath = ghResponse.getBest();
        return Distance.ofValue((long) bestPath.getDistance(), bestPath.getTime() / 1000L);
    }
}
