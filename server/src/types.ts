import { Request, Response } from "express";
import { Redis } from "ioredis";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import { createUserLoader } from "./utils/createUserLoader";

interface ISession extends Express.Session {
    userId: number;
}

interface IRequest extends Request {
    session: ISession;
}

export type MyContext = {
    req: IRequest;
    res: Response;
    redis: Redis;
    userLoader: ReturnType<typeof createUserLoader>;
    updootLoader: ReturnType<typeof createUpdootLoader>;
};
