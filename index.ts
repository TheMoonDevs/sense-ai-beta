import { startFlowsServer } from "@genkit-ai/flow";
import app from "./app";
import { configureGenkit } from "@genkit-ai/core";
import { googleAI } from "@genkit-ai/googleai";
import flows from "./flows";
import dotenv from "dotenv";
import { connect } from "./utils/connect";
import { dotprompt } from "@genkit-ai/dotprompt";
import http from "http";
import { streamFlowSocket } from "./ws-routes";
dotenv.config();

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      //apiVersion: ""
    }),
    dotprompt({
      dir: "flow_prompts",
    }),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

startFlowsServer({
  flows,
  port: parseInt(process.env.GENKIT_PORT || "4200"),
  pathPrefix: "sense_flows/v1/",
});

const port = parseInt(process.env.PORT || "3000");

const server = http.createServer(app);

streamFlowSocket.attach(server);

server.listen(port, async () => {
  console.log(`Websocket Server started on port ${port}`);
  await connect();
});
