---
to: <%= packageDir %>/package.json
---
{
  "name": "<%= packageName %>",
  "description": "<%= description %>",
  "version": "<%= version %>",
  "license": "<%= license %>",
  <%_ if(!locals.noAuthor){ _%>
  "author": "<%- author %>",
  <%_ } _%>
  <%_ if(locals.homepage){ _%>
  "homepage": "<%- homepage %>",
  <%_ } _%>
  <%_ if(locals.repository){ _%>
  "repository": {
    "type": "git",
    "url": "<%- repository %>"
  },
  <%_ } _%>
  "main": "dist/index.js",
  "typings": "dist/index.d.ts",
  "directories": {
    "lib": "dist",
    "test": "test"
  },
  "scripts": {
    "clean": "rm -rf dist",
    "build": "tsc --project tsconfig.json",
    "watch": "yarn build --watch",
    "test": "jest"
  },
  "peerDependencies": {
    "aws-cdk-lib": "^2.59.0",
    "constructs": "^10.1.211",
    "typescript": "^4.5.5"
  }
}
