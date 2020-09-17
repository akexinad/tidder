import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { __prod__ } from "./constants";

import mikroOrmConfig from "./mikro-orm.config";

import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    /**
     * This automatically runs the migration for you
     * so you don't have to do it via the cli
     */
    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: () => ({ orm })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("Server started on http://localhost:4000\nGraphQL playground is on http://localhost:4000/graphql");
    });
};

main().catch((err) => {
    console.error(err);
});
