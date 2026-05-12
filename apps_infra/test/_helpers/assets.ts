/**
 * Test helper: create dummy asset directories in the OS tmpdir so that CDK
 * `s3deploy.Source.asset(...)` and `ecs.ContainerImage.fromAsset(...)` can be
 * invoked during `cdk synth` without depending on real build output on disk.
 *
 * Each test entrypoint should call `createDummyAssets()` once (e.g. in
 * `beforeAll`) and receive back paths that can be plugged into the stack
 * `assets` props. `cleanupDummyAssets()` should be invoked in `afterAll`.
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

export interface DummyAssetPaths {
  readonly root: string
  readonly websiteBundlePath: string
  readonly distanceCacheDockerPath: string
  readonly optEngineDockerPath: string
}

const MINIMAL_INDEX_HTML = '<!doctype html><title>test</title>'

// Smallest Dockerfile that CDK can still stage as a Docker asset.
// No FROM is required for asset staging because CDK only hashes directory
// contents at synth time; the image is built at deploy time.
const MINIMAL_DOCKERFILE = 'FROM scratch\n'

export function createDummyAssets(prefix = 'apps-infra-test-assets-'): DummyAssetPaths {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix))

  const websiteBundlePath = path.join(root, 'website')
  const distanceCacheDockerPath = path.join(root, 'distancecache-util')
  const optEngineDockerPath = path.join(root, 'nextday-delivery')

  fs.mkdirSync(websiteBundlePath, { recursive: true })
  fs.writeFileSync(path.join(websiteBundlePath, 'index.html'), MINIMAL_INDEX_HTML)

  fs.mkdirSync(distanceCacheDockerPath, { recursive: true })
  fs.writeFileSync(path.join(distanceCacheDockerPath, 'Dockerfile'), MINIMAL_DOCKERFILE)

  fs.mkdirSync(optEngineDockerPath, { recursive: true })
  fs.writeFileSync(path.join(optEngineDockerPath, 'Dockerfile'), MINIMAL_DOCKERFILE)

  return { root, websiteBundlePath, distanceCacheDockerPath, optEngineDockerPath }
}

export function cleanupDummyAssets(paths: DummyAssetPaths | undefined): void {
  if (!paths) return
  fs.rmSync(paths.root, { recursive: true, force: true })
}
