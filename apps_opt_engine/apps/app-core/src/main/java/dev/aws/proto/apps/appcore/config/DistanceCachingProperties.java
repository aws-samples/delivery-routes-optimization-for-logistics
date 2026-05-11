/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - Converted to @ConfigurationProperties record.
 *   - `cacheBucketName` is Optional<String> to preserve the original contract.
 */
package dev.aws.proto.apps.appcore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Optional;

@ConfigurationProperties(prefix = "app.routing.cache")
public record DistanceCachingProperties(
        String persistenceType,
        String filePath,
        Optional<String> s3BucketName,
        String ddbTableName
) {

    // Backwards-compatible accessors matching the original interface names
    public String cacheFilePath() {
        return filePath;
    }

    public Optional<String> cacheBucketName() {
        return s3BucketName;
    }

    public String cacheInfoTableName() {
        return ddbTableName;
    }
}
