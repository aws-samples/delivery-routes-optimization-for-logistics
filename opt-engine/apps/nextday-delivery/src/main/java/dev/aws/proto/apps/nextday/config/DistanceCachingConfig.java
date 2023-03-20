/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.config;

import dev.aws.proto.apps.appcore.config.DistanceCachingProperties;
import dev.aws.proto.core.routing.cache.persistence.ICachePersistence;
import dev.aws.proto.core.routing.cache.persistence.latlong.FilePersistence;
import dev.aws.proto.core.routing.cache.persistence.latlong.S3FilePersistence;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.util.PathHelper;
import dev.aws.proto.core.util.aws.SsmUtility;
import lombok.Getter;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.ws.rs.NotSupportedException;

@ApplicationScoped
public class DistanceCachingConfig {

    @Getter
    private final ICachePersistence<DistanceMatrix> cachePersistence;

    @Inject
    DistanceCachingProperties distanceCachingProperties;

    DistanceCachingConfig(DistanceCachingProperties distanceCachingProperties) {
        String persistenceType = distanceCachingProperties.persistenceType();

        if (persistenceType.equalsIgnoreCase("file")) {
            String cacheFilePath = PathHelper.getAbsPath(distanceCachingProperties.cacheFilePath()).toString();
            this.cachePersistence = new FilePersistence(cacheFilePath);
        } else if (persistenceType.equalsIgnoreCase("s3")) {
            if (distanceCachingProperties.cacheBucketName().isEmpty()) {
                throw new IllegalArgumentException("Error initializing DistanceCachingConfig: cacheBucketName is missing from application.properties");
            }
            String bucketName = SsmUtility.getParameterValue(distanceCachingProperties.cacheBucketName().get());
            String cacheFileName = distanceCachingProperties.cacheFilePath();
            this.cachePersistence = new S3FilePersistence(bucketName, cacheFileName);
        } else {
            throw new NotSupportedException("Error initializing DistanceCachingConfig: " + distanceCachingProperties.persistenceType() + " persistence type not supported in this version.");
        }
    }
}
