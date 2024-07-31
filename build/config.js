"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_SECRET = exports.CLIENT_ID = exports.SPINAL_PASSWORD = exports.SPINAL_USER_ID = exports.SPINALHUB_IP = exports.SPINALHUB_PORT = exports.SPINALHUB_PROTOCOL = void 0;
const dotenv = require("dotenv");
const path_1 = require("path");
// SPINALHUB_PORT is optional
const env_keys = [
    "SPINALHUB_PROTOCOL",
    "SPINALHUB_IP",
    "SPINAL_USER_ID",
    "SPINAL_PASSWORD",
    "CLIENT_ID",
    "CLIENT_SECRET",
];
const processEnv = {};
dotenv.config({
    processEnv: processEnv,
    path: [
        (0, path_1.resolve)(__dirname, '..', '.env.local'),
        (0, path_1.resolve)(__dirname, '..', '.env'),
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
exports.SPINALHUB_PROTOCOL = process.env.SPINALHUB_PROTOCOL;
exports.SPINALHUB_PORT = process.env.SPINALHUB_PORT;
exports.SPINALHUB_IP = process.env.SPINALHUB_IP;
exports.SPINAL_USER_ID = process.env.SPINAL_USER_ID;
exports.SPINAL_PASSWORD = process.env.SPINAL_PASSWORD;
exports.CLIENT_ID = process.env.CLIENT_ID;
exports.CLIENT_SECRET = process.env.CLIENT_SECRET;
//# sourceMappingURL=config.js.map