import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import { createConnection } from "typeorm";

import { MyContext } from "./types";

import { COOKIE_NAME, __prod__ } from "./constants";
import { POSTGRES_PASS } from "./priv";


import { Post } from "./entities/Post";
import { User } from "./entities/User";

import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";


const main = async () => {
    const connection = await createConnection({
        type: "postgres",
        database: "tidder",
        username: "postgres",
        password: POSTGRES_PASS,
        logging: true,
        synchronize: true, // this prop will set up your schema automatically when set to true.
        entities: [Post, User]
    });
    
    const app = express();

    /**
     * the order of where you position the redis middleware
     * matters. In this instance you want the redis session
     * middleware to run before the apollo middleware so
     * the app knows the users info before the queries are
     * invoked.
     */
    const RedisStore = connectRedis(session);
    const redis = new Redis();

    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true
        })
    );

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
                disableTTL: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7,
                httpOnly: true,
                secure: __prod__, // will only work in https in PROD. So in dev it sets to false
                sameSite: "lax" // csrf
            },
            saveUninitialized: false,
            // this will have to be made to an environment variable
            secret:
                "nck2j398jfw31hrncdiuf12o83urehnfd813h4f8u10908hdqn0189whrhef8123yhrudwro123h8hrp28o3rh",
            resave: false
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        // apollo accesses cookies via the req and res objects
        //@ts-ignore
        context: ({ req, res }): MyContext => ({ req, res, redis })
    });

    apolloServer.applyMiddleware({
        app,
        cors: false
    });

    app.listen(4000, () => {
        console.log(
            "Server started on http://localhost:4000\nGraphQL playground is on http://localhost:4000/graphql"
        );
    });
};

main().catch((err) => {
    console.error(err);
});
