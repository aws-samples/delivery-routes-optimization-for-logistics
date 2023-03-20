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
import software.amazon.awssdk.services.ssm.SsmClient;
import software.amazon.awssdk.services.ssm.model.GetParameterRequest;
import software.amazon.awssdk.services.ssm.model.GetParameterResponse;

public class SsmUtility {
    private static final Logger logger = LoggerFactory.getLogger(SsmUtility.class);

    public static String getParameterValue(String parameterName) {
        AwsCredentialsProvider credentialsProvider = CredentialsHelper.getCredentialsProvider();

        SsmClient ssmClient = SsmClient.builder()
                .credentialsProvider(credentialsProvider)
                .region(CredentialsHelper.getRegion())
                .build();

        GetParameterRequest getParameterRequest = GetParameterRequest.builder()
                .name(parameterName)
                .build();

        try {
            GetParameterResponse getParameterResponse = ssmClient.getParameter(getParameterRequest);
            String result = getParameterResponse.parameter().value();

            logger.info("SSM Parameter successfully retrieved from SSM Parameter Store: {} = {}", parameterName, result);

            return result;
        } catch (AwsServiceException e) {
            logger.error("GetParameter :: AwsServiceException :: {}", e.getMessage());
        } catch (SdkClientException e) {
            logger.error("GetParameter :: SdkClientException :: {}", e.getMessage());
        }

        return null;
    }
}
