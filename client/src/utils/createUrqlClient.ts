import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import {
    dedupExchange,
    Exchange,
    fetchExchange,
    stringifyVariables
} from "urql";
import {
    LogoutMutation,
    MeQuery,
    MeDocument,
    LoginMutation,
    RegisterMutation
} from "../generated/graphql";
import { pipe, tap } from "wonka";
import Router from "next/router";

import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

export const errorExchange: Exchange = ({ forward }) => (ops$) => {
    return pipe(
        forward(ops$),
        tap(({ error }) => {
            // if the OperationResult has an error send a request to sentry.
            if (error && error.message.includes("Not Authenticated")) {
                Router.replace("/login");
            }
        })
    );
};

export interface PaginationParams {
    offsetArgument?: string;
    limitArgument?: string;
}

export const cursorPagination = (): Resolver => {
    return (_parent, _fieldArgs, cache, info) => {
        const { parentKey: entityKey, fieldName } = info;

        const allFields = cache.inspectFields(entityKey);

        const fieldInfos = allFields.filter(
            (info) => info.fieldName === fieldName
        );

        const size = fieldInfos.length;
        if (size === 0) {
            return undefined;
        }

        const fieldKey = `${fieldName}(${stringifyVariables(_fieldArgs)})`;

        const isItInTheCache = cache.resolve(
            cache.resolveFieldByKey(entityKey, fieldKey) as string,
            "posts"
        );

        info.partial = !isItInTheCache;

        const posts: string[] = [];
        let hasMore = true;

        fieldInfos.forEach((info) => {
            const key = cache.resolveFieldByKey(
                entityKey,
                info.fieldKey
            ) as string;

            const _posts = cache.resolve(key, "posts") as string[];
            posts.push(..._posts);

            hasMore = cache.resolve(key, "hasMore") as boolean;
        });

        return {
            hasMore,
            posts,
            __typename: "PaginatedPosts"
        };

        //     const visited = new Set();
        //     let result: NullArray<string> = [];
        //     let prevOffset: number | null = null;

        //     for (let i = 0; i < size; i++) {
        //       const { fieldKey, arguments: args } = fieldInfos[i];
        //       if (args === null || !compareArgs(fieldArgs, args)) {
        //         continue;
        //       }

        //       const links = cache.resolveFieldByKey(entityKey, fieldKey) as string[];
        //       const currentOffset = args[cursorArgument];

        //       if (
        //         links === null ||
        //         links.length === 0 ||
        //         typeof currentOffset !== 'number'
        //       ) {
        //         continue;
        //       }

        //       if (!prevOffset || currentOffset > prevOffset) {
        //         for (let j = 0; j < links.length; j++) {
        //           const link = links[j];
        //           if (visited.has(link)) continue;
        //           result.push(link);
        //           visited.add(link);
        //         }
        //       } else {
        //         const tempResult: NullArray<string> = [];
        //         for (let j = 0; j < links.length; j++) {
        //           const link = links[j];
        //           if (visited.has(link)) continue;
        //           tempResult.push(link);
        //           visited.add(link);
        //         }
        //         result = [...tempResult, ...result];
        //       }

        //       prevOffset = currentOffset;
        //     }

        //     const hasCurrentPage = cache.resolve(entityKey, fieldName, fieldArgs);
        //     if (hasCurrentPage) {
        //       return result;
        //     } else if (!(info as any).store.schema) {
        //       return undefined;
        //     } else {
        //       info.partial = true;
        //       return result;
        //     }
    };
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {

    return {
        url: "http://localhost:4000/graphql",
        // this is important for cookie data
        fetchOptions: {
            credentials: "include" as const,
            // headers: isServer() ? ctx.req.headers.cookie : undefined
            headers: isServer()
                ? {
                      cookie: ctx.req.headers.cookie
                  }
                : undefined
        },
    /**
     * this block of code below will run everytime the login or register
     * mutation runs and it's purpose is to update the cache.
     *
     * In particular we are updating the me query and placing the correct
     * user inside of there.
     */
    exchanges: [
        dedupExchange,
        cacheExchange({
            keys: {
                PaginatedPosts: () => null
            },
            resolvers: {
                Query: {
                    posts: cursorPagination()
                }
            },
            updates: {
                Mutation: {
                    logout: (_result, _, cache, __) => {
                        // return null for the me query when the user is logged out
                        betterUpdateQuery<LogoutMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            () => ({ me: null })
                        );
                    },
                    login: (_result, _, cache, __) => {
                        betterUpdateQuery<LoginMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.login.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.login.user
                                    };
                                }
                            }
                        );
                    },

                    register: (_result, _, cache, __) => {
                        betterUpdateQuery<RegisterMutation, MeQuery>(
                            cache,
                            { query: MeDocument },
                            _result,
                            (result, query) => {
                                if (result.register.errors) {
                                    return query;
                                } else {
                                    return {
                                        me: result.register.user
                                    };
                                }
                            }
                        );
                    }
                }
            }
        }),
        errorExchange,
        ssrExchange,
        fetchExchange
    ]
});
