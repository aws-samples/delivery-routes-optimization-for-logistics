/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { StackProps } from 'aws-cdk-lib'

export interface InstanceOptionStackProps extends StackProps {
    readonly instanceOptions: Record<string, string>
}