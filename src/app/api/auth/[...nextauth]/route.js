import bcrypt from "bcrypt";
import mongoose from "mongoose";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/libs/mongoConnect";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo";

const authOptions = {
  secret: process.env.SECRET,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      id: 'credentials',
      credentials: {
        username: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password", placeholder: "password" }
      },
      async authorize(credentials, req) {
        const { email, password } = credentials;

        mongoose.connect(process.env.MONGO_URL);
        const user = await User.findOne({ email });
        const passwordOk = user && bcrypt.compareSync(password, user.password);

        if (passwordOk) {
          const userInfo = await UserInfo.findOne({ email });
          if (userInfo && userInfo.admin) {
            return user;
          }
        }

        return null;
      }
    })
  ],
};

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
