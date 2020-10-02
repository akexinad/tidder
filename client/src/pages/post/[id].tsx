import { Box, Heading } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { FC } from "react";
import { Layout } from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";

export const Post: FC = ({}) => {
    const router = useRouter();

    const [{ data, fetching, error }] = usePostQuery({
        pause: !router.query.id,
        variables: {
            id: +router.query.id || +[router.query.id]
        }
    });

    if (fetching) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Dude there was error: {error.message}</div>;
    }

    return (
        <Layout>
            <Box textAlign="center">
                <Heading mb={4}>{data.post.title}</Heading>
            </Box>
            {<div>{data.post.text}</div>}
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
