import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

/**
 * the @ObjectType() tells type graphql to
 * refer to this class as a type as well so
 * we can use it to infer the type the
 * resolvers Query decorator
 */
@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    id!: number;

    // Adding the field decortor will expose the property to graphql
    @Field(() => String)
    // the property decorator tells postgres that these are columns, not just fields in the class.
    @Property({ type: "date" })
    createdAt = new Date();

    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field(() => String)
    @Property({ type: "text", unique: true })
    username!: string;

    // we remove the field property so you cannot query it.
    @Property({ type: "text" })
    password!: string;
}
