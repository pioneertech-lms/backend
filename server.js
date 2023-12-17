import app from "./app.js";
import { connectDB } from "./config/database.js";

(async () => {
  try {
    // Connect to the db
    await connectDB();

    const port = process.env.PORT || 8000;
    const server = app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });

    // handle shutdown
    process.on('SIGINT', () => {
      server.close(() => {
        console.log('Server closed');
        cronJob.stop();
        process.exit();
      });
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
})();
