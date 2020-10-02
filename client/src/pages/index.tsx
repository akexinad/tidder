import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import UpdootSection from "../components/UpdootSection";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [variables, setVariables] = useState({ limit: 15, cursor: null });

    const [{ data, fetching }] = usePostsQuery({
        variables
    });

    if (!fetching && !data) {
        return <div>query failed. Check network tab.</div>;
    }

    return (
        <Layout>
            <Flex>
                <Heading>TiDDER</Heading>
                <NextLink href="/create-post">
                    <Link m="auto 0 auto auto">create post</Link>
                </NextLink>
            </Flex>
            <br />
            {fetching && !data ? (
                <div>loading...</div>
            ) : (
                <Stack mb={10} spacing={8}>
                    {data.posts.posts.map((post) => (
                        <Flex
                            key={post.id}
                            p={5}
                            shadow="md"
                            borderWidth="1px"
                            borderRadius={10}
                        >
                            <UpdootSection post={post} />
                            <Box>
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
                                <Text mt={4}>{post.textSnippet}</Text>
                            </Box>
                        </Flex>
                    ))}
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
