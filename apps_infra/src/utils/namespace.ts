/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Namespace utilities for prefixing resource names with a project-level namespace.
 * This ensures resource names are unique across multiple deployments in the same account.
 * The namespace is stored in CDK context and retrieved by helper functions.
 */
import { Stack } from 'aws-cdk-lib'
import { Construct } from 'constructs'

const NAMESPACE_KEY = 'apps-infra:namespace'

/** Set the namespace context on the stack (call once per stack in constructor) */
export function setNamespace(scope: Construct, namespace: string): void {
  Stack.of(scope).node.setContext(NAMESPACE_KEY, namespace)
}

/** Prefix a name with the namespace: e.g. "devproto-MyResource" */
export function namespaced(scope: Construct, name: string): string {
  const ns = Stack.of(scope).node.tryGetContext(NAMESPACE_KEY) as string | undefined
  return ns ? `${ns}-${name}` : name
}

/** Prefix a bucket name with namespace (lowercase for S3 naming rules) */
export function namespacedBucket(scope: Construct, name: string): string {
  const stack = Stack.of(scope)
  const ns = stack.node.tryGetContext(NAMESPACE_KEY) as string | undefined
  return (ns ? `${ns}-${name}` : name).toLowerCase()
}

/** Prefix with region + namespace: e.g. "us-east-1-devproto-MyResource" */
export function regionalNamespaced(scope: Construct, name: string): string {
  return `${Stack.of(scope).region}-${namespaced(scope, name)}`
}
