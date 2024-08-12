import dotenv from "dotenv";

dotenv.config();

export const isDev = process.env.NODE_ENV === "dev";

export const config = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || ``,
  dbUri: process.env.DB_CONNECTION || ``,
  saltWorkFactor: 10,
  accessTokenTtl: "15m",
  refreshTokenTtl: "7d",
  secretKey: process.env.SECRET_KEY || ``,
  googleClientId: process.env.GOOGLE_CLIENT_ID || ``,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ``,
  publicKey: process.env.PUBLIC_KEY || ``,
  privateKey: process.env.PRIVATE_KEY || ``,
};

export const S3Config = {
  spacesName: process.env.SPACES_NAME || ``,
  spacesEndpoint: process.env.SPACES_ENDPOINT || ``,
  spacesAccessKeyId: process.env.SPACES_ACCESS_KEY_ID || ``,
  spacesSecretKey: process.env.SPACES_SECRET_KEY || ``,
};
