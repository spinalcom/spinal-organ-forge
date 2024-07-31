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

export const fileVersionState = [
  'Inital', // 0
  'Send tranlation command to organ', // 1
  'File downloading to Organ', // 2
  'File download to Organ completed', // 3
  'Uploading file to Forge', // 4
  'Upload file to Forge completed', // 5
  'In queue for conversion', // 6
  'Converting', // 7
  'Converting completed', // 8
  'Download converted file', // 9
  'Converted', // 10
  'Failed', // 11
] as const;
export default fileVersionState;

export function getStateLabel(state: number): typeof fileVersionState[number] {
  return fileVersionState[state];
}
export function getState(stateLabel: typeof fileVersionState[number]): number {
  for (let index = 0; index < fileVersionState.length; index += 1) {
    if (stateLabel === fileVersionState[index]) return index;
  }
  return undefined;
}
