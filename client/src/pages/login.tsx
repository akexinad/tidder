import React, { FC } from "react";
import { Form, Formik } from "formik";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { withUrqlClient } from "next-urql";

import { useLoginMutation } from "../generated/graphql";

import { createUrqlClient } from "../utils/createUrqlClient";
import { toErrorMap } from "../utils/toErrorMap";

import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";

export const Login: FC<{}> = ({}) => {
    const router = useRouter();

    const [, login] = useLoginMutation();

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ username: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await login({ options: values });

                    if (response.data.login.errors) {
                        setErrors(toErrorMap(response.data.login.errors));
                    } else if (response.data.login.user) {
                        typeof router.query.next === "string"
                            ? router.push(router.query.next)
                            : router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="username"
                            placeholder="username"
                            label="Username"
                        />
                        <Box mt={4}>
                            <InputField
                                name="password"
                                placeholder="password"
                                label="Password"
                                type="password"
                            />
                        </Box>{" "}
                        <Flex>
                            <NextLink href={"/forgot-password"}>
                                <Link ml="auto" mt={2} fontWeight="bold">
                                    Forgot Password?
                                </Link>
                            </NextLink>
                        </Flex>
                        <Button
                            mt={4}
                            type="submit"
                            variantColor="teal"
                            isLoading={isSubmitting}
                        >
                            Login
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

// export default Login;
export default withUrqlClient(createUrqlClient)(Login);
