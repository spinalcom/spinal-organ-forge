"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Copyright 2018 SpinalCom - www.spinalcom.com
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
const fileVersionState = [
    'Inital',
    'Send tranlation command to organ',
    'File downloading to Organ',
    'File download to Organ completed',
    'Uploading file to Forge',
    'Upload file to Forge completed',
    'In queue for conversion',
    'Converting',
    'Converting completed',
    'Download converted file',
    'Converted',
    'Failed',
];
exports.default = fileVersionState;
function getStateLabel(state) {
    return fileVersionState[state];
}
exports.getStateLabel = getStateLabel;
function getState(stateLabel) {
    for (let index = 0; index < fileVersionState.length; index++) {
        if (stateLabel === fileVersionState[index])
            return index;
    }
    return undefined;
}
exports.getState = getState;
//# sourceMappingURL=fileVersionState.js.map