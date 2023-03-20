/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.util.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.awscore.exception.AwsServiceException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

public class S3Utility {
    private static final Logger logger = LoggerFactory.getLogger(S3Utility.class);

    public static void downloadFile(String bucketName, String keyPath, Path localFilePath) {
        AwsCredentialsProvider credentialsProvider = CredentialsHelper.getCredentialsProvider();

        S3Client s3Client = S3Client.builder()
                .credentialsProvider(credentialsProvider)
                .region(CredentialsHelper.getRegion())
                .build();

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(keyPath)
                .build();

        try {
            logger.debug("Downloading s3://{}/{} to {}", bucketName, keyPath, localFilePath);
            GetObjectResponse getObjectResponse = s3Client.getObject(getObjectRequest, localFilePath);
            logger.info("{} from {} was downloaded to {} ({} bytes)", keyPath, bucketName, localFilePath, getObjectResponse.contentLength());
        } catch (NoSuchKeyException e) {
            logger.error("Key ({}) doesn't exist in S3 Bucket: {}", getObjectRequest.key(), e.getMessage());
        } catch (AwsServiceException | SdkClientException e) {
            logger.error("Error while downloading file from S3 bucket '{}/{}': {}", bucketName, keyPath, e.getMessage());
        } catch (Exception e) {
            logger.error("Generic error :: {}", e.getMessage());
        }
    }

    public static void uploadFile(String bucketName, String keyPath, Path localFilePath) {
        AwsCredentialsProvider credentialsProvider = CredentialsHelper.getCredentialsProvider();

        S3Client s3Client = S3Client.builder()
                .credentialsProvider(credentialsProvider)
                .region(CredentialsHelper.getRegion())
                .build();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(keyPath)
                .build();

        try {
            logger.debug("Uploading {} to s3://{}/{}", localFilePath, putObjectRequest.bucket(), putObjectRequest.key());
            PutObjectResponse putObjectResponse = s3Client.putObject(putObjectRequest, localFilePath);
            logger.info("{} was uploaded to {}/{}", localFilePath.getFileName(), putObjectRequest.bucket(), putObjectRequest.key());
        } catch (AwsServiceException | SdkClientException e) {
            logger.error("Error while uploading file {} to S3 bucket '{}/{}': {}", localFilePath.getFileName(), bucketName, putObjectRequest.key(), e.getMessage());
        }
    }

    public static void copyFile(String fromBucket, String fromObjectKey, String toBucket, String toObjectKey) {

        AwsCredentialsProvider credentialsProvider = CredentialsHelper.getCredentialsProvider();

        S3Client s3Client = S3Client.builder()
                .credentialsProvider(credentialsProvider)
                .region(CredentialsHelper.getRegion())
                .build();

        CopyObjectRequest copyReq = CopyObjectRequest.builder()
                .sourceBucket(fromBucket)
                .sourceKey(fromObjectKey)
                .destinationBucket(toBucket)
                .destinationKey(toObjectKey)
                .build();

        try {
            CopyObjectResponse copyRes = s3Client.copyObject(copyReq);
            logger.info("S3 object copied {}/{} to {}/{}", fromBucket, fromObjectKey, toBucket, toObjectKey);
        } catch (S3Exception e) {
            logger.error("Error while copying S3 object file {}/{} to '{}/{}': {}", fromBucket, fromObjectKey, toBucket, toObjectKey, e.getMessage());
        }
    }
}
