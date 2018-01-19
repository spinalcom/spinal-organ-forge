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

var spinalCore = require('spinal-core-connectorjs');
var SpinalForgeSystem = require('./SpinalForgeSystem');
var path = require('path');
var fs = require('fs');
var vm = require('vm');
var Q = require('q');
var ForgeFileItem = require('spinal-lib-forgefile').ForgeFileItem;

const connect_opt = "http://" + process.env.SPINAL_USER_ID +
  ":" + process.env.SPINAL_PASSWORD + "@" + process.env.SPINALHUB_IP +
  ":" + process.env.SPINALHUB_PORT + "/";

var conn = spinalCore.connect(connect_opt);

var err_connect = function (err) {
  if (!err)
    console.log("Error Connect.");
  else
    console.log("Error Connect : " + err);
  process.exit(0);
};

let wait_for_endround = (file) => {
  let deferred = Q.defer();
  let wait_for_endround_loop = (_file, defer) => {
    if (FileSystem._sig_server === false) {
      setTimeout(() => {
        defer.resolve(wait_for_endround_loop(_file, defer));
      }, 100);
    } else
      defer.resolve(_file);
    return defer.promise;
  };
  return wait_for_endround_loop(file, deferred);
};

let callback_success = (file) => {
  wait_for_endround(file).then(() => {
    if (file && file._info && file._info.model_type && file._info.model_type.get() === 'BIM Project') {
      if (file._ptr && file._ptr.data.value === 0) {
        let forgeFileItem = new ForgeFileItem();
        if (file._info.rvt) {
          file._info.rvt.load((tmp) => {
            if (!tmp) return;
            let ext = "rvt"; // default
            if (file._info.ext && file._info.ext.get()) {
              ext = file._info.ext.get();
            }
            forgeFileItem.name.set(file.name.get().toLowerCase() + '.' + ext);
            file._ptr.set(forgeFileItem);
            forgeFileItem.mod_attr("filepath", tmp);
            forgeFileItem.state.set("Uploading completed");
            file._info.add_attr({
              'state': forgeFileItem.state
            });
            new SpinalForgeSystem(forgeFileItem, file);
          });
        }
      } else {
        file.load((forgeFileItem) => {
          if (forgeFileItem) {
            new SpinalForgeSystem(forgeFileItem, file);
          } else {
            console.error("error in forgeItem");
          }
        });
      }
    }
  });
};
spinalCore.load_type(conn, 'File', callback_success, err_connect);