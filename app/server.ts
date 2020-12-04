import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "apollo-server-express";
import bodyParser from "body-parser";
import express from "express";
import { buildSchema } from "type-graphql";
import { connect } from "mongoose";
import { models } from "./entities/index";
import Redis from "ioredis";
import { RedisPubSub } from "graphql-redis-subscriptions";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import http from "http";
import { UsersResolvers } from "./resolvers/users";
import { PostsResolvers } from "./resolvers/posts";
import { COOKIE_NAME, __prod__ } from "./constants";

const main = async () => {
  try {
    const schema = await buildSchema({
      resolvers: [UsersResolvers, PostsResolvers],
      emitSchemaFile: true,
      validate: false,
    });
    // const redisOptions = {
    //   retryStrategy: times => {
    //     return Math.min(times * 50, 2000)
    //   }
    // }
    const RedisStore = connectRedis(session);
    const redis = new Redis();
    const pubsub = new RedisPubSub({
      publisher: new Redis(),
      subscriber: new Redis(),
    });
    const mongoose = await connect(
      `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@jnjtype-todo.01wb5.mongodb.net/subscriptions?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    mongoose.connection;
    // mongoose.pluralize(null!);
    const app = express();
    // app.use(cors());
    const corsOptions = {
      // origin: new RegExp("/*/"),
      origin: [
        "http://localhost:4000/graphql",
        "https://studio.apollographql.com",
        "ws://studio.apollographql.com",
        "ws://localhost:4000/graphql",
      ],
      credentials: true,
    };
    app.use(cors(corsOptions));
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.use(
      session({
        name: COOKIE_NAME,
        store: new RedisStore({ client: redis, disableTouch: true }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
          httpOnly: true,
          sameSite: "lax", // csrf
          secure: __prod__, // cookie only works in https}
        },
        saveUninitialized: false,
        secret: process.env.REDIS_SECRET!,
        resave: false,
      })
    );

    const server = new ApolloServer({
      schema,
      context: ({ req, res, connection }) => {
        if (connection) {
          console.log("connection made");
          connection.pubsub = pubsub;
          return { connection };
        } else {
          return { req, res, models, pubsub };
        }
      },
      playground: {
        settings: {
          "request.credentials": "include",
        },
      },
    });

    server.applyMiddleware({ app, cors: false });
    // server.applyMiddleware({
    //   app,
    //   cors: { credentials: true, origin: new RegExp("/*/") },
    // });

    const httpServer = http.createServer(app);
    server.installSubscriptionHandlers(httpServer);
    try {
      const port = process.env.PORT || 5000;
      httpServer.listen(port, () => {
        console.log(
          `Server runnin on port http://localhost${port}${server.graphqlPath}`
        );
        console.log(
          `Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
        );
      });
    } catch (err) {
      console.log("err installSubscriptionHandlers", err);
    }

    // app.listen({ port: process.env.PORT || 5000 }, () => {
    //   console.log(
    //     `🚀 Server ready and listening at ==> http://localhost:4000${server.graphqlPath}`
    //   );
    // });
  } catch (err) {
    console.log("err", err);
  }
};

main();
