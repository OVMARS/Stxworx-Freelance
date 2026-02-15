import { type Request, type Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { users, reviews } from "@shared/schema";
import { eq } from "drizzle-orm";

const updateProfileSchema = z.object({
  username: z.string().min(1).max(100).optional(),
});

export const userController = {
  // GET /api/users/:address
  async getByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const [user] = await db
        .select({
          id: users.id,
          stxAddress: users.stxAddress,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.stxAddress, address));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // PATCH /api/users/me
  async updateMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Validation error", errors: result.error.errors });
      }

      await db
        .update(users)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
      const [updated] = await db.select().from(users).where(eq(users.id, req.user.id));

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: updated.id,
        stxAddress: updated.stxAddress,
        username: updated.username,
        role: updated.role,
        isActive: updated.isActive,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  // GET /api/users/:address/reviews
  async getReviews(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stxAddress, address));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.revieweeId, user.id));

      return res.status(200).json(userReviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
