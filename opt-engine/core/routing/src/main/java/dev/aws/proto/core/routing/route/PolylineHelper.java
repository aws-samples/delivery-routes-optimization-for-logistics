/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.route;

import com.mapbox.geojson.Point;
import com.mapbox.geojson.utils.PolylineUtils;
import dev.aws.proto.core.routing.location.Coordinate;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class PolylineHelper {
    // From MapBox docs:
    // precision - OSRMv4 uses 6, OSRMv5 and Google uses 5
    private static final int OSRMv4_PRECISION = 6;
    private static final int OSRMv5_PRECISION = 5;

    public static String encodePointsToPolyline(List<Coordinate> points) {
        List<Point> path = points.stream().map(c -> Point.fromLngLat(c.getLongitude(), c.getLatitude())).collect(Collectors.toList());
        return PolylineUtils.encode(path, OSRMv5_PRECISION);
    }

    public static String concatEncodedPolylines(List<String> encodedPolylines) {
        List<Point> path = new ArrayList<>();
        for (String encodedLine : encodedPolylines) {
            path.addAll(PolylineUtils.decode(encodedLine, OSRMv5_PRECISION));
        }
        return PolylineUtils.encode(path, OSRMv5_PRECISION);
    }
}
