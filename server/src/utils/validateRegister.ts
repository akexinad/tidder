import validator from "validator";

import { RegisterInput } from "src/resolvers/RegisterInput";

export const validateRegister = (options: RegisterInput) => {
    const { isLength, isEmail } = validator;
    const { username, email, password } = options;

    if (!isLength(username, { min: 2 })) {
        return [
            {
                field: "username",
                message: "username is too short"
            }
        ];
    }

    if (!isEmail(email)) {
        return [
            {
                field: "email",
                message: "invalid email"
            }
        ];
    }

    if (!isLength(password, { min: 5 })) {
        return [
            {
                field: "password",
                message: "password is too short"
            }
        ];
    }

    return null;
};
