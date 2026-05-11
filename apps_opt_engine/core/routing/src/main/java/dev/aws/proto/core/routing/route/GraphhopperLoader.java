/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * GraphHopper 11 migration notes:
 *   - CarFlagEncoder / MotorcycleFlagEncoder / FlagEncoderFactory were removed.
 *     Profiles are now registered with a CustomModel. GraphHopper ships built-in
 *     CustomModel presets in its jar (e.g. car.json).
 *   - setEncodedValuesString(...) is required when the CustomModel references
 *     encoded values such as car_access / car_average_speed / road_access.
 *   - Motorcycle is intentionally omitted here: GraphHopper 11 does not ship a
 *     motorcycle CustomModel out of the box.
 */

package dev.aws.proto.core.routing.route;

import com.graphhopper.GraphHopper;
import com.graphhopper.config.Profile;
import com.graphhopper.util.GHUtility;
import dev.aws.proto.core.exception.DispatcherException;
import dev.aws.proto.core.util.PathHelper;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Loader for the GraphHopper router.
 * Initializes the cache folders and builds the cache if it doesn't exist.
 */
public class GraphhopperLoader {
    private static final Logger logger = LoggerFactory.getLogger(GraphhopperLoader.class);

    private final Path localOsmDir;
    private final Path localGraphhopperCacheDir;
    private final Path osmFilePath;

    @Getter
    private GraphHopper hopper;

    private final Lock initLock = new ReentrantLock();

    public GraphhopperLoader(String localOsmDir, String localGraphhopperCacheDir, String osmFile) {
        this.localOsmDir = PathHelper.getAbsPath(localOsmDir);
        this.localGraphhopperCacheDir = PathHelper.getAbsPath(localGraphhopperCacheDir);
        this.osmFilePath = this.localOsmDir.resolve(osmFile).toAbsolutePath();
    }

    public void initAndLoad() {
        initLock.lock();
        try {
            logger.trace("Checking local directory that has the OSM file");
            if (!this.localOsmDir.toFile().exists()) {
                logger.warn("{} dir doesn't exist. Creating local OSM dir.", this.localOsmDir);
                Files.createDirectories(this.localOsmDir);
            }
            logger.debug("Local OSM dir ({}) ok", this.localOsmDir);

            logger.trace("Checking graphhopper cache dir");
            if (!this.localGraphhopperCacheDir.toFile().exists()) {
                logger.warn("{} dir doesn't exist. Creating local graphhopper dir.", this.localGraphhopperCacheDir);
                Files.createDirectories(this.localGraphhopperCacheDir);
            }
            logger.debug("Local Graphhopper cache dir ({}) ok", this.localGraphhopperCacheDir);

            logger.trace("Checking OSM mapfile");
            if (!this.osmFilePath.toFile().exists()) {
                logger.error("{} local osm file doesn't exist. Quitting...", this.osmFilePath);
                throw new FileNotFoundException("Local OSM file doesn't exist (" + this.osmFilePath + ")");
            }
            logger.debug("Local OSM file ({}) ok", this.osmFilePath);

            this.hopper = this.importAndLoad();
        } catch (IOException e) {
            throw new DispatcherException("Can't find local OSM and/or Graphhopper dirs", e);
        } finally {
            initLock.unlock();
        }
    }

    private GraphHopper importAndLoad() {
        GraphHopper hopper = new GraphHopper();
        logger.info("Importing OSM file and cache: {}", osmFilePath);
        logger.debug("Loading GraphHopper with CAR profile (custom model)");

        hopper.setOSMFile(this.osmFilePath.toString());
        hopper.setGraphHopperLocation(this.localGraphhopperCacheDir.toString());

        // Required: encoded values referenced by the built-in car CustomModel
        hopper.setEncodedValuesString("car_access, car_average_speed, road_access");

        // Register a car profile with its built-in CustomModel (car.json from graphhopper-core)
        hopper.setProfiles(
                new Profile("car").setCustomModel(GHUtility.loadCustomModelFromJar("car.json"))
        );

        hopper.setMinNetworkSize(600);
        hopper.importOrLoad();

        logger.debug("GraphHopper loading successful");

        return hopper;
    }
}
