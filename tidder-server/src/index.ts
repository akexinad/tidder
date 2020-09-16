import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { __prod__ } from "./constants";

// import { Post } from "./entities/Post";

import mikroOrmConfig from "./mikro-orm.config";

import { HelloResolver } from "./resolvers/hello";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    /**
     * This automatically runs the migration for you
     * so you don't have to do it via the cli
     */
    await orm.getMigrator().up();

    // creating a post and persisting it to the database
    // const post = orm.em.create(Post, { title: "the first tidder post" });
    // await orm.em.persistAndFlush(post);

    // const posts = await orm.em.find(Post, {});

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver],
            validate: false
        })
    });

    apolloServer.applyMiddleware({ app });

    app.listen(4000, () => {
        console.log("server started on localhost:4000");
    });
};

main().catch((err) => {
    console.error(err);
});
