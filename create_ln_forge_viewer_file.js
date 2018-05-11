#!/usr/bin/env node

/**
 * Copyright 2015 SpinalCom - www.spinalcom.com
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

var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var module_path = path.resolve(".");
let test_is_in_node_modules = /node_modules/g.exec(module_path);
if (test_is_in_node_modules === null) {
  process.exit(0);
}
var rootPath = path.resolve("../..");
var ln = path.resolve(module_path + "/viewerForgeFiles");
var browserPath = path.resolve(rootPath + "/.browser_organs");
var viewerForgeFiles = path.resolve(browserPath + "/viewerForgeFiles");
var nerveCenter = path.resolve(rootPath + "/nerve-center");
var nerveCenterViewerForgeFiles = path.resolve(
  nerveCenter + "/viewerForgeFiles"
);

mkdirp(nerveCenterViewerForgeFiles, function(err) {
  if (err) console.error(err);
  else {
    if (!fs.existsSync(ln)) {
      fs.symlinkSync(
        path.relative(module_path, nerveCenterViewerForgeFiles),
        ln
      );
    }
  }
});
mkdirp(browserPath, function(err) {
  if (err) console.error(err);
  else {
    if (!fs.existsSync(viewerForgeFiles)) {
      fs.symlinkSync(
        path.relative(browserPath, nerveCenterViewerForgeFiles),
        viewerForgeFiles
      );
    }
  }
});
