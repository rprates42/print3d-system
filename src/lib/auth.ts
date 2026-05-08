import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const USERS = [
  {
    id: "1",
    name: process.env.USER1_NAME ?? "Usuário 1",
    email: process.env.USER1_EMAIL ?? "",
    password: process.env.USER1_PASSWORD ?? "",
  },
  {
    id: "2",
    name: process.env.USER2_NAME ?? "Usuário 2",
    email: process.env.USER2_EMAIL ?? "",
    password: process.env.USER2_PASSWORD ?? "",
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = USERS.find(
          (u) =>
            u.email &&
            u.email === credentials.email &&
            u.password === credentials.password
        );
        return user ?? null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
