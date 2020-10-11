import { Box, IconButton, Link } from "@chakra-ui/core";
import NextLink from "next/link";
import React, { FC } from "react";
import { Post, useDeletePostMutation } from "../generated/graphql";

interface EditDeletePostButtonsProps {
    postId: Post["id"];
}

const EditDeletePostButtons: FC<EditDeletePostButtonsProps> = ({ postId }) => {
    const [, deletePost] = useDeletePostMutation();

    return (
        <Box>
            <NextLink href={`/post/edit/[id]`} as={`/post/edit/${postId}`}>
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
                        id: postId
                    })
                }
            />
        </Box>
    );
};

export default EditDeletePostButtons;
