# Implementation Plan: MapLibre Migration

## Overview

Migrate the frontend map rendering stack from Mapbox GL JS to MapLibre GL JS with OpenFreeMap as the tile provider. This involves updating package dependencies, changing imports across all map components, updating the centralized configuration, and removing the MAPBOX_TOKEN from infrastructure deployment.

## Tasks

- [x] 1. Update package dependencies and map configuration
  - [x] 1.1 Update package.json dependencies
    - Remove `mapbox-gl` and `@types/mapbox-gl` from dependencies
    - Add `maplibre-gl` ^5.24.0 as a dependency
    - Keep `react-map-gl` ^8.1.1 (supports MapLibre via subpath import)
    - Keep `@mapbox/polyline` ^1.2.1 (standalone utility, unrelated to Mapbox GL)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.2 Create centralized MAP_VARS configuration in appvars.ts
    - Replace `MAPBOX_VARS` (which used `requireVariable('MAPBOX_TOKEN')`) with `MAP_VARS`
    - Set `MAP_STYLE` to `https://tiles.openfreemap.org/styles/liberty`
    - Set `DEFAULT_LATITUDE` to 37.5577857 (Seoul station)
    - Set `DEFAULT_LONGITUDE` to 126.9697484 (Seoul station)
    - Remove runtime dependency on `MAPBOX_TOKEN` from appVariables
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Migrate map components to MapLibre
  - [x] 2.1 Migrate MapComponent to MapLibre
    - Change import from `react-map-gl/mapbox` to `react-map-gl/maplibre`
    - Change CSS import from `mapbox-gl/dist/mapbox-gl.css` to `maplibre-gl/dist/maplibre-gl.css`
    - Remove `mapboxAccessToken` prop from `<Map>` component
    - Use `MAP_VARS.MAP_STYLE` for the `mapStyle` prop
    - Use `MAP_VARS.DEFAULT_LATITUDE` and `MAP_VARS.DEFAULT_LONGITUDE` for default center
    - Retain all existing functionality: route polylines, warehouse/customer markers, geofences, polygons
    - _Requirements: 1.1, 2.4, 4.1, 4.5, 5.1, 5.2, 5.3, 5.4, 9.1, 9.4, 9.5_

  - [x] 2.2 Migrate NextDayDeliveryMap to MapLibre
    - Change import from `react-map-gl/mapbox` to `react-map-gl/maplibre`
    - Change CSS import to `maplibre-gl/dist/maplibre-gl.css`
    - Remove `mapboxAccessToken` prop from `<Map>` component
    - Use `MAP_VARS.MAP_STYLE` for the `mapStyle` prop
    - Retain route polyline rendering and origin/destination markers
    - _Requirements: 1.2, 4.2, 4.5, 5.6, 9.2_

  - [x] 2.3 Migrate PolygonMap to MapLibre
    - Change import from `react-map-gl/mapbox` to `react-map-gl/maplibre`
    - Change CSS import to `maplibre-gl/dist/maplibre-gl.css`
    - Remove `mapboxAccessToken` prop from `<Map>` component
    - Use `MAP_VARS.MAP_STYLE` for the `mapStyle` prop
    - Retain polygon overlay rendering with semi-transparent fill
    - _Requirements: 1.3, 4.3, 4.5, 5.5, 9.3_

  - [x] 2.4 Migrate MapPin to MapLibre
    - Change marker import from `react-map-gl/mapbox` to `react-map-gl/maplibre`
    - Retain icon variants (house, person, face, restaurant) and popover behavior
    - _Requirements: 4.4, 5.7_

- [x] 3. Checkpoint - Verify frontend map rendering
  - Ensure all map components render correctly with MapLibre GL and OpenFreeMap tiles, ask the user if questions arise.

- [x] 4. Update infrastructure to remove MAPBOX_TOKEN
  - [x] 4.1 Update BackendStack CDK to remove MAPBOX_TOKEN from appvars.js
    - Modify the `appVarsContent` generation to exclude MAPBOX_TOKEN
    - Ensure generated appvars.js contains only: REGION, USERPOOL_ID, USERPOOL_CLIENT_ID, API_URL
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 4.2 Update Config Schema to make mapBoxToken optional
    - Change `mapBoxToken` field in `RootConfigSchema` from required to `z.string().optional()`
    - Ensure existing configs with `mapBoxToken` still validate successfully
    - Ensure configs without `mapBoxToken` also validate successfully
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 5. Checkpoint - Verify infrastructure changes
  - Ensure CDK synth succeeds without mapBoxToken, ask the user if questions arise.

- [x] 6. Verify polyline decoding and write tests
  - [x] 6.1 Verify @mapbox/polyline integration with MapLibre
    - Confirm `@mapbox/polyline.toGeoJSON` produces valid GeoJSON LineString geometry
    - Confirm decoded polylines render correctly as MapLibre GeoJSON source layers
    - _Requirements: 6.1, 6.2_

  - [x]* 6.2 Write property test for polyline decoding (Property 1)
    - **Property 1: Polyline Decoding Produces Valid GeoJSON**
    - For any valid encoded polyline string, decoding produces a valid GeoJSON LineString with coordinates as [longitude, latitude] pairs within valid ranges
    - **Validates: Requirements 5.1, 6.2**

  - [x]* 6.3 Write property test for config schema optional mapBoxToken (Property 2)
    - **Property 2: Config Schema Accepts Optional mapBoxToken**
    - For any valid configuration object with a mapBoxToken string field, schema validation passes
    - **Validates: Requirement 8.1**

  - [x]* 6.4 Write property test for config schema required fields (Property 3)
    - **Property 3: Config Schema Rejects Missing Required Fields**
    - For any required field removed from a valid config, schema validation fails
    - **Validates: Requirement 8.3**

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `@mapbox/polyline` package is retained as it is a standalone polyline utility unrelated to Mapbox GL rendering
- All tasks are marked complete as this migration has been fully implemented

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "2.4", "4.1", "4.2"] },
    { "id": 2, "tasks": ["6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4"] }
  ]
}
```
