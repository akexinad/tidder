import { withUrqlClient } from "next-urql";
import React from "react";
import { Link } from "@chakra-ui/core";
import NextLink from "next/link";

import { usePostsQuery } from "../generated/graphql";

import { createUrqlClient } from "../utils/createUrqlClient";

import Layout from "../components/Layout";

const Index = () => {
    const [{ data }] = usePostsQuery({
        variables: {
            limit: 10
        }
    });

    return (
        <Layout>
            <NextLink href="/create-post">
                <Link fontWeight={"bold"}>CREATE POST</Link>
            </NextLink>
            <br />
            <br />
            <br />
            {!data ? (
                <div>loading...</div>
            ) : (
                data.posts.map((p) => (
                    <div key={p.id}>
                        <h1>{p.title}</h1>
                        <br />
                        <p>{p.createdAt}</p>
                        <p>{p.updatedAt}</p>
                        <br />
                    </div>
                ))
            )}
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
