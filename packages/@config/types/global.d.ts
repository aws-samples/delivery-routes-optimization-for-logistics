export {}

declare global {
  namespace NPM {
    /**
     * NPM package.json schema info
     */
    export interface Package {
      name: string
      description: string
      version: string
      dependencies: {
        [key: string]: string
      }
      devDependencies: {
        [key: string]: string
      }
      peerDependencies: {
        [key: string]: string
      }
    }
  }
}
