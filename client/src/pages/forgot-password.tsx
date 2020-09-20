import { Box, Button } from "@chakra-ui/core";
import React, { FC, useState } from "react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";

import { useForgotPasswordMutation } from "../generated/graphql";

import { createUrqlClient } from "../utils/createUrqlClient";

import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";

const ForgotPassword: FC<{}> = ({}) => {
    const [, forgotPassword] = useForgotPasswordMutation();

    const [complete, setComplete] = useState(false);

    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ email: "" }}
                onSubmit={async (values) => {
                    await forgotPassword(values);
                    setComplete(true);
                }}
            >
                {({ isSubmitting }) =>
                    complete ? (
                        <Box>
                            If an account with that email exists, we sent you an
                            email.
                        </Box>
                    ) : (
                        <Form>
                            <InputField
                                name="email"
                                placeholder="email"
                                label="Email"
                            />
                            <Button
                                mt={4}
                                type="submit"
                                variantColor="teal"
                                isLoading={isSubmitting}
                            >
                                Change Password
                            </Button>
                        </Form>
                    )
                }
            </Formik>
        </Wrapper>
    );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
