/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { Construct } from 'constructs'
import * as core from 'aws-cdk-lib'
import { aws_cognito as cognito, aws_iam as iam } from 'aws-cdk-lib'
import { namespaced } from '@infra/common'

const COGNITO_IDENTITY_PRINCIPLE = 'cognito-identity.amazonaws.com'

export enum CognitoFederatedRoleMappingKey {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
}

export interface IdentityStackProps extends core.NestedStackProps {
  readonly administratorEmail: string
  readonly administratorName: string
}

export class IdentityStack extends core.NestedStack {
  public readonly authenticatedRole: iam.IRole

  public readonly userPool: cognito.UserPool

  public readonly identityPool: cognito.CfnIdentityPool

  public readonly webAppClient: cognito.UserPoolClient

  get userPoolId(): string {
    return this.userPool.userPoolId
  }

  get identityPoolId(): string {
    return this.identityPool.ref
  }

  get webAppClientId(): string {
    return this.webAppClient.userPoolClientId
  }

  constructor(scope: Construct, id: string, props: IdentityStackProps) {
    super(scope, id, props)

    const { administratorEmail } = props

    const userPool = new cognito.UserPool(this, namespaced(this, 'UserPool'), {
      userPoolName: namespaced(this, 'Users'),
      standardAttributes: {
        email: {
          mutable: true,
          required: true,
        },
        phoneNumber: {
          mutable: true,
          required: true,
        },
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      deviceTracking: {
        challengeRequiredOnNewDevice: false,
        deviceOnlyRememberedOnUserPrompt: false,
      },
    })

    this.userPool = userPool
    this.webAppClient = userPool.addClient('web-app')

    this.identityPool = new cognito.CfnIdentityPool(this, namespaced(this, 'IdentityPool'), {
      identityPoolName: namespaced(this, 'IdentityPool'),
      cognitoIdentityProviders: [
        { clientId: this.webAppClient.userPoolClientId, providerName: userPool.userPoolProviderName },
      ],
      allowUnauthenticatedIdentities: false,
    })

    // This is the role that users will assume when authenticated via cognito
    this.authenticatedRole = new iam.Role(this, 'AuthenticatedRole', {
      roleName: namespaced(this, 'authenticated-user'),
      description: 'Role for the identity pool authorized identities.',
      assumedBy: new iam.FederatedPrincipal(
        COGNITO_IDENTITY_PRINCIPLE,
        {
          StringEquals: {
            [`${COGNITO_IDENTITY_PRINCIPLE}:aud`]: this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            [`${COGNITO_IDENTITY_PRINCIPLE}:amr`]: CognitoFederatedRoleMappingKey.AUTHENTICATED,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {},
    })

    new cognito.CfnIdentityPoolRoleAttachment(this, 'IdentityPoolRoleAttachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        [CognitoFederatedRoleMappingKey.AUTHENTICATED]: this.authenticatedRole.roleArn,
      },
    })

    const adminCognitoGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      description: 'Administrator group',
      groupName: 'Administrators',
      precedence: 1,
    })
    adminCognitoGroup.applyRemovalPolicy(core.RemovalPolicy.RETAIN)

    const adminCognitoUser = new cognito.CfnUserPoolUser(this, 'AdminUser', {
      userPoolId: userPool.userPoolId,
      desiredDeliveryMediums: ['EMAIL'],
      forceAliasCreation: true,
      userAttributes: [
        { name: 'email', value: administratorEmail },
        { name: 'email_verified', value: 'true' },
      ],
      username: administratorEmail,
    })
    adminCognitoUser.applyRemovalPolicy(core.RemovalPolicy.RETAIN)

    // adminGroupAssignment
    new cognito.CfnUserPoolUserToGroupAttachment(this, 'AdminGroupAssignment', {
      userPoolId: userPool.userPoolId,
      groupName: adminCognitoGroup.ref,
      username: adminCognitoUser.ref,
    })

    new core.CfnOutput(this, 'UserPoolIdOutput', {
      exportName: namespaced(this, 'UserPoolId'),
      value: this.userPoolId,
    })

    new core.CfnOutput(this, 'IdentityPoolIdOutput', {
      exportName: namespaced(this, 'IdentityPoolId'),
      value: this.identityPoolId,
    })

    new core.CfnOutput(this, 'WebAppClientIdOutput', {
      exportName: namespaced(this, 'WebAppClientId'),
      value: this.webAppClientId,
    })
  }
}
