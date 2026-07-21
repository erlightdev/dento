import { createDb } from "@Dento/db";
import * as schema from "@Dento/db/schema/auth";
import { env } from "@Dento/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_SECURE,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "mysql",
			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await transporter.sendMail({
					from: env.EMAIL_FROM,
					to: user.email,
					subject: "Reset your password",
					html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Reset your password</h2>
              <p>Hi ${user.name || "there"},</p>
              <p>Click the link below to reset your password:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
            </div>
          `,
				});
			},
		},
		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				await transporter.sendMail({
					from: env.EMAIL_FROM,
					to: user.email,
					subject: "Verify your email address",
					html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Verify your email</h2>
              <p>Hi ${user.name},</p>
              <p>Click the link below to verify your email address:</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Verify Email
              </a>
              <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't create an account, ignore this email.</p>
            </div>
          `,
				});
			},
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [
			admin({
				defaultRole: "user",
				adminRoles: ["admin"],
				impersonationSessionDuration: 60 * 60,
			}),
			emailOTP({
				async sendVerificationOTP({ email, otp, type }) {
					let subject = "Verification Code";
					let bodyText = `Your code is: ${otp}`;
					let bodyHtml = `<p>Your verification code is: <strong>${otp}</strong></p>`;

					if (type === "sign-in") {
						const { db } = await import("@Dento/db");
						const u = await db.query.user.findFirst({
							where: (fields, { eq }) =>
								eq(fields.email, email.trim().toLowerCase()),
						});
						if (!u) {
							console.warn(
								`[Security] Blocked sign-in OTP email for unregistered address: ${email}`,
							);
							return;
						}
						subject = "Sign-In Verification Code";
						bodyText = `Your sign-in verification code is: ${otp}`;
						bodyHtml = `<p>Your sign-in verification code is: <strong>${otp}</strong></p>`;
					} else if (type === "email-verification") {
						subject = "Verify Your Email Address";
						bodyText = `Your email verification code is: ${otp}`;
						bodyHtml = `<p>Your email verification code is: <strong>${otp}</strong></p>`;
					} else if (type === "forget-password") {
						const { db } = await import("@Dento/db");
						const u = await db.query.user.findFirst({
							where: (fields, { eq }) =>
								eq(fields.email, email.trim().toLowerCase()),
						});
						if (!u) {
							console.warn(
								`[Security] Blocked forget-password OTP email for unregistered address: ${email}`,
							);
							return;
						}
						subject = "Reset Password Verification Code";
						bodyText = `Your password reset verification code is: ${otp}`;
						bodyHtml = `<p>Your password reset verification code is: <strong>${otp}</strong></p>`;
					}

					await transporter.sendMail({
						from: env.EMAIL_FROM,
						to: email,
						subject,
						text: bodyText,
						html: bodyHtml,
					});
				},
			}),
		],
	});
}

export const auth = createAuth();
