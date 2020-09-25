import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import Layout from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [variables, setVariables] = useState({ limit: 50, cursor: null });

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
                    {data.posts.posts.map((p) => (
                        <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                            <Heading fontSize="xl">{p.title}</Heading>
                            <Text mt={4}>{p.textSnippet}</Text>
                        </Box>
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
                                    data.posts.posts[data.posts.posts.length - 1]
                                        .createdAt
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
