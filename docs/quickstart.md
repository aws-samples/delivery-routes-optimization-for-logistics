# Quickstart guide

## 1. Deployment
## 1.1 Project Config
1. Create an AWS Profile on your development machine to deploy this project (e.g.: `my-deployment-profile`)
1. Navigate to `infra/config`
   1. Copy the `default.yml` file to a new file `local-XXXXXXXXXXXX.yml` where `XXXXXXXXXXXX` is your AWS ACCOUNT ID
   1. Replace the config settings to your own values. Mandatory changes to `account`, `administratorEmail` fields
   1. Replace your Mapbox API token to `mapBoxToken` fields. 
   
1. Make sure you have all the required tools installed on your dev machine (*tested on mac*).

## 1.2 Deployment
1. Check project config

1. Navigate to the root of the project and edit the variables of `deploy_stacks.sh`.

   > IMPORTANT: Make sure the `namespace` values match in `infra/config` and in the `deploy_stacks.sh` script

1. Then run the deployment script
   
   ```sh
   ./deploy_stacks.sh
   ```

---

## 2. Run Demo witn sample data

### 2.1 Upload sample data
1. Check project config
1. Check deployment cdk stacks are completed
1. Navigate to `infra/scripts`
   1. open `uplaod-master-data.sh` in code editor, and edit `PROFILE` and `REGION` for your AWS ACCOUNT
   1. run `uplaod-master-data.sh`
   1. open `open-demo-webui.sh` in code editor, and edit `PROFILE` and `REGION` for your AWS ACCOUNT 
   1. run `open-demo-webui.sh`
1. Move to web ui
   1. Check web browser opened, and sign in webpage shows
   1. If web browser is now opened automatically, find web-url in console which you run `open-demo-webui.sh` file
   1. Create account and confirm mail code. 
1. Check master data on web ui
   1. Sign in
   1. Check master data is placed data on menus 'Customer Location', 'Warehouse', 'Vehicles' 

### 2.2 Run Order dispatching and route optimization job
1. Sign in web ui   
   1. Click 'Distance Cache' menu
   1. Click 'Rebuild Distancd Cache' Button
   1. Input warehouse code `95001200` and click ReBuild Button
   1. Wait until distance cache is built. It takes few minutes.
1. Return back to commandline, Navigate to `infra/scripts`
   1. open `uplaod-order-with-presigned-url.sh` in code editor, and edit `PROFILE` and `REGION` for your AWS ACCOUNT
   1. run `uplaod-order-with-presigned-url.sh`
   1. Wait until distance cache is built. It takes few minutes.
   1. You can see the result at 'Solver Jobs' menu in web ui

---

## 3. Local Development

### 3.1 Web UI 
1. Open and update variables in `infra/scripts/pull-appvariables-js.sh`
1. Run it
1. Navigate to `apps/website`
1. Run `yarn start`

### 3.2 Optimziation Engine
1. Open `opt-engine/core/core-impl/src/main/resources/application.properties`
   1. update values `aws.region`, `%dev.aws.profile`, `%dev.aws.region`, `%test.aws.profile`, `%test.aws.region`
1. Open `opt-engine/apps/nextday-delivery/src/main/resources/application.properties`
   1. update values `aws.region`, `%dev.aws.profile`, `%dev.aws.region`, `%test.aws.profile`, `%test.aws.region`
1. Open `opt-engine/apps/nextday-delivery/pom.xml`
   1. unlock comment block in line 62 ~ 66 to build `dev` profile
1. Open `opt-engine` folder in your Java IDE
   1. build whole projects
1. Open `opt-engine/apps/nextday-delivery/scripts/dev-run-engine.sh`
   1. update `PROFILE`, `REGION`, `ORDER_DATE`, `WAREHOUSE_CODE`
   1. run `dev-run-engine.sh`dev-run-engine.sh`

-- 

## Uninstall

See [Uninstall](./docs/content/screenshots.md) guide.