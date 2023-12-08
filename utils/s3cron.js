import cron from 'node-cron';
import { exec } from 'child_process';

const s3cleanupCron = () => {
  const job = cron.schedule('0 3 * * *', async () => {
    console.log('Running cleanup script at 3:00 am...');

    // Execute the cleanup script using child_process.exec
    const child = exec('node ./utils/unusedS3.js ', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing cleanup script: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Cleanup script stderr: ${stderr}`);
        return;
      }
      console.log(`Cleanup script stdout: ${stdout}`);
    });

    child.on('exit', (code) => {
      console.log(`Cleanup script exited with code ${code}`);
    });
  });

  job.start();

  return job;
};

export { s3cleanupCron };
