import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import {appConfig} from './config/app.config';
import connectDB from './config/database';

const app = express();

// built-in middleware for json
app.use(express.json());

(async () => {
  try {
    await connectDB();

    //app.use('/api/auth', authRoutes);
    //app.use('/api/users', userRoutes);

    app.get('/', (req, res) => {
      res.send('Todo List API');
    });

    app.listen(appConfig.serverPort, () => {
      console.log(`Server is running on port ${appConfig.serverPort}`);
    });
  } catch (error) {
    console.log(
      'Failed to connect to the database. Server not started.',
      error,
    );
  }
})();
