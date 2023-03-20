/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.response;

import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.location.LocationBase;
import dev.aws.proto.core.routing.route.PolylineHelper;
import dev.aws.proto.core.routing.route.SegmentRoute;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Segment {
    private UnitValue<String, Long> distance;
    private UnitValue<String, Long> time;
    private String pointsEncoded;

    public Segment(long distanceInMeters, long distanceInSeconds, String pointsEncoded) {
        this.distance = new UnitValue<>("m", distanceInMeters);
        this.time = new UnitValue<>("sec", distanceInSeconds);
        this.pointsEncoded = pointsEncoded;
    }


    public Segment(SegmentRoute segmentRoute) {
        this(segmentRoute.getDistanceInMeters(), segmentRoute.getDistanceInSeconds(), segmentRoute.getPointsEncoded());
    }

    public static Segment fromSegments(List<DeliverySegment> segments) {
        List<String> encodedPolylines = new ArrayList<>();
        long allDistInMeters = 0;
        long allDistTimeInSec = 0;

        for (int i = 0; i < segments.size(); i++) {
            encodedPolylines.add(segments.get(i).getRoute().pointsEncoded);

            allDistInMeters += segments.get(i).getRoute().getDistance().getValue();
            allDistTimeInSec += segments.get(i).getRoute().getTime().getValue();
        }
        String pointsEncoded = PolylineHelper.concatEncodedPolylines(encodedPolylines);

        return new Segment(allDistInMeters, allDistTimeInSec, pointsEncoded);
    }

    public static Segment between(LocationBase<Distance> origin, LocationBase<Distance> destination) {
        Distance dist = origin.distanceTo(destination);
        String pointsEncoded = PolylineHelper.encodePointsToPolyline(Arrays.asList(origin.getCoordinate(), destination.getCoordinate()));

        return new Segment(dist.getDistanceInMeters(), dist.getDistanceInSeconds(), pointsEncoded);
    }
}
