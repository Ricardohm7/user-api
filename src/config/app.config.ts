const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const PORT = process.env.PORT || 3000;
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret';
const DB_URI = process.env.MONGO_URI;
const API_VERSION = process.env.API_VERSION;

export const appConfig = {
  jwtSecret: JWT_SECRET,
  jwtRefreshToken: REFRESH_TOKEN_SECRET,
  jwtSaltRounds: 10,
  serverPort: PORT,
  dbUri: DB_URI,
  apiVersion: API_VERSION,
};
