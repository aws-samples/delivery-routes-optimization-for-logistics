/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - @ApplicationScoped -> @Configuration.
 *   - @Inject field injection -> constructor injection.
 *   - Solver-config.xml search logic is preserved (dev/prod).
 */
package dev.aws.proto.apps.appcore.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileNotFoundException;
import java.nio.file.Paths;

/**
 * Class for loading the solver config based on execution profile.
 */
@Configuration
@EnableConfigurationProperties(SolutionProperties.class)
public class SolutionConfig {
    private static final Logger logger = LoggerFactory.getLogger(SolutionConfig.class);

    private final String solverConfigXmlPath;

    public SolutionConfig(SolutionProperties solutionProperties) {
        this.solverConfigXmlPath = solutionProperties.solverConfigXmlPath();
    }

    /**
     * Path to the solver's config xml file. If the execution profile is "dev", it loads
     * from the "resources"; otherwise from external file.
     *
     * @return The absolute path to the solver's config xml.
     */
    public String getSolverConfigXmlPath() {
        try {
            File configFile = Paths.get(solverConfigXmlPath).toFile();

            if (!configFile.exists()) {
                logger.warn("getSolverConfigXmlPath >> cannot find file - {}, retry dev mode file", solverConfigXmlPath);

                String configPath = "../src/main/resources/" + solverConfigXmlPath;
                configFile = Paths.get(configPath).toFile();
                if (configFile.exists()) {
                    logger.info("getSolverConfigXmlPath >> use dev-config file - {}", solverConfigXmlPath);
                    return configFile.getAbsolutePath();
                }

                logger.warn("getSolverConfigXmlPath >> cannot find file - {}, retry project debug mode file", solverConfigXmlPath);
                configPath = "src/main/resources/" + solverConfigXmlPath;
                configFile = Paths.get(configPath).toFile();
                if (configFile.exists()) {
                    logger.info("getSolverConfigXmlPath >> use debug-config file - {}", solverConfigXmlPath);
                    return configFile.getAbsolutePath();
                } else {
                    logger.error("getSolverConfigXmlPath >> cannot find file - {}, please check file", solverConfigXmlPath);
                    throw new FileNotFoundException("getSolverConfigXmlPath >> cannot find file " + solverConfigXmlPath);
                }
            }

            return configFile.getAbsolutePath();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }

        return null;
    }
}
