import { MikroORM } from "@mikro-orm/core";

import { __prod__ } from "./constants";

import { Post } from "./entities/Post";

import mikroOrmConfig from "./mikro-orm.config";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    /**
     * This automatically runs the migration for you
     * so you don't have to do it via the cli
     */
    await orm.getMigrator().up();
    
    const post = orm.em.create(Post, { title: "the first tidder post" });
    await orm.em.persistAndFlush(post);

    const posts = await orm.em.find(Post, {});

    console.log('posts', posts)
};

main().catch((err) => {
    console.error(err);
});
