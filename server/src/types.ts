import { Response, Request } from "express";
import { Redis } from "ioredis";

interface IRequest extends Request {
    session: Express.Session;
}

export type MyContext = {
    req: IRequest;
    res: Response;
    redis: Redis;
};
