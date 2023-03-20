# `@infra/cognito-auth`

System wide a8n.

This package exposes one `NestedStack`:
  * `IdentityStackPersistent` - System wide a8n. Used for users of the website


## IdentityStackPersistent

System wide a8n. Used for users of the system

* Cognito
  * Users - UserPool - to handle users of the system
    * web-app userpool client
    * `Administartors` user group
    * `Admin` user

## Usage

```ts
import { IdentityStack } from '@infra/cognito-auth'

const identityStack = new IdentityStack(this, 'IdentityStack', {
    administratorEmail,
    administratorName,
})
```
