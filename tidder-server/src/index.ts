import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";

import { __prod__ } from "./constants";

import mikroOrmConfig from "./mikro-orm.config";

import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    /**
     * This automatically runs the migration for you
     * so you don't have to do it via the cli
     */
    await orm.getMigrator().up();

    const app = express();

    /**
     * the order of where you position the redis middleware
     * matters. In this instance you want the redis session
     * middleware to run before the apollo middleware so
     * the app knows the users info before the queries are
     * invoked.
     */
    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
            name: "juanelo turiano",
            store: new RedisStore({
                client: redisClient,
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
        context: ({ req, res }): MyContext => ({ orm, req, res })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log(
            "Server started on http://localhost:4000\nGraphQL playground is on http://localhost:4000/graphql"
        );
    });
};

main().catch((err) => {
    console.error(err);
});
