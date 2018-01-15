// index.js

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
            forgeFileItem.name.set(file.name.get().toLowerCase() + '.rvt');
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