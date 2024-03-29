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

import { writeFileSync } from 'fs';
const path = require('path');
const derivativesApi = new (require('forge-apis').DerivativesApi)();

// getMetadata
// Metadata getMetadata(urn, opts, oauth2client, credentials)
// https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata

// getModelviewProperties
// Metadata getModelviewProperties(urn, guid, opts, oauth2client, credentials)
// https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/${guid}/properties

function getMetadata(oAuth: any, urn: string) {
  console.log('**** getMetadata');
  return derivativesApi
    .getMetadata(urn, null, oAuth, oAuth.getCredentials())
    .then((res: any) => res.body)
    .catch((err: any) => { throw err; });
}

function getProps(oAuth: any, urn: string, guid: string) {
  console.log('**** getProps', urn, guid);
  return derivativesApi
    .getModelviewProperties(urn, guid, null, oAuth, oAuth.getCredentials())
    .then((res: any) => res.body)
    .catch((err: any) => { throw err; });
}
function get3D(metadata) {
  for (const data of metadata.data.metadata) {
    if (data.role === '3d') return data;
  }
}

function wait(milsecond): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, milsecond);
  });
}

export default async function spinalForgeGetProps(spinalForgeAuth: any,
  urn: string,
  bucketKey: string) {
  console.log('START SpinalForgeGetProps');

  const oAuth = await spinalForgeAuth.auth_and_getBucket();
  const metadata = await getMetadata(oAuth, urn);
  const child = get3D(metadata);
  console.log('get3D', child);
  // try {
  while (true) {
    const props = await getProps(oAuth, urn, child.guid);
    console.log('props', props);
    if (typeof props.data === 'undefined') {
      await wait(1000);
    } else {
      const rPath = path.resolve('viewerForgeFiles', bucketKey, 'propsList.json');
      writeFileSync(rPath, JSON.stringify(props));
      return props;
    }
  }

  // } catch (e) {
  //   console.log(e);

  // }

}

// class SpinalForgeWaitTranslate {
//   spinalForgeAuth: any;
//   constructor(spinalForgeAuth: any) {
//     this.spinalForgeAuth = spinalForgeAuth;
//   }
//   getManifest(oAuth: any, urn: string) {
//     console.log('**** getManifest');
//     return derivativesApi
//       .getManifest(urn, null, oAuth, oAuth.getCredentials())
//       .then((res: any) => res.body)
//       .catch((err: any) => { throw err; });
//   }

//   waitTranslateDefer(oAuth: any, urn: string) {
//     const defer = q.defer();
//     const fctRepeat = (requestRes?: any) => {
//       console.log(requestRes);
//       if (
//         requestRes === undefined ||
//         requestRes.status === 'pending' ||
//         requestRes.status === 'inprogress'
//       ) {
//         // check progresss here
//         if (requestRes !== undefined) {
//           defer.notify(requestRes.progress);
//         }
//         setTimeout(() => {
//           this
//             .getManifest(oAuth, urn)
//             .then((res) => fctRepeat(res))
//             .catch((err: any) => { throw err; });
//         },         5000);
//       } else if (requestRes.status === 'failed') {
//         console.log('Error from autodesk forge!');
//         for (let i = 0; i < requestRes.derivatives.length; i++) {
//           console.log(requestRes.derivatives[i].messages);
//         }
//         defer.reject('Error from autodesk forge');
//       } else {
//         console.log('Translating completed !');
//         // model.state.set("Translating completed");
//         defer.resolve();
//       }
//     };
//     fctRepeat();
//     return defer.promise;
//   }

//   waitTranslate(urn) {
//     console.log('Waiting to Translate the file to svf in forge.');
//     return this.spinalForgeAuth
//       .auth_and_getBucket()
//       .then((oAuth) => {
//         return this.waitTranslateDefer(oAuth, urn);
//       }).catch((err: any) => { throw err; });

//   }

// }
