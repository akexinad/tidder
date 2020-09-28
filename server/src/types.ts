import { Response, Request } from "express";
import { Redis } from "ioredis";

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
};
