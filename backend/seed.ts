import { db } from "./db";
import { admins, categories } from "@shared/schema";
import { adminAuthService } from "./services/admin-auth.service";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Starting seed...");

  // Seed default admin account
  const [existingAdmin] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, "admin"));

  if (!existingAdmin) {
    console.log("Creating default admin user...");
    const passwordHash = await adminAuthService.hashPassword("SuperSecretAdminPassword123!");
    await db.insert(admins).values({
      username: "admin",
      passwordHash,
    });
    console.log("Default admin created: admin / SuperSecretAdminPassword123!");
  } else {
    console.log("Admin user already exists");
  }

  // Admin seeding complete
  console.log("Seeding complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
