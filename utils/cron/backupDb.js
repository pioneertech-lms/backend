import { exec } from 'child_process';

export function backupMongo() {
  const backupDir = '../public/backup/';

  const timestamp = new Date().toISOString().replace(/:/g, '-');

  const backupFolder = `${backupDir}/${timestamp}`;

  const backupCommand = `mongodump --uri=${process.env.MONGO_LOCAL_URI} --out=${backupFolder}`;
  const restoreCommand = `mongorestore --uri=${process.env.MONGO_REMOTE_URI} ${backupFolder}`;

  exec(backupCommand, (backupError, backupStdout, backupStderr) => {
    if (backupError) {
      console.error('Error during backup:', backupError);
      return;
    }

    console.log('Database backup completed.');

    exec(restoreCommand, (restoreError, restoreStdout, restoreStderr) => {
      if (restoreError) {
        console.error('Error during restore:', restoreError);
        return;
      }

      console.log('Database restore to MongoDB Atlas completed.');
    });
  });
}
