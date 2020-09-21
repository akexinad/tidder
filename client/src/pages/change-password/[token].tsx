import {
    Alert,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    CloseButton,
    Link
} from "@chakra-ui/core";
import NextLink from "next/link";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";

import { createUrqlClient } from "../../utils/createUrqlClient";

import { toErrorMap } from "../../utils/toErrorMap";

import { useChangePasswordMutation } from "../../generated/graphql";

import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";

/**
 * this is a convention in next.js.
 *
 * If the name of a component is a variable, you put the
 * name is square brackets.
 */

const ChangePassword: NextPage = () => {
    const router = useRouter();
    /**
     * next js and the router knows it's called a token 
     * is because of the file name.
     */
    const {
        query: { token }
    } = router;
    const [, changePassword] = useChangePasswordMutation();
    const [tokenError, setTokenError] = useState("");

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await changePassword({
                        newPassword: values.newPassword,
                        token: Array.isArray(token) ? token[0] : token
                    });

                    if (response.data.changePassword.errors) {
                        const errorMap = toErrorMap(
                            response.data.changePassword.errors
                        );

                        // handling the token error
                        if ("token" in errorMap) {
                            setTokenError(errorMap.token);
                        }

                        setErrors(errorMap);
                    } else if (response.data.changePassword.user) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="New Password"
                            label="New Password"
                            type="password"
                        />
                        {tokenError ? (
                            <Box textAlign="center" display="block">
                                <Alert mt={4} mb={4} status="error">
                                    <AlertIcon />
                                    <AlertTitle mr={2}>{tokenError}</AlertTitle>
                                    <CloseButton
                                        ml={2}
                                        position="absolute"
                                        right="8px"
                                        top="8px"
                                    />
                                </Alert>
                                <NextLink href={"/forgot-password"}>
                                    <Link fontWeight="bold">
                                        Click here to get a new token
                                    </Link>
                                </NextLink>
                            </Box>
                        ) : null}
                        <Button
                            mt={4}
                            type="submit"
                            variantColor="teal"
                            isLoading={isSubmitting}
                        >
                            Change Password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(ChangePassword);
