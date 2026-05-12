/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * ECS Fargate Task construct.
 * Creates an ECS cluster with a Fargate task definition.
 * Tasks are launched on-demand via RunTask (no always-running instances).
 */
import { Construct } from 'constructs'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Platform } from 'aws-cdk-lib/aws-ecr-assets'
import { namespaced } from '../utils/namespace'

export interface EcsFargateTaskProps {
  readonly vpc: ec2.IVpc
  readonly dockerImagePath: string
  readonly taskCommands?: string[]
  /** Fargate CPU units (256, 512, 1024, 2048, 4096, 8192, 16384) */
  readonly cpu?: number
  /** Fargate memory in MiB (must be compatible with cpu) */
  readonly memoryMiB?: number
  readonly hardwareType: 'arm64' | 'x86_64'
  readonly taskRole?: iam.IRole
  /** Inline policies to attach to the task role */
  readonly taskPolicies?: { [name: string]: iam.PolicyDocument }
}

export class EcsFargateTask extends Construct {
  public readonly cluster: ecs.Cluster
  public readonly taskDefinitionArn: string
  public readonly containerName: string
  public readonly taskDef: ecs.FargateTaskDefinition

  constructor(scope: Construct, id: string, props: EcsFargateTaskProps) {
    super(scope, id)

    // ECS Cluster (Fargate — no EC2 instances to manage)
    this.cluster = new ecs.Cluster(this, 'Cluster', { vpc: props.vpc })

    // Task Role (with inline policies for container-level access)
    const taskRole =
      props.taskRole ??
      new iam.Role(this, 'TaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description: `Role for ${id} ECS Task`,
        inlinePolicies: props.taskPolicies,
      })

    // Fargate Task Definition
    const runtimePlatform: ecs.RuntimePlatform = {
      cpuArchitecture:
        props.hardwareType === 'arm64'
          ? ecs.CpuArchitecture.ARM64
          : ecs.CpuArchitecture.X86_64,
      operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
    }

    this.taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      taskRole,
      cpu: props.cpu ?? 4096,
      memoryLimitMiB: props.memoryMiB ?? 8192,
      runtimePlatform,
    })

    // Container Image (built from Docker context path)
    const platform = props.hardwareType === 'arm64' ? Platform.LINUX_ARM64 : Platform.LINUX_AMD64

    // Container set-up
    const containerName = namespaced(this, `${id}-container`)
    const container = this.taskDef.addContainer('MainContainer', {
      containerName,
      image: ecs.ContainerImage.fromAsset(props.dockerImagePath, { platform }),
      command: props.taskCommands,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: id,
        logRetention: logs.RetentionDays.ONE_DAY,
      }),
    })

    this.taskDefinitionArn = this.taskDef.taskDefinitionArn
    this.containerName = container.containerName
  }
}
