import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import {appConfig} from './config/app.config';
import connectDB from './config/database';
import v1AuthRoutes from './routes/v1/auth.routes';
import cookieParser from 'cookie-parser';

const app = express();

// built-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

(async () => {
  try {
    await connectDB();

    app.use('/api/v1/auth', v1AuthRoutes);
    //app.use('/api/users', userRoutes);

    app.get('/', (req, res) => {
      res.send('User API API');
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
