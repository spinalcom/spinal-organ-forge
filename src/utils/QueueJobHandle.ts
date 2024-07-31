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

import q = require('q');

export class QueueJobHandle {
  private currentJobs = new Map<number, Q.Deferred<void>>();
  private waitingJobs = new Map<number, Q.Deferred<void>>();

  constructor() { }

  waitJob(uid: number): Q.Promise<void> {
    if (this.currentJobs.has(uid)) {
      if (this.waitingJobs.has(uid)) this.waitingJobs.delete(uid);
      return this.currentJobs.get(uid).promise;
    }
    if (this.currentJobs.size >= 3) {
      if (!this.waitingJobs.has(uid)) {
        const defer = q.defer<void>();
        this.waitingJobs.set(uid, defer);
        return defer.promise;
      }
      return this.waitingJobs.get(uid).promise;
    }
    const defer = q.defer<void>();
    this.currentJobs.set(uid, defer);
    defer.resolve();
    return defer.promise;
  }

  finishedJob(uid: number) {
    if (this.currentJobs.has(uid)) {
      this.currentJobs.delete(uid);
      for (const [uid, defer] of this.waitingJobs) {
        this.waitingJobs.delete(uid);
        this.currentJobs.set(uid, defer);
        return defer.resolve();
      }
    }
  }
}

export const queueJobHandle = new QueueJobHandle;
