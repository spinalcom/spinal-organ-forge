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
  } else if (!model.data.value) {
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
    model.load(m => {
      if (!m) {
        mapModelDictionary.delete(model.data.value);
        reject(new Error('Error in load Ptr'));
      }
      else {
        resolve(m);
      }
    });

  });
  mapModelDictionary.set(model.data.value, promise);
  return promise;
}

export default loadModelPtr;
