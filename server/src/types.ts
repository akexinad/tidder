import { Connection, IDatabaseDriver, MikroORM } from "@mikro-orm/core";
import { Response, Request } from "express";
import { Redis } from "ioredis";

import { User } from "./entities/User";

export type MyContext = {
    orm: MikroORM<IDatabaseDriver<Connection>>;
    req: Request & { session: Express.Session };
    res: Response;
    redis: Redis
};

export type Foo = {
    userId: User["id"];
};
