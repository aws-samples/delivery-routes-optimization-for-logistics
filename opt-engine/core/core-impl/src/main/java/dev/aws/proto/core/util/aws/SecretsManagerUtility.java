/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.util.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.InvalidParameterException;
import software.amazon.awssdk.services.secretsmanager.model.ResourceNotFoundException;

public class SecretsManagerUtility {
    private static final Logger logger = LoggerFactory.getLogger(SecretsManagerUtility.class);

    public static String getSecretValue(String secretName) {
        AwsCredentialsProvider credentialsProvider = CredentialsHelper.getCredentialsProvider();

        SecretsManagerClient secretsManagerClient = SecretsManagerClient.builder()
                .credentialsProvider(credentialsProvider)
                .region(CredentialsHelper.getRegion())
                .build();

        GetSecretValueRequest getSecretValueRequest = GetSecretValueRequest.builder()
                .secretId(secretName)
                .build();

        try {
            GetSecretValueResponse getSecretValueResponse = secretsManagerClient.getSecretValue(getSecretValueRequest);
            String result = getSecretValueResponse.secretString().toString();

            logger.info("ApiKey value successfully retrieved from SecretsManager[{}]", secretName);

            return result;
        } catch (ResourceNotFoundException e) {
            logger.error("GetSecretValue :: ResourceNotFoundException :: {}", e.getMessage());
        } catch (InvalidParameterException e) {
            logger.error("GetSecretValue :: InvalidParameterException :: {}", e.getMessage());
        }

        return null;
    }
}
