import { Data } from "@urql/exchange-graphcache";

export type LoggedInUserData = Data & {
    me: {
        id: number;
    };
};

export type PostToDeleteData = Data & {
    author: {
        id: number;
    };
};