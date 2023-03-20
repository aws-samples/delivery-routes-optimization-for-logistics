/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.config;

import io.quarkus.runtime.configuration.ProfileManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.File;
import java.io.FileNotFoundException;
import java.net.URISyntaxException;
import java.nio.file.Paths;

/**
 * Class for loading the solver config based on execution profile.
 */
@ApplicationScoped
public class SolutionConfig {
    private static final Logger logger = LoggerFactory.getLogger(SolutionConfig.class);

    /**
     * Config properties.
     */
    @Inject
    SolutionProperties solutionProperties;

    /**
     * Path to the solver's config xml file.
     */
    private final String solverConfigXmlPath;

    SolutionConfig(SolutionProperties solutionProperties) {
        this.solverConfigXmlPath = solutionProperties.solverConfigXmlPath();
    }

    /**
     * Path to the solver's config xml file.
     * If the execution profile is "dev", it loads from the "resources"; otherwise from external file.
     *
     * @return The absolute path to the solver's config xml.
     */
    public String getSolverConfigXmlPath() {
        try {
            File configFile = Paths.get(solverConfigXmlPath).toFile();

            if(!configFile.exists()) {
                logger.warn("getSolverConfigXmlPath >> cannot find file - {}, retry dev mode file", solverConfigXmlPath);

                String configPath = "../src/main/resources/"+solverConfigXmlPath;
                configFile = Paths.get(configPath).toFile();
                if(configFile.exists()) {
                    logger.info("getSolverConfigXmlPath >> use dev-config file - {}", solverConfigXmlPath);
                    return configFile.getAbsolutePath();
                }

                logger.warn("getSolverConfigXmlPath >> cannot find file - {}, retry project debug mode file", solverConfigXmlPath);
                configPath = "src/main/resources/"+solverConfigXmlPath;
                configFile = Paths.get(configPath).toFile();
                if(configFile.exists()) {
                    logger.info("getSolverConfigXmlPath >> use debug-config file - {}", solverConfigXmlPath);
                    return configFile.getAbsolutePath();
                } else  {
                    logger.error("getSolverConfigXmlPath >> cannot find file - {}, please check file", solverConfigXmlPath);
                    throw new FileNotFoundException("getSolverConfigXmlPath >> cannot find file "+solverConfigXmlPath);
                }
            }

            return configFile.getAbsolutePath();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }

        return null;
    }
}
