import React, { FC, InputHTMLAttributes } from "react";
import { useField } from "formik";
import {
    FormControl,
    FormLabel,
    Input,
    FormErrorMessage, Textarea
} from "@chakra-ui/core";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    name: string;
    textarea?: boolean;
};

export const InputField: FC<InputFieldProps> = ({
    label,
    textarea = false,
    size: _,
    ...props
}) => {
    const [field, { error }] = useField(props);

    const InputElementType = textarea ? Textarea : Input;

    return (
        // the !! casts the object to a boolean
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            <InputElementType
                {...field}
                {...props}
                type={props.type}
                id={field.name}
                placeholder={props.placeholder}
            />
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
        </FormControl>
    );
};
