import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!adminEmail) {
  console.error("ADMIN_EMAIL is required");
  process.exit(1);
}

const db = drizzle({
  connection: { uri: databaseUrl! },
  schema,
  mode: "default",
});

async function main() {
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, adminEmail!))
    .limit(1);

  if (!user) {
    console.error(`No user found with email: ${adminEmail}`);
    console.error("Sign up first, then run this script.");
    process.exit(1);
  }

  await db
    .update(schema.user)
    .set({ role: "admin", emailVerified: true })
    .where(eq(schema.user.id, user.id));

  console.log(`User ${adminEmail} promoted to admin successfully.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
