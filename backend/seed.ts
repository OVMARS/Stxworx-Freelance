import { storage } from "./storage";
import { authService } from "./services/auth.service";

async function seed() {
  console.log("🌱 Starting seed...");

  // Seed Admin User
  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    console.log("Creating default admin user...");
    const hashedPassword = await authService.hashPassword("SuperSecretAdminPassword123!");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
    });
    console.log("✅ Default admin created: admin / SuperSecretAdminPassword123!");
  } else {
    console.log("ℹ️ Admin user already exists");
  }

  // Categories (if using DB storage, seed them)
  const categories = await storage.getAllCategories();
  if (categories.length === 0) {
    console.log("Seeding categories...");
    const categoryData = [
      {
        name: "Creative & Design",
        icon: "Palette",
        subcategories: [
          "UI/UX Design",
          "Logo & Branding",
          "Animation & Motion Graphics",
          "VFX / CGI",
          "3D Modeling & Rendering",
          "NFT Art & Collectibles",
          "Product Mockups",
        ],
      },
      {
        name: "Development & Tech",
        icon: "Code",
        subcategories: [
          "Smart Contract Development (Clarity, Solidity, Rust)",
          "Web2 → Web3 Integration",
          "dApp Development",
          "Game Development (Unity / WebGL / React)",
          "AI & Machine Learning",
          "API Integration",
          "Automation & Robotics",
        ],
      },
      // ... rest of the categories can be added here if needed for DB persistence
      // Since MemStorage seeds itself, we might only need this for PostgresStorage
    ];

    // Check if storage is PostgresStorage (by checking if 'db' property exists or trying to insert)
    // For now, let's assume MemStorage logic handles itself and this is primarily for DB
  }

  console.log("✓ Seeding complete");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
