import { withUrqlClient } from "next-urql";
import React from "react";

import { NavBar } from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
    const [{ data }] = usePostsQuery();

    return (
        <>
            <NavBar />
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
        </>
    );
};

/**
 * TIP
 * 
 * Only use SSR if you want the data on a particular to be found by google
 * or if you want the page to follow SEO practices.
 */
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
