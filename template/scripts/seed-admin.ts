import { eq } from "drizzle-orm";
import { db } from "@/statix/lib/db";
import { user } from "@/statix/db/schema";
import {
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from "@/statix/types/permissions";

async function seedAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;

  if (!email) {
    console.log("INITIAL_ADMIN_EMAIL not set, skipping admin seed.");
    return;
  }

  const [targetUser] = await db
    .select({ id: user.id, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!targetUser) {
    console.log(`User not found: ${email}`);
    console.log("Create an account first via OTP or social login.");
    return;
  }

  if (targetUser.role === "owner") {
    console.log(`User ${email} is already owner, skipping.`);
    return;
  }

  const ownerPerms = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.OWNER];

  await db
    .update(user)
    .set({
      role: SYSTEM_ROLES.OWNER,
      permissions: JSON.stringify(ownerPerms),
      updatedAt: new Date(),
    })
    .where(eq(user.id, targetUser.id));

  console.log(`✓ ${email} assigned as Owner.`);
}

async function main() {
  await seedAdmin();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
