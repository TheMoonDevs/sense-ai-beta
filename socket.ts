import { Server, Socket } from "socket.io";
import { EventsMap } from "socket.io/dist/typed-events";
import { corsOptionDelegate } from "./cors";
type Handler<
  ClientToServerEvents extends EventsMap,
  ServerToClientEvents extends EventsMap,
  InterServerEvents extends EventsMap,
  SocketData
> = (
  socket: Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) => void;

type Middleware<TContext, PContext> = (args: {
  context: PContext;
  socket: Socket;
}) => Promise<TContext> | TContext;

export class WebsocketController<TContext> {
  routes: Map<string, Handler<any, any, any, any>> = new Map();
  middlewares: Middleware<TContext, TContext>[] = [];

  constructor() {
    this.routes = new Map();
    this.middlewares = [];
  }

  attach(server: any): Server {
    console.log("attaching socket server");
    const io = new Server(server, {
      cors: corsOptionDelegate,
      path: "/sense_api/v1/socket",
      pingInterval: 10000, // how often to ping/pong.
      pingTimeout: 30000 // time after which the connection is considered timed-out.
    });

    io.engine.on("connection_error", (err) => {
      console.log("connection_error_request", err.req);
      console.log(err.code); // the error code, for example 1
      console.log("connection_error_message", err.message);
      console.log("connection_error_context", err.context);
    });
    for (const [path, handler] of this.routes) {
      console.log("attaching socket route:", path);
      io.of(path).on("connection", async (socket: Socket) => {
        console.log(
          "\ngot a new connection from: " + socket.id + " at path: " + path
        );
        let context = {} as TContext;
        for (const middleware of this.middlewares) {
          try {
            context = {
              ...context,
              ...(await middleware({ context, socket })),
            };
          } catch (e) {
            console.log("socket - middleware error", e);
            socket.disconnect();
            return;
          }
        }
        socket.data = context;
        // run handler
        handler(socket);
      });
      io.of(path).on("disconnect", (reason) => {
        console.log("socket disconnect:", path, reason);
      });
      io.of(path).on("connection_error", (err) => {
        console.log("connection_error_request:", path, err.req);
        console.log("connection_error_code:", path, err.code);
        console.log("connection_error_message:", path, err.message);
        console.log("connection_error_context:", path, err.context);
      });
    }
    return io;
  }

  use<RContext>(
    middleware: Middleware<RContext, TContext>
  ): WebsocketController<RContext & TContext> {
    // @ts-ignore
    this.middlewares.push(middleware);
    return this as unknown as WebsocketController<TContext & RContext>;
  }

  route<
    ClientToServerEvents extends EventsMap = any,
    ServerToClientEvents extends EventsMap = any,
    InterServerEvents extends EventsMap = any,
    SocketData extends Record<string, unknown> = any
  >({
    path,
    eventHandlers,
  }: {
    path: string;
    eventHandlers: {
      [Property in keyof ClientToServerEvents]: (args: {
        data: Parameters<ClientToServerEvents[Property]>[0];
        context: TContext & SocketData;
        socket: Socket<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >;
      }) => void;
    } & {
      connect?: (args: {
        context: TContext & SocketData;
        socket: Socket<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >;
      }) => void;
      error?: (args: {
        context: TContext & SocketData;
        socket: Socket<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >;
      }) => void;
      disconnect?: (args: {
        context: TContext & SocketData;
        socket: Socket<
          ClientToServerEvents,
          ServerToClientEvents,
          InterServerEvents,
          SocketData
        >;
      }) => void;
    };
  }) {
    const createHandler = (
      socket: Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData & TContext
      >
    ) => {
      if (eventHandlers.connect) {
        eventHandlers.connect({ context: socket.data, socket });
      }

      for (const [event, handler] of Object.entries(eventHandlers)) {
        // @ts-ignore
        socket.on(event, (data) => {
          handler({ data, context: socket.data, socket });
        });
      }
    };
    this.routes.set(path, createHandler);
    return this;
  }
}
