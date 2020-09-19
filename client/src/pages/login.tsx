import React, { FC } from "react";
import { Form, Formik } from "formik";
import { Box, Button } from "@chakra-ui/core";
import { useRouter } from "next/router";

import { useLoginMutation } from "../generated/graphql";

import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { toErrorMap } from "../utils/toErrorMap";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";

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
                        router.push("/");
                    }

                    response.data.login.user.id;
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
                        </Box>
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
