/*
 * Copyright 2024 SpinalCom - www.spinalcom.com
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

import path = require('path');
import { spinalApsManager } from './SpinalApsManager';
import { unlinkSync } from 'fs-extra';
const OUT_DIR = path.resolve(__dirname, '..', '..', 'tmp');

export default class SpinalApsUpload {
  // #region constructor
  constructor(private bucketKey: string, private filename: string) {
  }
  // #endregion

  // #region uploadToAps
  async uploadToAps() {
    console.log('Starting to upload the file [%s] to aps.', this.filename);
    const accessToken = await spinalApsManager.getAuthAndCreateBucket(this.bucketKey);
    const filepath = path.resolve(OUT_DIR, this.filename);
    await spinalApsManager.ossClient.upload(this.bucketKey, this.filename, filepath, accessToken);
    try {
      unlinkSync(filepath);
    } catch (e) {
      console.error(e);
    }
    console.log('Upload file [%s] to aps done.', this.filename);
  }
  // #endregion
}
