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

var ForgeSDK = require('forge-apis');
var objectsApi = new ForgeSDK.ObjectsApi();
var derivativesApi = new ForgeSDK.DerivativesApi();
var base64url = require('base64-url');

function SpinalForgeDownloadDerivative(model, BUCKET_KEY, file_name, spinalForgeAuth) {
  var _self = this;

  this.defaultHandleError = function (err) {
    model.state.set("Failed");
    console.error('\x1b[31m Error:', err, '\x1b[0m');
  };

  this.get_svf_item = function (item) {
    console.log("******* get_svf_item : ", item.name.get());
    var urn;
    if (item.role && item.role.get() == "graphics" &&
      item.mime && item.mime.get() == "application/autodesk-svf") {
      urn = item.urn;
      console.log(urn);
      return urn.get();
    }
    for (var i = 0; i < item._children.length; i++) {
      urn = _self.get_svf_item(item._children[i]);
      if (urn)
        return urn;
    }
    return false;
  };

  this.run = function () {
    spinalForgeAuth.auth_and_getBucket()
      .then(function (oAuth) {
        console.log(model._children[0]);
        var urn = _self.get_svf_item(model._children[0]); // TEST
        console.log("result urn = ", urn);

        derivativesApi.getDerivativeManifest(model.urn.get(), urn, {}, oAuth, oAuth.getCredentials())
          .then(function (res) {

            console.log(res);
            fs.writeFile("test.svf", res.body, function (err) {
              if (err) {
                return console.log(err);
              }
              console.log("download done.");
            });


          }, _self.defaultHandleError);

      }, _self.defaultHandleError);
  };




  this.get_forge_models = function () {
    console.log("Starting to Download the file svf in forge and upload it to the SpinalCore.");
  };
}


module.exports = SpinalForgeDownloadDerivative;