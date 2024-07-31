#!/usr/bin/env node
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

import fse = require("fs-extra");
import { resolve, relative } from "path";

const module_path = resolve(__dirname);
const test_is_in_node_modules = /node_modules/g.exec(module_path);
if (test_is_in_node_modules === null && process.argv.length === 1) {
  process.exit(0);
}
const rootPath = resolve(__dirname, '..', "..", "..");
const ln = resolve(module_path, "viewerForgeFiles");
const browserPath = resolve(rootPath, ".browser_organs");
const browserViewerForgeFilesPath = resolve(browserPath, "viewerForgeFiles");
const nerveCenterPath = resolve(rootPath, "nerve-center");
const memoryPath = resolve(nerveCenterPath, "memory");
const nerveCenterViewerForgeFilesPath = resolve(memoryPath, "viewerForgeFiles");

fse.ensureDirSync(nerveCenterViewerForgeFilesPath);
if (!fse.existsSync(ln)) {
  fse.symlinkSync(relative(module_path, nerveCenterViewerForgeFilesPath), ln);
}

fse.ensureDirSync(browserPath);
if (!fse.existsSync(browserViewerForgeFilesPath)) {
  fse.symlinkSync(relative(browserPath, nerveCenterViewerForgeFilesPath), browserViewerForgeFilesPath);
}
