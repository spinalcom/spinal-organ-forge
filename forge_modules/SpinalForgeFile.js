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
var request = require('request');

function SpinalForgeFile(model, file_name) {

  var _self = this;

  this.download = function (url, dest, cb) {

    var file = fs.createWriteStream(dest);
    var sendReq = request.get(url);
    // verify response code
    sendReq.on('response', function (response) {
      if (response.statusCode !== 200) {
        return cb('Response status was ' + response.statusCode);
      }
    });
    // check for request errors
    sendReq.on('error', function (err) {
      console.log("Download failed.");
      model.state.set("Failed");
      try {
        fs.unlink(dest);
      } catch (e) {
        console.error("error on unlink");
      }

      return cb(err);
    });
    sendReq.pipe(file);
    file.on('finish', function () {
      console.log("Download completed.");
      model.state.set("Uploading to forge");
      file.close(cb); // close() is async, call cb after close completes.
    });
    file.on('error', function (err) { // Handle errors
      console.log("Download failed.");
      model.state.set("Failed");
      fs.unlink(dest); // Delete the file async. (But we don't check the result)
      return cb(err);
    });
  };


  this.download_file = function () {
    console.log("Starting to Download the File : " + file_name);

    const url = "http://" + process.env.SPINALHUB_IP +
      ":" + process.env.SPINALHUB_PORT + "/sceen/_?u=" + model.filepath._server_id;
    fs.unlink(file_name, function () {
      _self.download(url, file_name, function (res) {
        console.log(res);
      });

    });

  };
}


module.exports = SpinalForgeFile;