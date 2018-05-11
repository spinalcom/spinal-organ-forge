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
var ForgeFileDerivativesItem = require("spinal-lib-forgefile").ForgeModelItem;

function SpinalForgeMetadata(
  model,
  model_export,
  BUCKET_KEY,
  file_name,
  spinalForgeAuth
) {
  var _self = this;

  this.defaultHandleError = function(err) {
    model.state.set("Failed");
    console.error("\x1b[31m Error:", err, "\x1b[0m");
  };

  this.getMetadata = function(oAuth) {
    console.log("******* getMetadata ");
    var promise = function(resolve, reject) {
      derivativesApi
        .getMetadata(model.urn.get(), {}, oAuth, oAuth.getCredentials())
        .then(
          function(res) {
            resolve(res);
          },
          function(err) {
            reject(err);
          }
        );
    };
    return new Promise(promise);
  };

  this.getModelviewMetadata = function(oAuth) {
    var done = 0;
    var modelviewMetadata = function(urn, child_urn, export_child) {
      derivativesApi
        .getModelviewMetadata(urn, child_urn, {}, oAuth, oAuth.getCredentials())
        .then(function(res) {
          console.log(res);
          if (res.statusCode === 202) {
            setTimeout(modelviewMetadata, 3000, urn, child_urn, export_child);
          } else {
            done += 1;
            for (var i = 0; i < res.body.data.objects.length; i++) {
              var meta = res.body.data.objects[i];
              export_child.add_child_metadata(meta);
            }
            if (done === model_export._children.length)
              model.state.set("Export completed");
          }
        }, _self.defaultHandleError);
    };
    for (var i = 0; i < model_export._children.length; i++) {
      var export_child = model_export._children[i];
      if (export_child._children.length == 0) {
        modelviewMetadata(
          model.urn.get(),
          export_child.guid.get(),
          export_child
        );
      }
    }
  };

  this.run = function() {
    spinalForgeAuth.auth_and_getBucket().then(function(oAuth) {
      _self.getMetadata(oAuth).then(function(res_metadata) {
        console.log(res_metadata);
        if (model_export._children.length == 0) {
          for (var i = 0; i < res_metadata.body.data.metadata.length; i++) {
            var obj = res_metadata.body.data.metadata[i];
            // not working
            var item = new ForgeFileDerivativesItem(obj);
            item.add_attr({
              guid: obj.guid
            });
            model_export.add_child(item);
          }
        }
        _self.getModelviewMetadata(oAuth);
      }, _self.defaultHandleError);
    }, _self.defaultHandleError);
  };

  this.metadata = function() {
    console.log("Exporting Metadata.");
    _self.run();
  };
}

module.exports = SpinalForgeMetadata;
