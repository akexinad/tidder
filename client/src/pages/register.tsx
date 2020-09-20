import React, { FC } from "react";
import { Form, Formik } from "formik";
import { Box, Button } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";

import { toErrorMap } from "../utils/toErrorMap";
import { createUrqlClient } from "../utils/createUrqlClient";

import { useRegisterMutation } from "../generated/graphql";

import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";

interface RegisterProps {}

export const Register: FC<RegisterProps> = ({}) => {
    const router = useRouter();
    const [, register] = useRegisterMutation();

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ username: "", email: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await register({ options: values });

                    const { data: { register: responseRegister }} = response;

                    if (responseRegister.errors) {
                        setErrors(toErrorMap(responseRegister.errors));
                        return;
                    }

                    if (responseRegister.user) {
                        router.push("/");
                    }

                    if (!responseRegister.user) return;

                    responseRegister.user.id;
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
                                name="email"
                                placeholder="Email"
                                label="Email"
                            />
                        </Box>
                        <Box mt={4}>
                            <InputField
                                name="password"
                                placeholder="password"
                                label="Password"
                                type="password"
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            variantColor="teal"
                            isLoading={isSubmitting}
                        >
                            Register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient, { ssr: false })(Register);
