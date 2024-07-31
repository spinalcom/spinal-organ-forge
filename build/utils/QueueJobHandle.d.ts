/// <reference types="q" />
export declare class QueueJobHandle {
    private currentJobs;
    private waitingJobs;
    constructor();
    waitJob(uid: number): Q.Promise<void>;
    finishedJob(uid: number): void;
}
export declare const queueJobHandle: QueueJobHandle;
