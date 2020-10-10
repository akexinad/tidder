import { Box, Button } from "@chakra-ui/core";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { FC } from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { Wrapper } from "../../../components/Wrapper";
import {
    usePostQuery,
    useUpdatePostMutation
} from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";

interface EditPostProps {}

const EditPost: FC<EditPostProps> = ({}) => {
    const router = useRouter();
    const postId = +router.query.id;

    const [{ data, fetching }] = usePostQuery({
        pause: postId === -1,
        variables: {
            id: postId
        }
    });

    const [, updatePost] = useUpdatePostMutation();

    if (fetching) {
        return <Layout>...Loading</Layout>;
    }

    return (
        <Layout variant="small">
            <Wrapper variant="small">
                <Formik
                    initialValues={{
                        title: data.post.title,
                        text: data.post.text
                    }}
                    onSubmit={async (values) => {
                        await updatePost({
                            id: postId,
                            ...values
                        });

                        router.push("/");
                        
                        // or router.back();
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
                                Update Post
                            </Button>
                        </Form>
                    )}
                </Formik>
            </Wrapper>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(EditPost);
