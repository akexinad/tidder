import React, { FC, useEffect } from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import NextLink from "next/link";

import { isServer } from "../utils/isServer";

import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { useRouter } from "next/router";

export const NavBar: FC = () => {
    const router = useRouter();
    
    const [{ data, fetching }] = useMeQuery({
        pause: isServer()
    });
    const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

    let body = null;

    if (fetching) {
        // data is loading
    } else if (!data?.me) {
        // user is not logged in
        body = (
            <>
                <NextLink href="/login">
                    <Link mr={2}>login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link>register</Link>
                </NextLink>
            </>
        );
    } else {
        // user is logged in
        body = (
            <Flex align="center">
                <NextLink href="/create-post">
                    <Button as={Link} mr={4}>
                        create post
                    </Button>
                </NextLink>

                <Box mr={4}>{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={async () => {
                        await logout();

                        /**
                         * This will refresh the entire cache
                         * everytime when user logs out.
                         */
                        router.reload();
                    }}
                    isLoading={logoutFetching}
                >
                    logout
                </Button>
            </Flex>
        );
    }

    return (
        <Flex position="sticky" top={0} zIndex={1} bg="tomato" p={4}>
            <Flex maxW={800} flex={1} align="center" m="auto">
                <NextLink href="/">
                    <Link>
                        <strong>TiDDER</strong>
                    </Link>
                </NextLink>
                <Box ml="auto">{body}</Box>
            </Flex>
        </Flex>
    );
};
