import { Flex, IconButton } from "@chakra-ui/core";
import React, { FC, useState } from "react";
import {
    PostSnippetFragment,
    useVoteMutation
} from "../generated/graphql";

interface UpdootSectionProps {
    post: PostSnippetFragment;
}

const UpdootSection: FC<UpdootSectionProps> = ({ post }) => {
    const { id, voteStatus, points } = post;

    const [loadingState, setloadingState] = useState<
        "updoot-loading" | "downdoot-loading" | "not-loading"
    >("not-loading");
    const [, vote] = useVoteMutation();

    return (
        <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            mr="4"
        >
            <IconButton
                variantColor={voteStatus === 1 ? "green" : undefined}
                isLoading={loadingState === "updoot-loading"}
                onClick={async () => {
                    setloadingState("updoot-loading");
                    await vote({
                        postId: id,
                        value: 1
                    });
                    setloadingState("not-loading");
                }}
                aria-label="updoot-post"
                icon="chevron-up"
            />
            {points}
            <IconButton
                variantColor={voteStatus === -1 ? "red" : undefined}
                isLoading={loadingState === "downdoot-loading"}
                icon="chevron-down"
                aria-label="downvote-post"
                onClick={async () => {
                    setloadingState("downdoot-loading");
                    vote({
                        postId: id,
                        value: -1
                    });
                    setloadingState("not-loading");
                }}
            />
        </Flex>
    );
};

export default UpdootSection;
