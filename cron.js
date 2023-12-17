import { schedule } from "node-cron";
import { backupMongo } from "./utils/cron/backupDb.js";
import { cleanupS3Bucket } from "./utils/cron/unusedS3.js";

import { config } from 'dotenv';
config({ path: "./config/config.env" });

schedule('* 3 * * *', async (now) => {
    console.log("Cleaning up s3 buckets at ", now);
    await (cleanupS3Bucket()
        .then(() => console.log("Cleanup completed."))
        .catch(error => console.error("Cleanup failed:", error)));
})

schedule('* 3 * * *', async () => {
    backupMongo();
})

console.log("Cron is active");
