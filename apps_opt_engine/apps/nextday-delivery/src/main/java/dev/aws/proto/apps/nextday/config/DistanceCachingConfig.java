/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - @ApplicationScoped -> @Configuration.
 *   - javax.ws.rs.NotSupportedException -> java.lang.UnsupportedOperationException.
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
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DistanceCachingProperties.class)
public class DistanceCachingConfig {

    @Getter
    private final ICachePersistence<DistanceMatrix> cachePersistence;

    public DistanceCachingConfig(DistanceCachingProperties distanceCachingProperties) {
        String persistenceType = distanceCachingProperties.persistenceType();

        if ("file".equalsIgnoreCase(persistenceType)) {
            String cacheFilePath = PathHelper.getAbsPath(distanceCachingProperties.cacheFilePath()).toString();
            this.cachePersistence = new FilePersistence(cacheFilePath);
        } else if ("s3".equalsIgnoreCase(persistenceType)) {
            if (distanceCachingProperties.cacheBucketName().isEmpty()) {
                throw new IllegalArgumentException("Error initializing DistanceCachingConfig: cacheBucketName is missing from application.properties");
            }
            String bucketName = SsmUtility.getParameterValue(distanceCachingProperties.cacheBucketName().get());
            String cacheFileName = distanceCachingProperties.cacheFilePath();
            this.cachePersistence = new S3FilePersistence(bucketName, cacheFileName);
        } else {
            throw new UnsupportedOperationException("Error initializing DistanceCachingConfig: " + persistenceType + " persistence type not supported in this version.");
        }
    }
}
