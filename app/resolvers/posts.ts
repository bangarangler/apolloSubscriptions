import {
  Resolver,
  Mutation,
  Arg,
  Query,
  Ctx,
  Field,
  ObjectType,
  // Subscription,
  // Root,
  // PubSub,
  // Publisher,
  // UseMiddleware,
  // FieldResolver,
  // Root,
} from "type-graphql";
import mongodb from "mongodb";
import { Post } from "../entities/Posts";
// import * as mongoose from "mongoose";
import { MyContext } from "../types";
// import { isAuth } from "../middleware/isAuth";
import { CreatePostInput } from "./types/create-post-input";

// import { Cart, CartModel } from "../entities/Cart";

const MongoClient = mongodb.MongoClient;
let db: any;
MongoClient.connect(
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@jnjtype-todo.01wb5.mongodb.net/subscriptions?retryWrites=true&w=majority`,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, database) => {
    if (err) {
      return console.error(err);
    }
    console.log("we have dumb db");
    db = database;
  }
);

@ObjectType()
class PostError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class PostResponse {
  @Field(() => [PostError], { nullable: true })
  errors?: PostError[];

  @Field(() => Post, { nullable: true })
  post?: Post;
}

@Resolver(() => PostResponse)
export class PostsResolvers {
  // @Query(() => User, { nullable: false })
  // async user(@Arg("id") id: string) {
  //   return await UserModel.findById({ _id: id });
  // }

  @Query(() => [Post])
  async posts(@Ctx() { models }: MyContext) {
    const { PostModel } = models;
    return await PostModel.find();
  }

  @Query(() => Post, { nullable: false })
  async post(@Ctx() { models }: MyContext, @Arg("id") id: string) {
    const { PostModel } = models;
    return await PostModel.findById({ _id: id });
  }

  @Mutation(() => PostResponse)
  async createPost(
    @Ctx() { models }: MyContext,
    @Arg("input") { title, content, creatorId }: CreatePostInput
  ): Promise<PostResponse> {
    try {
      const { PostModel } = models;
      console.log({ PostModel });
      console.log({ title, content, creatorId });
      if (!title || !content || !creatorId) throw "Fields must be filled out";

      const newPost = {
        title,
        content,
        creatorId,
        // these have to be added manually
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // const dbPost = await PostModel.create(newPost);
      const dbPost = await db
        .db("subscriptions")
        .collection("jill")
        .insertOne(newPost);
      console.log({ res: dbPost.ops[0] });
      return { post: dbPost.ops[0] };
    } catch (err) {
      console.log("err", err);
      const errors = [
        {
          field: "internal",
          message: `something went wrong internally ${err}`,
        },
      ];
      return { errors };
    }
  }

  // @Query(() => User, { nullable: true })
  // // @UseMiddleware(isAuth)
  // async me(@Ctx() { req }: MyContext) {
  //   if (!req?.session.userId) {
  //     return null;
  //   }
  //   return UserModel.findOne({ _id: req.session.userId });
  // }

  // Mutation: {
  //
  // }
  //
  // @Mutation(() => UserResponse)
  // async register(
  //   @Ctx() { models, req }: MyContext,
  //   @Arg("URArg")
  //   { username, email, password, confirmPassword }: UserRegisterInput,
  //   @PubSub("MESSAGE")
  //   sayMessage: Publisher<any>
  // ): Promise<UserResponse> {
  //   try {
  //     await sayMessage({ newMessage: "MORE TESTING" });
  //     if (
  //       password.toLowerCase().trim() !== confirmPassword.toLowerCase().trim()
  //     ) {
  //       console.log("pw don't match");
  //       const errors = [
  //         {
  //           field: "password",
  //           message: "Password's Don't match!",
  //         },
  //       ];
  //       return { errors };
  //     }
  //     const { UserModel } = models;
  //     const hashedPw = await argon2.hash(password);
  //     console.log({ hashedPw });
  //     const user = await UserModel.findOne({ email }).exec();
  //     if (user) {
  //       console.log("user found");
  //       const errors = [
  //         {
  //           field: "username",
  //           message: "User already Exists!",
  //         },
  //       ];
  //       return { errors };
  //     } else {
  //       const newUser = {
  //         username,
  //         email,
  //         password: hashedPw,
  //       };
  //       const haveUser = await UserModel.create(newUser);
  //       req!.session.userId = haveUser._id;
  //       return { user: haveUser };
  //     }
  //   } catch (err) {
  //     console.log("err from register", err);
  //     const errors = [
  //       {
  //         field: "Internal",
  //         message: "Something went wrong internally!",
  //       },
  //     ];
  //     return { errors };
  //   }
  // }

  // @Subscription((returns) => String, { topics: "MESSAGE" })
  // newMessage(@Root() newMessage: String): any {
  //   return "TESTING";
  // }

  // @Mutation(() => UserResponse)
  // async login(
  //   @Arg("usernameOrEmail") usernameOrEmail: string,
  //   @Arg("password") password: string,
  //   @Ctx() { req, store }: MyContext
  // ): Promise<UserResponse> {
  //   try {
  //     console.log("store", store);
  //     const user = await UserModel.findOne(
  //       usernameOrEmail.includes("@")
  //         ? { email: usernameOrEmail }
  //         : { username: usernameOrEmail }
  //     );
  //     if (!user) {
  //       return {
  //         errors: [
  //           {
  //             field: "usernameOrEmail",
  //             message: "Username don't exist",
  //           },
  //         ],
  //       };
  //     }
  //     const valid = await argon2.verify(user.password, password);
  //     if (!valid) {
  //       return {
  //         errors: [
  //           {
  //             field: "password",
  //             message: "Bad Credentials",
  //           },
  //         ],
  //       };
  //     }
  //     req!.session.userId = user._id;
  //     return { user };
  //   } catch (err) {
  //     console.log("err from login catch", err);
  //     const errors = [
  //       {
  //         field: "Internal",
  //         message: "Something Went Wrong Internally",
  //       },
  //     ];
  //     return { errors };
  //   }
  // }

  // @Mutation(() => Boolean)
  // logout(@Ctx() { req, res }: MyContext) {
  //   return new Promise((resolve) =>
  //     req?.session.destroy((err) => {
  //       res?.clearCookie(COOKIE_NAME);
  //       if (err) {
  //         console.log("err from logout promise: ", err);
  //         resolve(false);
  //       }
  //       resolve(true);
  //     })
  //   );
  // }
}
