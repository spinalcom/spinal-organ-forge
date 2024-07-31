import { File, Ptr, Model } from 'spinal-core-connectorjs';
export declare function loadModelPtr<T extends Model>(model: Ptr<T> | File<T>): Promise<T>;
export default loadModelPtr;
