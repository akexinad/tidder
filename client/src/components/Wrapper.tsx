import { Box } from "@chakra-ui/core";
import React, { FC } from "react";

export type WrapperVariant = "small" | "regular";

interface WrapperProps {
    variant?: WrapperVariant;
}

export const Wrapper: FC<WrapperProps> = ({
    children,
    variant = "regular"
}) => {
    return (
        <Box
            maxW={variant === "regular" ? "800px" : "400px"}
            w="100%"
            mt={8}
            mx="auto"
        >
            {children}
        </Box>
    );
};
