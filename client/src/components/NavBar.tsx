import React, { FC } from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import NextLink from "next/link";

import { isServer } from "../utils/isServer";

import { useLogoutMutation, useMeQuery } from "../generated/graphql";

export const NavBar: FC = () => {
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
            <Flex>
                <Box mr={4}>{data.me.username}</Box>
                <Button
                    variant="link"
                    onClick={() => {
                        logout();
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
            <NextLink href="/">
                <Link>
                    <strong>TiDDER</strong>
                </Link>
            </NextLink>
            <Box ml="auto">{body}</Box>
        </Flex>
    );
};
