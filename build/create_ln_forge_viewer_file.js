#!/usr/bin/env node
"use strict";
/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fse = require("fs-extra");
const path_1 = require("path");
const module_path = (0, path_1.resolve)(__dirname);
const test_is_in_node_modules = /node_modules/g.exec(module_path);
if (test_is_in_node_modules === null && process.argv.length === 1) {
    process.exit(0);
}
const rootPath = (0, path_1.resolve)(__dirname, '..', "..", "..");
const ln = (0, path_1.resolve)(module_path, "viewerForgeFiles");
const browserPath = (0, path_1.resolve)(rootPath, ".browser_organs");
const browserViewerForgeFilesPath = (0, path_1.resolve)(browserPath, "viewerForgeFiles");
const nerveCenterPath = (0, path_1.resolve)(rootPath, "nerve-center");
const memoryPath = (0, path_1.resolve)(nerveCenterPath, "memory");
const nerveCenterViewerForgeFilesPath = (0, path_1.resolve)(memoryPath, "viewerForgeFiles");
fse.ensureDirSync(nerveCenterViewerForgeFilesPath);
if (!fse.existsSync(ln)) {
    fse.symlinkSync((0, path_1.relative)(module_path, nerveCenterViewerForgeFilesPath), ln);
}
fse.ensureDirSync(browserPath);
if (!fse.existsSync(browserViewerForgeFilesPath)) {
    fse.symlinkSync((0, path_1.relative)(browserPath, nerveCenterViewerForgeFilesPath), browserViewerForgeFilesPath);
}
//# sourceMappingURL=create_ln_forge_viewer_file.js.map