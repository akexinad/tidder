import { Connection, IDatabaseDriver, MikroORM } from "@mikro-orm/core";
import { Response, Request } from "express";
import { User } from "./entities/User";

export type MyContext = {
    orm: MikroORM<IDatabaseDriver<Connection>>;
    req: Request & { session: Express.Session };
    res: Response;
};

export type Foo = {
    userId: User["id"];
};
