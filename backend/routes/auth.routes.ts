import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import rateLimit from "express-rate-limit";

export const authRoutes = Router();

// Rate Limiting: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { message: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Public routes
authRoutes.post("/login", loginLimiter, authController.login);
authRoutes.post("/logout", authController.logout);

// Protected routes (require valid token)
authRoutes.get("/me", verifyToken, authController.getMe);
authRoutes.post("/register", verifyToken, authController.register); // Only existing admins can register new ones
