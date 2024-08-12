import mongoose from "mongoose";
import { config } from "../config/env.conf";

async function connect() {
  const dbUri = config.dbUri;

  try {
    await mongoose.connect(dbUri);
    console.log("DB connected");
  } catch (error) {
    console.error("Could not connect to db", error);
    process.exit(1);
  }
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log("DB disconnected");
  } catch (error) {
    console.error("Could not disconnect from db", error);
  }
}

export { connect, disconnect };
