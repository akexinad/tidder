import { MikroORM } from "@mikro-orm/core";
import path from "path";

import { __prod__ } from "./constants";

import { Post } from "./entities/Post";

export default {
    migrations: {
        path: path.join(__dirname, "./migrations"),
        pattern: /^[\w-]+\d+\.[tj]s$/,
    },
    entities: [Post],
    dbName: "tidder",
    type: "postgresql",
    password: "psql1234",
    debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
/**
 * inferring it as a const will actually
 * give this object the correct type and
 * will be passable to the init() function
 * in the index.ts file.
 */