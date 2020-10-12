import {
    Cache,
    cacheExchange,
    Data,
    Resolver
} from "@urql/exchange-graphcache";
import gql from "graphql-tag";
import Router from "next/router";
import {
    dedupExchange,
    Exchange,
    fetchExchange,
    stringifyVariables
} from "urql";
import { pipe, tap } from "wonka";
import {
    DeletePostMutationVariables,
    LoginMutation,
    LogoutMutation,
    MeDocument,
    MeQuery,
    RegisterMutation,
    VoteMutationVariables
} from "../generated/graphql";
import { LoggedInUserData, PostToDeleteData } from "../types";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

const POST_TYPENAME = "Post";

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
    };
};

const invalidateAllPosts = (cache: Cache) => {
    const POSTS = "posts";
    const QUERY = "Query";

    const allFields = cache.inspectFields("Query");
    const fieldInfos = allFields.filter((info) => info.fieldName === POSTS);

    /**
     * We need to invalidate all the queries
     */
    fieldInfos.forEach((field) => {
        cache.invalidate(QUERY, POSTS, field.arguments || {});
    });
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
    return {
        url: "http://localhost:4000/graphql",
        // this is important for cookie data
        fetchOptions: {
            credentials: "include" as const,
            headers: isServer()
                ? {
                      cookie: ctx?.req?.headers.cookie
                  }
                : undefined
        },
        /**
         * This block of code below will run everytime the login or register
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
                        deletePost: (_, args, cache, __) => {
                            const deletePostArgs = args as DeletePostMutationVariables;

                            /**
                             * We do not want to delete the posts that do not
                             * belong to the user.
                             */

                            const loggedInUserData = cache.readQuery({
                                query: gql`
                                    query Me {
                                        me {
                                            id
                                        }
                                    }
                                `
                            }) as LoggedInUserData;

                            const postToDeleteData = cache.readFragment(
                                gql`
                                    fragment _ on Post {
                                        author {
                                            id
                                        }
                                    }
                                `,
                                { id: deletePostArgs.id } as Data
                            ) as PostToDeleteData;

                            if (
                                loggedInUserData.me.id !==
                                postToDeleteData.author.id
                            ) {
                                return;
                            }

                            cache.invalidate({
                                __typename: POST_TYPENAME,
                                id: deletePostArgs.id
                            });
                        },
                        vote: (_, args, cache, __) => {
                            const {
                                postId,
                                value
                            } = args as VoteMutationVariables;

                            const data = cache.readFragment(
                                gql`
                                    fragment _  on Post {
                                        id
                                        points
                                        voteStatus
                                    }
                                `,
                                { id: postId } as Data
                            );

                            if (data) {
                                /**
                                 * User wants to remove their 
                                 * vote from the post.
                                 */
                                if (data.voteStatus === value) {
                                    const currentPoints = +data.points;

                                    const newPoints = data.voteStatus === 1 ? currentPoints - 1 : currentPoints + 1
                                    
                                    return cache.writeFragment(
                                        gql`
                                            fragment __ on Post {
                                                points
                                                voteStatus
                                            }
                                        `,
                                        {
                                            id: postId,
                                            points: newPoints,
                                            voteStatus: null,
                                            __typename: POST_TYPENAME
                                        } as Data
                                    );
                                }

                                /**
                                 * the user wants to downvote a post they upvoted
                                 */
                                const newPoints =
                                    +data.points +
                                    (!data.voteStatus ? 1 : 2) * value;

                                cache.writeFragment(
                                    gql`
                                        fragment ___ on Post {
                                            points
                                            voteStatus
                                        }
                                    `,
                                    {
                                        id: postId,
                                        points: newPoints,
                                        voteStatus: value,
                                        __typename: POST_TYPENAME
                                    } as Data
                                );
                            }
                        },

                        /**
                         * Updates the post list when user creates a new post
                         */
                        createPost: (_, __, cache, ___) => {
                            invalidateAllPosts(cache);
                        },

                        logout: (result, _, cache, __) => {
                            // return null for the me query when the user is logged out
                            betterUpdateQuery<LogoutMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result,
                                () => ({ me: null })
                            );
                        },

                        login: (result, _, cache, __) => {
                            betterUpdateQuery<LoginMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result,
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

                            /**
                             * Invalidate all the posts so the cache refreshes
                             * and thus the user will be able to see his upvotes.
                             */
                            invalidateAllPosts(cache);
                        },

                        register: (result, _, cache, __) => {
                            betterUpdateQuery<RegisterMutation, MeQuery>(
                                cache,
                                { query: MeDocument },
                                result,
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
    };
};
