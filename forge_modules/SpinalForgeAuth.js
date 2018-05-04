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
var bucketsApi = new ForgeSDK.BucketsApi();

function SpinalForgeAuth(BUCKET_KEY) {
  var _self = this;
  this.oAuth2TwoLegged = 0;
  _self.loggedIn = false;

  this.getBucketDetails = function(bucketKey) {
    console.log("**** Getting bucket details : " + bucketKey);

    console.log("oauth 2 legged");
    console.log(this.oAuth2TwoLegged);
    console.log(this.oAuth2TwoLegged.getCredentials());

    return bucketsApi.getBucketDetails(
      bucketKey,
      this.oAuth2TwoLegged,
      this.oAuth2TwoLegged.getCredentials()
    );
  };

  this.createBucket = function(bucketKey) {
    console.log("**** Creating Bucket : " + bucketKey);
    var createBucketJson = {
      bucketKey: bucketKey,
      policyKey: "temporary"
    };
    return bucketsApi.createBucket(
      createBucketJson,
      {},
      this.oAuth2TwoLegged,
      this.oAuth2TwoLegged.getCredentials()
    );
  };

  this.createBucketIfNotExist = function(bucketKey) {
    console.log("**** Creating bucket if not exist :", bucketKey);
    return new Promise(function(resolve, reject) {
      _self.getBucketDetails(bucketKey).then(
        function(resp) {
          resolve(resp);
        },
        function(err) {
          console.log(err);
          if (err.statusCode === 404) {
            _self.createBucket(bucketKey).then(
              function(res) {
                resolve(res);
              },
              function(err) {
                reject(err);
              }
            );
          } else {
            reject(err);
          }
        }
      );
    });
  };

  this.auth = function() {
    var promise = function(resolve, reject) {
      _self.oAuth2TwoLegged = new ForgeSDK.AuthClientTwoLegged(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        [
          "data:read",
          "data:write",
          "data:create",
          "data:search",
          "bucket:create",
          "bucket:read",
          "bucket:update"
        ],
        true
      );

      _self.oAuth2TwoLegged.authenticate().then(
        function(credentials) {
          console.log("**** Got Credentials", credentials);
          resolve(_self.oAuth2TwoLegged);
        },
        function(err) {
          reject(err);
        }
      );
    };
    return new Promise(promise);
  };

  this.auth_and_getBucket = function() {
    console.log("*** auth_and_getBucket");
    var promise = function(resolve, reject) {
      _self.auth().then(function() {
        return _self.createBucketIfNotExist(BUCKET_KEY).then(
          function() {
            _self.loggedIn = true;
            resolve(_self.oAuth2TwoLegged);
          },
          function(err) {
            reject(err);
          }
        );
      });
    };
    return new Promise(promise);
  };
}

module.exports = SpinalForgeAuth;
