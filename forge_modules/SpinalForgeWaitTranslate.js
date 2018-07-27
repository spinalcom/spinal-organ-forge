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

var ForgeSDK = require("forge-apis");
var derivativesApi = new ForgeSDK.DerivativesApi();

function SpinalForgeWaitTranslate(
  model,
  BUCKET_KEY,
  file_name,
  spinalForgeAuth
) {
  var _self = this;

  this.defaultHandleError = function(err) {
    model.state.set("Failed");
    console.error("\x1b[31m Error:", err, "\x1b[0m");
  };

  this.getManifest = function(oAuth, urn) {
    console.log("**** getManifest");

    return new Promise(function(resolve, reject) {
      derivativesApi.getManifest(urn, null, oAuth, oAuth.getCredentials()).then(
        function(res) {
          resolve(res.body);
        },
        function(err) {
          reject(err);
        }
      );
    });
  };

  this.save_data = function() {
    // for (var i = 0; i < derivatives.length; i++) {
    //   var derivative = derivatives[i];
    //   // model.add_child(new ForgeFileDerivativesItem(derivative));
    // }
  };

  this.run = function() {
    spinalForgeAuth.auth_and_getBucket().then(function(oAuth) {
      var urn = model.urn.get();
      var call_success = function(callback_res) {
        console.log(callback_res);
        if (
          callback_res.status === "pending" ||
          callback_res.status === "inprogress"
        ) {
          setTimeout(function() {
            _self
              .getManifest(oAuth, urn)
              .then(call_success, _self.defaultHandleError);
          }, 5000);
        } else if (callback_res.status == "failed") {
          console.log("Error from autodesk forge!");
          for (var i = 0; i < callback_res.derivatives.length; i++) {
            console.log(callback_res.derivatives[i].messages);
          }
          _self.defaultHandleError("Error from autodesk forge");
        } else {
          console.log("Translating completed !");
          _self.save_data(callback_res.derivatives);
          model.state.set("Translating completed");
        }
      };
      return _self
        .getManifest(oAuth, urn)
        .then(call_success, _self.defaultHandleError);
    }, _self.defaultHandleError);
  };


  this.wait_translate = function() {
    console.log("Waiting to Translate the file to svf in forge.");
    _self.run();
  };
}

module.exports = SpinalForgeWaitTranslate;
