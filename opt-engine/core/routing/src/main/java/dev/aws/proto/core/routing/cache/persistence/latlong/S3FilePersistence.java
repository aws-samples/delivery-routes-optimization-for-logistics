/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.cache.persistence.latlong;

import dev.aws.proto.core.routing.cache.persistence.CachePersistenceException;
import dev.aws.proto.core.routing.cache.persistence.ICachePersistence;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.util.aws.S3Utility;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * S3 File persistence for the DistanceCache:
 * - Exports the cache object to a temporary file and uploads to S3;
 * - Downloads the cache file from S3 and loads it into memory.
 */
public class S3FilePersistence implements ICachePersistence<DistanceMatrix> {
    /**
     * The bucket name.
     */
    private final String bucketName;

    /**
     * The key path to the cache file in the bucket.
     */
    private final String cacheFileKeyPath;

    /**
     * The key path to the cache file in the bucket.
     */
    private final String cacheFileKeyPathByDefault;

    public S3FilePersistence(String bucketName, String cacheFileKeyPath) {
        this.bucketName = bucketName;
        this.cacheFileKeyPath = cacheFileKeyPath;
        this.cacheFileKeyPathByDefault = cacheFileKeyPath;
    }

    public S3FilePersistence(String bucketName, String cacheFileKeyPath, String cacheFileKeyPathByDefault) {
        this.bucketName = bucketName;
        this.cacheFileKeyPath = cacheFileKeyPath;
        this.cacheFileKeyPathByDefault = cacheFileKeyPathByDefault;
    }

    /**
     * Exports the cache object into a temporary file, and uploads it to S3.
     *
     * @param distanceCache The cache object.
     */
    @Override
    public void buildCache(DistanceMatrix distanceCache) {
        try {
            String tmpFilePath = Files.createTempFile("latLongDistance", ".tmp").toAbsolutePath().toString();
            FilePersistence filePersistence = new FilePersistence(tmpFilePath);
            filePersistence.buildCache(distanceCache);

            S3Utility.uploadFile(this.bucketName, this.cacheFileKeyPath, Paths.get(filePersistence.getCacheFilePath()));
            S3Utility.copyFile(this.bucketName, this.cacheFileKeyPath, this.bucketName, this.cacheFileKeyPathByDefault);

            S3Utility.uploadFile(this.bucketName, this.cacheFileKeyPath+".keymap", Paths.get(filePersistence.getCacheFilePath()+".keymap"));
            S3Utility.copyFile(this.bucketName, this.cacheFileKeyPath+".keymap", this.bucketName, this.cacheFileKeyPathByDefault+".keymap");
        } catch (IOException ioException) {
            ioException.printStackTrace();
            throw new CachePersistenceException("Error creating a temp file for S3 file persistence", ioException);
        }

    }

    /**
     * Downloads the cache file from an S3 bucket to a temporary file and loads it into the memory.
     *
     * @return The cache object.
     */
    @Override
    public DistanceMatrix importCache() {
        try {
            String tmpFilePath = Files.createTempFile("latLongDistance", ".tmp").toAbsolutePath().toString()+".cache";
            S3Utility.downloadFile(this.bucketName, this.cacheFileKeyPath, Paths.get(tmpFilePath));
            S3Utility.downloadFile(this.bucketName, this.cacheFileKeyPath+".keymap", Paths.get(tmpFilePath+".keymap"));

            FilePersistence filePersistence = new FilePersistence(tmpFilePath);
            return filePersistence.importCache();
        } catch (IOException ioException) {
            ioException.printStackTrace();
            throw new CachePersistenceException("Error creating a temp file for S3 file persistence", ioException);
        }
    }
}
