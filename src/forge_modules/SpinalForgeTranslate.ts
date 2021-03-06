/*
 * Copyright 2020 SpinalCom - www.spinalcom.com
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

const path = require('path');
const { ObjectsApi, DerivativesApi } = require('forge-apis');
const objectsApi = new ObjectsApi();
const derivativesApi = new DerivativesApi();
const base64url = require('base64-url');

type ForgeJobAPI = {
  input: {
    urn: any;
    compressedUrn?: boolean,
    rootFilename?: string,
  };
  output: {
    formats: {
      type: string;
      views: string[];
    }[];
    advanced?: {
      generateMasterViews?: boolean,
    }
  };
};

export default class SpinalForgeTranslate {
  bucketKey: string;
  filename: string;
  spinalForgeAuth: any;

  constructor(bucketKey: string, filename: string, spinalForgeAuth: any) {
    this.bucketKey = bucketKey;
    this.filename = filename;
    this.spinalForgeAuth = spinalForgeAuth;
  }

  getObjects(oAuth: any) {
    console.log('**** Uploading file List in the bucket.');
    const promise = (resolve, reject) => {
      objectsApi.getObjects(this.bucketKey, {}, oAuth, oAuth.getCredentials()).then(
        (res) => {
          resolve({
            auth: oAuth,
            res: res.body.items,
          });
        },
        reject,
      );
    };
    return new Promise(promise);
    // return objectsApi.getObjects(this.bucketKey, {}, oAuth, oAuth.getCredentials())
    //   .then((res) => {
    //     return ({
    //       auth: oAuth,
    //       res: res.body.items,
    //     });
    //   });
  }

  convertObj(oAuth: any, obj): Promise<{ auth, res }> {
    const job: ForgeJobAPI = {
      input: {
        urn: base64url.encode(obj.objectId),
      },
      output: {
        formats: [{
          type: 'svf',
          views: ['3d', '2d'],
        }],
        advanced: {
          generateMasterViews: true,
        },
      },
    };

    if (path.extname(this.filename).toLowerCase() === '.zip') {
      job.input.compressedUrn = true;
      const idx = this.filename.lastIndexOf('.zip');
      job.input.rootFilename = this.filename.slice(0, idx);
    }
    return new Promise((resolve, reject) => {
      console.log('**** Translate');
      derivativesApi
        .translate(job, { xAdsForce: true }, oAuth, oAuth.getCredentials())
        .then(
          (res) => {
            resolve({
              auth: oAuth,
              res: res.body,
            });
          },
          reject,
        );
    });

    // return derivativesApi
    //   .translate(job, { xAdsForce: true },
    //              oAuth, oAuth.getCredentials(),
    //   ).then((res) => {
    //     return ({
    //       auth: oAuth,
    //       res: res.body,
    //     });
    //   });
  }

  translateInForge(): string {
    console.log('Starting to Translate the file to svf in forge.');
    return this.spinalForgeAuth
      .auth_and_getBucket()
      .then((oAuth) => {
        return this.getObjects(oAuth);
      }).then((res) => {
        console.log('==== end getObjects');
        const list = res.res;
        console.log(list);
        for (let i = 0; i < list.length; i += 1) {
          if (list[i].objectKey === this.filename) {
            return this.convertObj(res.auth, list[i]).then((req) => {
              console.log('==== translateInForge end', req);
              try {
                console.log('Jobs => ', JSON.stringify(req.res.acceptedJobs, null, 2));
              } catch (e) { }
              return (req.res.urn);
            });
          }
        }
      });
    // .then(function (res) {
    //   // model.urn.set(res.res.urn);
    //   // model.state.set("Translating");
    // });
  }
}
