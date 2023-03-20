/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithName;

import java.util.Optional;

@ConfigMapping(prefix = "app.routing.cache")
public interface DistanceCachingProperties {
    @WithName("persistence-type")
    String persistenceType();

    @WithName("file-path")
    String cacheFilePath();

    @WithName("s3-bucket-name")
    Optional<String> cacheBucketName();

    @WithName("ddb-table-name")
    String cacheInfoTableName();
}
