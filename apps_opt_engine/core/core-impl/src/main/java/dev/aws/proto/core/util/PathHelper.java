/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.util;

import java.nio.file.Path;
import java.nio.file.Paths;

public class PathHelper {
    public static Path getAbsPath(String path) {
        if (path.startsWith("~")) {
            path = path.replaceFirst("^~", System.getProperty("user.home"));
        }
        return Paths.get(path).toAbsolutePath();
    }
}
