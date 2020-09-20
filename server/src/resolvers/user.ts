import argon2 from "argon2";
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver
} from "type-graphql";
import { EntityManager } from "@mikro-orm/postgresql";
import { v4 } from "uuid";
import validator from "validator";

import { MyContext } from "../types";

import { FORGOT_PASSWORD_PREFIX } from "../priv";
import { COOKIE_NAME } from "../constants";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";

import { RegisterInput } from "./RegisterInput";

import { User } from "../entities/User";

@InputType()
class LoginInput {
    @Field()
    username: string;

    @Field()
    password: string;
}

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: Array<FieldError>;

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    // CHANGE PASSWORD
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg("token") token: string,
        @Arg("newPassword") newPassword: string,
        @Ctx() { orm, req, redis }: MyContext
    ): Promise<UserResponse> {
        const validPassword = validator.isLength(newPassword, {
            min: 2
        });

        if (!validPassword) {
            return {
                errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater than 2"
                    }
                ]
            };
        }

        const redisKey = FORGOT_PASSWORD_PREFIX + token;

        const userId = await redis.get(redisKey);

        if (!userId) {
            /**
             * there is a chance that the user tampered with the token.
             * If that's the case, they do not deserve a good error message.
             */
            return {
                errors: [
                    {
                        field: "token",
                        message: "token expired"
                    }
                ]
            };
        }

        const user = await orm.em.findOne(User, { id: parseInt(userId) });

        if (!user) {
            /**
             * Again, this could happen if the user tampers with the token,
             * or the user just might not exist at all.
             */
            return {
                errors: [
                    {
                        field: "token",
                        message: "user no longer exists"
                    }
                ]
            };
        }

        user.password = await argon2.hash(newPassword);

        orm.em.persistAndFlush(user);

        // delete the key so the user cannot change the password again with the same link
        await redis.del(redisKey);

        // log in the user after they have changed the password
        req.session.userId = user.id;

        return {
            user
        };
    }

    // FORGOT PASSWORD
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg("email") email: string,
        @Ctx() { orm, redis }: MyContext
    ) {
        const user = await orm.em.findOne(User, { email });

        if (!user) {
            /**
             * a reason that you would want to return true is so
             * a prick won't be able to phish through the entire user db
             * to figure out an email that could work and change it's
             * password
             */
            return true;
        }

        const token = v4();
        await redis.set(
            FORGOT_PASSWORD_PREFIX + token,
            user.id,
            "ex",
            1000 * 60 * 60 * 24 * 3
        );

        const forgotPasswordLink = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`;
        sendEmail(email, forgotPasswordLink);

        return true;
    }

    @Query(() => User, { nullable: true })
    async me(@Ctx() { orm, req }: MyContext): Promise<User | null> {
        // you are not logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await orm.em.findOne(User, { id: req.session.userId });

        return user;
    }

    // REGISTER
    @Mutation(() => UserResponse)
    async register(
        @Arg("options") options: RegisterInput,
        @Ctx() { orm, req }: MyContext
    ): Promise<UserResponse> {
        const { username, email, password } = options;

        const errors = validateRegister(options);

        if (errors) {
            return { errors };
        }

        const hashedPass = await argon2.hash(password);

        let user;

        try {
            const result = await (orm.em as EntityManager)
                .createQueryBuilder(User)
                .getKnexQuery()
                .insert({
                    username,
                    password: hashedPass,
                    email,
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning("*");
            user = result[0];
        } catch (err) {
            // duplicate username error
            if (
                err.code === "23505"
                // || err.detail.includes("already exists")
            )
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken"
                        }
                    ]
                };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }

    // LOGIN
    @Mutation(() => UserResponse)
    async login(
        @Arg("options") options: LoginInput,
        @Ctx() { orm, req }: MyContext
    ): Promise<UserResponse> {
        const user = await orm.em.findOne(User, {
            username: options.username
        });

        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "invalid login"
                    }
                ]
            };
        }

        const valid = await argon2.verify(user.password, options.password);

        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "Invalid login"
                    }
                ]
            };
        }

        req.session.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve) =>
            req.session.destroy((err) => {
                if (err) {
                    console.log("error with destroying the session: ", err);
                    resolve(false);
                    return;
                }

                res.clearCookie(COOKIE_NAME);
                resolve(true);
            })
        );
    }
}
