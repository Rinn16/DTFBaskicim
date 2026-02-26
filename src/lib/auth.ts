import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { rateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/giris",
    newUser: "/kayit",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "email-password",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Sifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit: 10 login attempts per email per hour
        const email = credentials.email as string;
        const { success } = await rateLimit(`login:${email}`, 10, 3600);
        if (!success) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname}`,
          image: user.image,
        };
      },
    }),
    Credentials({
      id: "phone-otp",
      name: "Telefon",
      credentials: {
        phone: { label: "Telefon", type: "tel" },
        code: { label: "Dogrulama Kodu", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;

        // Rate limit: 10 OTP verify attempts per phone per hour
        const phone = credentials.phone as string;
        const { success } = await rateLimit(`otp-verify:${phone}`, 10, 3600);
        if (!success) return null;

        // Find the most recent unverified OTP for this phone
        const otp = await db.otpCode.findFirst({
          where: {
            phone: credentials.phone as string,
            verified: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!otp) return null;
        if (otp.attempts >= 5) return null;

        // Increment attempts counter
        await db.otpCode.update({
          where: { id: otp.id },
          data: { attempts: { increment: 1 } },
        });

        // Check code after incrementing attempts
        if (otp.code !== (credentials.code as string)) return null;

        // Mark OTP as verified
        await db.otpCode.update({
          where: { id: otp.id },
          data: { verified: true },
        });

        // Find or create user
        let user = await db.user.findUnique({
          where: { phone: credentials.phone as string },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              phone: credentials.phone as string,
              name: "",
              surname: "",
              authProvider: "PHONE",
              phoneVerified: true,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.name} ${user.surname}`.trim() || user.phone,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Find or create user for Google OAuth
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const nameParts = (user.name || "").split(" ");
          const name = nameParts[0] || "";
          const surname = nameParts.slice(1).join(" ") || "";

          const newUser = await db.user.create({
            data: {
              email: user.email!,
              name,
              surname,
              authProvider: "GOOGLE",
              emailVerified: true,
              image: user.image,
            },
          });

          // Store the account link
          await db.account.create({
            data: {
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });

          user.id = newUser.id;
        } else {
          user.id = existingUser.id;

          // Update account link if needed
          const existingAccount = await db.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            await db.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                refresh_token: account.refresh_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      // Fetch role from database
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, surname: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = `${dbUser.name} ${dbUser.surname}`.trim();
          token.profileComplete = !!(dbUser.name?.trim() && dbUser.surname?.trim());
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CUSTOMER" | "ADMIN";
        session.user.profileComplete = token.profileComplete as boolean;
      }
      return session;
    },
  },
});
