export declare class QueueJobHandle {
    private currentJobs;
    private waitingJobs;
    constructor();
    waitJob(uid: number): Promise<void>;
    finishedJob(uid: number): any;
}
export declare const queueJobHandle: QueueJobHandle;
