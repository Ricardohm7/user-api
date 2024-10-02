import mongoose from 'mongoose';
import {appConfig} from './app.config';

const connectDB = async () => {
  try {
    if (!appConfig.dbUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }
    await mongoose.connect(appConfig.dbUri);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
    } else {
      console.log(`An unkown error occurred`);
    }
  }
};

export default connectDB;
