import { CorsOptions, CorsOptionsDelegate } from "cors";

export const corsOptionDelegate: CorsOptionsDelegate = async (
  req,
  callback
) => {
  const corsOptions: CorsOptions = {
    origin: true,
    credentials: true,
  };

  callback(null, corsOptions);
};
