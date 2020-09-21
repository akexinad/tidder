import { Box, Button } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import React, { FC } from "react";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";

import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";

import { useCreatePostMutation } from "../generated/graphql";

import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import Layout from "../components/Layout";

const CreatePost: FC = () => {
    useIsAuth();
    const router = useRouter();
    const [, createPost] = useCreatePostMutation();

    return (
        <Layout variant="small">
            <Wrapper variant="small">
                <Formik
                    initialValues={{ title: "", text: "" }}
                    onSubmit={async (values) => {
                        const { error } = await createPost({ options: values });

                        if (!error) {
                            router.push("/");
                        }
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form>
                            <InputField
                                name="title"
                                placeholder="Title"
                                label="title"
                            />
                            <Box mt={4}>
                                <InputField
                                    name="text"
                                    placeholder="text..."
                                    label="Body"
                                    textarea={true}
                                />
                            </Box>{" "}
                            <Button
                                mt={4}
                                type="submit"
                                variantColor="teal"
                                isLoading={isSubmitting}
                            >
                                Create Post
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Wrapper>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(CreatePost);
