/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as cdkconsts from 'cdk-constants'
import { Construct } from 'constructs'
import {
  aws_ssm as ssm,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecr_assets as ecr_assets,
  aws_autoscaling as asc,
  aws_iam as iam,
  aws_logs as logs,
} from 'aws-cdk-lib'
import { namespaced, regionalNamespaced } from '@aws-samples/common'

export interface EcsEc2TaskProps {
  readonly vpc: ec2.IVpc
  readonly keyClusterName: string
  readonly keyCapacityProvider: string
  readonly keyTaskDefArn: string
  readonly keyContainerName: string
  readonly taskPolicies?: { [name: string]: iam.PolicyDocument }
  readonly instanceOptions: {
    instanceType: string,
    hardwareType: string
  }
  readonly dockerImagePath: string
  readonly taskCommands: string[]
}

export class EcsEc2Task extends Construct {
  readonly taskDef: ecs.TaskDefinition

  constructor(scope: Construct, id: string, props: EcsEc2TaskProps) {
    super(scope, id)

    const {
      vpc,
      keyClusterName,
      keyCapacityProvider,
      keyTaskDefArn,
      keyContainerName,
      taskPolicies,
      instanceOptions : {instanceType, hardwareType},
      dockerImagePath,
      taskCommands,
    } = props

    const ecsInstanceType = new ec2.InstanceType(instanceType)
    const ecsHardwareType = (hardwareType === 'arm64') ? ecs.AmiHardwareType.ARM : ecs.AmiHardwareType.STANDARD
    const ecsMachineImage = ecs.EcsOptimizedImage.amazonLinux2(ecsHardwareType)
    const dockerPlatform = (hardwareType === 'arm64') ? ecr_assets.Platform.LINUX_ARM64 : ecr_assets.Platform.LINUX_AMD64

    // Capacity Provider
    const capacityProvider = new ecs.AsgCapacityProvider(this, `${id}ASGCapacityProvider`, {
      autoScalingGroup: new asc.AutoScalingGroup(this, `${id}ASG`, {
        vpc: vpc,
        instanceType: ecsInstanceType,
        machineImage: ecsMachineImage,
        desiredCapacity: 0,
        minCapacity: 0,
        maxCapacity: 1,
      }),
    })
    new ssm.StringParameter(this, `${id}CapacityProviderParams`, {
      parameterName: keyCapacityProvider,
      stringValue: capacityProvider.capacityProviderName,
      description: `CapacityProviderParams for ${id}`,
    })

    // ECS Cluster
    const cluster = new ecs.Cluster(this, `${id}Cluster`, { vpc })
    cluster.addAsgCapacityProvider(capacityProvider)
    new ssm.StringParameter(this, `${id}EcsClusterParams`, {
      parameterName: keyClusterName,
      stringValue: cluster.clusterName,
      description: `Cluster name for ${id}`,
    })

    // Task Role
    const dispatcherTaskRole = new iam.Role(this, `${id}TaskRole`, {
      assumedBy: new iam.ServicePrincipal(cdkconsts.ServicePrincipals.ECS_TASKS),
      description: `Role for ${id} ECS Task`,
      inlinePolicies: taskPolicies,
      roleName: regionalNamespaced(this, `${id}-TaskRole`),
    })

    // Task Definition
    const taskDef = new ecs.TaskDefinition(this, `${id}TaskDef`, {
      taskRole: dispatcherTaskRole,
      compatibility: ecs.Compatibility.EC2,
      cpu: '8192',
      memoryMiB: '15000',
    })
    new ssm.StringParameter(this, `${id}EcsTaskParams`, {
      parameterName: keyTaskDefArn,
      stringValue: taskDef.taskDefinitionArn,
      description: `Task Definition ARN for ${id}`,
    })

    // Container Image
    const dispatcherImage = new ecr_assets.DockerImageAsset(this, `${id}Image`, {
      directory: dockerImagePath,
      platform: dockerPlatform
    })

    // Container set-up
    const containerName = namespaced(this, `${id}-container`)
    taskDef.addContainer(`${id}Container`, {
      containerName: containerName,
      image: ecs.ContainerImage.fromDockerImageAsset(dispatcherImage),
      command: taskCommands,
      cpu: 8192,
      memoryLimitMiB: 15000,
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: id,
        logRetention: logs.RetentionDays.ONE_DAY,
      }),
    })
    new ssm.StringParameter(this, `${id}ContainerParams`, {
      parameterName: keyContainerName,
      stringValue: containerName,
      description: `Task Definition Container name for ${id}`,
    })

    this.taskDef = taskDef
  }
}
