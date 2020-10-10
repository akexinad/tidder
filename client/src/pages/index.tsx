import {
    Box,
    Button,
    Flex,
    Heading,
    IconButton,
    Link,
    Stack,
    Text
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import UpdootSection from "../components/UpdootSection";
import {
    useDeletePostMutation,
    useMeQuery,
    usePostsQuery
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [variables, setVariables] = useState({ limit: 15, cursor: null });

    const [{ data: meData }] = useMeQuery();

    const [{ data, fetching }] = usePostsQuery({
        variables
    });

    const [, deletePost] = useDeletePostMutation();

    if (!fetching && !data) {
        return <div>query failed. Check network tab.</div>;
    }

    return (
        <Layout>
            {fetching && !data ? (
                <div>loading...</div>
            ) : (
                <Stack mb={10} spacing={8}>
                    {/* 
                        After deleting posts and invalidating them in the cache, what
                        will happen now is that some posts may return as null. Therefore,
                        we need to check for null posts.
                     */}
                    {data.posts.posts.map((post) =>
                        !post ? null : (
                            <Flex
                                key={post.id}
                                p={5}
                                shadow="md"
                                borderWidth="1px"
                                borderRadius={10}
                            >
                                <UpdootSection post={post} />
                                <Box flex={1}>
                                    <NextLink
                                        href={`/post/[id]`}
                                        as={`/post/${post.id}`}
                                    >
                                        <Link>
                                            <Heading fontSize="xl">
                                                {post.title}
                                            </Heading>{" "}
                                        </Link>
                                    </NextLink>
                                    <Text>
                                        Posted by{" "}
                                        <strong>{post.author.username}</strong>
                                    </Text>
                                    <Flex align="center">
                                        <Text flex={1} mt={4}>
                                            {post.textSnippet}
                                        </Text>
                                        {meData.me?.id === post.author.id ? (
                                            <Box ml="auto">
                                                <NextLink
                                                    href={`/post/edit/[id]`}
                                                    as={`/post/edit/${post.id}`}
                                                >
                                                    <IconButton
                                                        as={Link}
                                                        mr={2}
                                                        variantColor="blue"
                                                        icon="edit"
                                                        aria-label="edit post"
                                                    />
                                                </NextLink>
                                                <IconButton
                                                    variantColor="red"
                                                    icon="delete"
                                                    aria-label="delete post"
                                                    onClick={() =>
                                                        deletePost({
                                                            id: post.id
                                                        })
                                                    }
                                                />
                                            </Box>
                                        ) : null}
                                    </Flex>
                                </Box>
                            </Flex>
                        )
                    )}
                </Stack>
            )}
            {data && data.posts.hasMore ? (
                <Flex>
                    <Button
                        onClick={() =>
                            setVariables({
                                limit: variables.limit,
                                cursor:
                                    data.posts.posts[
                                        data.posts.posts.length - 1
                                    ].createdAt
                            })
                        }
                        isLoading={fetching}
                        m="auto"
                        my={8}
                    >
                        Load More
                    </Button>
                </Flex>
            ) : null}
        </Layout>
    );
};

/**
 * TIP
 *
 * Only use SSR if you want the data on a particular to be found by google
 * or if you want the page to follow SEO practices.
 */
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
