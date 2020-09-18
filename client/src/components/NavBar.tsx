import React, { FC } from "react";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import NextLink from "next/link";

import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: FC<NavBarProps> = ({}) => {
    const [{ data, fetching }] = useMeQuery();

    let body = null;

    if (fetching) {
        // data is loading
    } else if (!data.me) {
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
                <Button variant="link">logout</Button>
            </Flex>
        );
    }

    return (
        <Flex bg="tomato" p={4}>
            <Box ml="auto">{body}</Box>
        </Flex>
    );
};
