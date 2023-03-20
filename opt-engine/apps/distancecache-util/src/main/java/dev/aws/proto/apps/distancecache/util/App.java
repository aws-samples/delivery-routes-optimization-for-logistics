/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.distancecache.util;

import dev.aws.proto.apps.distancecache.util.commands.BuildLatLongCache;
import dev.aws.proto.apps.distancecache.util.commands.ImportLatLongCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import picocli.CommandLine;
import picocli.CommandLine.Command;

import java.util.concurrent.Callable;

@Command(
        name = "distance-cache-util", mixinStandardHelpOptions = true,
        version = "1.0",
        description = "Utility to import and export distance cache for lat/long distance matrices",
        commandListHeading = "%nCommands:%n%nThe most commonly used git commands are:%n",
        footer = "%nSee 'distance-cache-util help <command>' to read about a specific subcommand or concept.",
        subcommands = {
                BuildLatLongCache.class,
                ImportLatLongCache.class,
        }
)
public class App implements Callable<Integer> {
    private static final Logger logger = LoggerFactory.getLogger(App.class);

    @CommandLine.Spec
    CommandLine.Model.CommandSpec spec;

    public static void main(String[] args) {
        int exitCode = new CommandLine(new App()).execute(args);
        System.exit(exitCode);
    }


    @Override
    public Integer call() throws Exception {
        spec.commandLine().usage(System.err);
        return 1;
    }
}
