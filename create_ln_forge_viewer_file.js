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


var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var rootPath = path.resolve('../..');
var module_path = path.resolve('.');
var package_path = path.resolve(module_path + '/package.json');
var ln = path.resolve(module_path + '/viewerForgeFiles');
var browserPath = path.resolve(rootPath + '/.browser_organs');
var viewerForgeFiles = path.resolve(browserPath + '/viewerForgeFiles');

mkdirp(viewerForgeFiles, function (err) {
  if (err) console.error(err);
  else {
    if (!fs.existsSync(ln)) {
      fs.symlinkSync(path.relative(module_path, viewerForgeFiles), ln);
    }
  }
});