/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.location;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.json.bind.annotation.JsonbProperty;
import java.util.Objects;

/**
 * Horizontal geographical coordinates consisting of latitude and longitude.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Coordinate {
    @JsonProperty("lat")
    @JsonbProperty("lat")
    private double latitude;

    @JsonProperty("long")
    @JsonbProperty("long")
    private double longitude;

    public Coordinate(double lat, double lon) {
        this.latitude = lat;
        this.longitude = lon;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Coordinate coordinate = (Coordinate) o;
        return latitude == coordinate.latitude &&
                longitude == coordinate.longitude;
    }

    @Override
    public int hashCode() {
        return Objects.hash(latitude, longitude);
    }

    @Override
    public String toString() {
        return "[lat/lng = " + latitude + "/" + longitude + "]";
    }
}
