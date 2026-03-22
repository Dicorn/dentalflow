import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "DENTIST",
      },
      clinicName: {
        type: "string",
        required: false,
      },
      clinicPhone: {
        type: "string",
        required: false,
      },
      clinicAddress: {
        type: "string",
        required: false,
      },
      plan: {
        type: "string",
        required: false,
        defaultValue: "BASIC",
      },
      planActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
      },
    },
  },
  trustedOrigins: [
    (() => {
      const url = process.env.BETTER_AUTH_URL;
      if (!url) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("[auth] BETTER_AUTH_URL is not set. Set it in your environment variables.");
        }
        return "http://localhost:3000";
      }
      return url;
    })(),
  ],
});

export type Session = typeof auth.$Infer.Session;
