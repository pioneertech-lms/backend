import { catchAsyncError } from '../middleWares/catchAsyncError.js';
import { User } from '../models/User.js';

export const seed = catchAsyncError(async () => {
  const existingAdminUser = await User.findOne({ username: process.env.ADMIN_USERNAME });

  if (!existingAdminUser) {
    await User.create({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    });

    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }
});
