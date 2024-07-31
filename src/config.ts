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

import dotenv = require('dotenv');
import { resolve } from 'path';

// SPINALHUB_PORT is optional
const env_keys = [
  "SPINALHUB_PROTOCOL",
  "SPINALHUB_IP",
  "SPINAL_USER_ID",
  "SPINAL_PASSWORD",
  "CLIENT_ID",
  "CLIENT_SECRET",
] as const;


const processEnv: any = {};
dotenv.config({
  processEnv: processEnv,
  path: [
    resolve(__dirname, '..', '.env.local'),
    resolve(__dirname, '..', '.env'),
  ]
});

for (var key in processEnv) {
  if (processEnv[key]) {
    process.env[key] = processEnv[key];
  }
}

checkEnv();

function checkEnv() {
  const missing_keys = [];
  for (let i = 0; i < env_keys.length; i++) {
    const key = env_keys[i];
    if (!process.env[key]) {
      missing_keys.push(key);
    }
  }
  if (missing_keys.length > 0) {
    console.error(`missing ${missing_keys} in env`);
    process.exit(-1);
  }
}

export const SPINALHUB_PROTOCOL = process.env.SPINALHUB_PROTOCOL;
export const SPINALHUB_PORT = process.env.SPINALHUB_PORT;
export const SPINALHUB_IP = process.env.SPINALHUB_IP;
export const SPINAL_USER_ID = process.env.SPINAL_USER_ID;
export const SPINAL_PASSWORD = process.env.SPINAL_PASSWORD;
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLIENT_SECRET = process.env.CLIENT_SECRET;