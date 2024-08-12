import { WebsocketController } from "../socket";
import { socketAuth } from "../middleware/socket-auth";
import { generateStream } from "@genkit-ai/ai";
import { gemini15Flash } from "@genkit-ai/googleai";

export const streamFlowSocket = new WebsocketController()
  .use(socketAuth)
  // .use(({ socket, context }) => {
  //   const sessionId = socket.handshake.query.sessionId;
  //   console.log("WS - Flow session connected", sessionId);
  // if (typeof sessionId !== "string") {
  //   throw new Error("sessionId is not a string");
  // }
  //   return {
  //     context,
  //     sessionId,
  //   };
  // })
  .route<
    // incoming events
    {
      ping: () => void;
      generate: (data: { prompt: string }) => void;
    },
    // outgoing events
    {
      pong: () => void;
      streamOutput: (output: { response?: string; error?: any }) => void;
      status: (status: string) => void;
      responseComplete: (output: { response?: string; error?: any }) => void; // New event for completion
    },
    any,
    {
      queue?: string;
    }
  >({
    path: "/sense_api/v1/streamFlow",
    eventHandlers: {
      connect({ context, socket }) {
        console.log("socket connected");
        socket.emit("status", "ready");
      },
      disconnect({ context, socket }) {
        console.log("socket disconnected");
        socket.emit("status", "disconnected");
      },
      async generate({ data, context, socket }) {
        try {
          const { response, stream } = await generateStream({
            model: gemini15Flash,
            prompt: data.prompt || "Tell a long story about robots and ninjas.",
          });

          let responseText = "";

          for await (const chunk of stream()) {
            //@ts-ignore
            responseText += chunk.text();
            socket.emit("streamOutput", {
              response: responseText.replace(/\*\*/g, ""),
            });
          }

          const finalResponseText = (await response()).text();
          responseText = finalResponseText;

          socket.emit("responseComplete", {
            response: responseText.replace(/\*\*/g, ""),
          });
        } catch (error: any) {
          socket.emit("streamOutput", { error: error?.message as string });
          socket.emit("responseComplete", { error: error?.message as string }); // Complete the response even if there is an error
        }
      },
      ping({ socket }) {
        socket.emit("pong");
      },
    },
  });
