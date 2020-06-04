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

import { FileSystem, File, Ptr } from 'spinal-core-connectorjs_type';

const mapModelDictionary = new Map();

export function loadModelPtr<T extends spinal.Model>(model: spinal.Ptr<T> | spinal.File<T>)
  : Promise<T> {
  if (model instanceof File) {
    return loadModelPtr(model._ptr);
  }
  if (!(model instanceof Ptr)) {
    throw new Error('loadModelPtr must take Ptr as parameter');
  }
  if (!model.data.value && model.data.model) {
    return Promise.resolve(model.data.model);
  } if (!model.data.value) {
    throw new Error('Trying to load a Ptr to 0');
  }

  if (mapModelDictionary.has(model.data.value)) {
    return mapModelDictionary.get(model.data.value);
  }
  if (typeof FileSystem._objects[model.data.value] !== 'undefined') {
    const promise: any = Promise.resolve(FileSystem._objects[model.data.value]);
    mapModelDictionary.set(model.data.value, promise);
    return promise;
  }
  const promise: Promise<T> = new Promise((resolve, reject) => {
    model.load((m) => {
      if (!m) {
        mapModelDictionary.delete(model.data.value);
        reject(new Error('Error in load Ptr'));
      } else {
        resolve(m);
      }
    });

  });
  mapModelDictionary.set(model.data.value, promise);
  return promise;
}

export default loadModelPtr;
