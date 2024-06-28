// NOTE: this is a bit overcomplicated
// in practice, reauths can only come in ~every 15 mins minimum
//but they come in batches of 3 - 4, since the requests to trpc come in at the same time
// i didnt the requests all to fetch a new token only for one to be used, so thats why this exists
// and it was fun to code :P

import "server-only";
import type { User } from "@prisma/client";
import type { RefreshToken } from "~/server/api/routers/spotify";
import { refreshToken } from "~/server/token";

/** Time in ms after which a new Token gets fetched if `sharedReauth` is called */
const cacheTime = 200;
/** Time after which a promise will be aborted */
const timeout = 5_000;
/** Time after which a batch will be destroyed */
const batchLiveSpan = 9_000;

const batches: Batch[] = [];

/** one batch of requests will be handeled by an object of this class */
class Batch {
  userId: User["id"];
  lastRequest = 0;
  latestToken: RefreshToken | null = null;
  waitingForToken = false;
  /** time after this batch dies */
  deathTimeout: NodeJS.Timeout | null = null;

  tokenPromise: Promise<RefreshToken> | null = null;

  constructor(userId: User["id"]) {
    this.userId = userId;
    this.deathTimeout = setTimeout(() => this.destroy(), batchLiveSpan);
  }

  private destroy() {
    const index = batches.findIndex((b) => b === this);
    if (index === -1)
      throw Error(
        "could not find index of dead batch (-> cannot remove from batches array)",
      );
    batches.splice(index);
  }

  async reauth() {
    if (this.lastRequest < Date.now() - cacheTime && this.latestToken !== null)
      return this.latestToken;

    if (this.waitingForToken === false || this.tokenPromise === null) {
      this.waitingForToken = true;
      this.tokenPromise = refreshToken(this.userId);

      void this.tokenPromise.then((token) => {
        this.waitingForToken = false;
        this.latestToken = token;
      });
    }

    return await this.tokenPromise;
  }
}

/**
 * this function can be called from different places at the same time and it will only request a reauth once.
 * After the `cacheTime`(ms) it will be requested again
 */
const sharedReauth = async (userId: User["id"]) => {
  let batch = batches.find((batch) => batch.userId === userId);
  if (batch === undefined) {
    const newBatch = new Batch(userId);
    batches.push(newBatch);
    batch = newBatch;
  }
  await batch.reauth();
};

export default sharedReauth;
