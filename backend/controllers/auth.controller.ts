import { type Request, type Response, type NextFunction } from "express";
import { authService } from "../services/auth.service";
import { storage } from "../storage";
import { z } from "zod";

const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export class AuthController {

    // POST /api/auth/login
    login = async (req: Request, res: Response) => {
        try {
            // Validate input
            const result = loginSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ message: "Validation error", errors: result.error.errors });
            }

            const { username, password } = result.data;

            // Find user
            const user = await storage.getUserByUsername(username);
            if (!user) {
                // Return generic error for security
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Verify password
            const isValid = await authService.comparePassword(password, user.password);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Generate token
            const token = authService.generateToken(user);

            // Set secure cookie
            // Check both app.get("env") and explicit NODE_ENV to be safe
            const isProduction = req.app.get("env") === "production" || process.env.NODE_ENV === "production";

            res.cookie(authService.getCookieName(), token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "strict",
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                path: "/",
            });

            return res.status(200).json({
                message: "Login successful",
                user: { id: user.id, username: user.username, role: user.role }
            });

        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };

    // POST /api/auth/register (Protected/Internal use)
    register = async (req: Request, res: Response) => {
        try {
            const result = registerSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({ message: "Validation error", errors: result.error.errors });
            }

            const { username, password } = result.data;

            // Check existing
            const existing = await storage.getUserByUsername(username);
            if (existing) {
                return res.status(409).json({ message: "Username already exists" });
            }

            // Hash password
            const hashedPassword = await authService.hashPassword(password);

            // Create user
            const user = await storage.createUser({
                username,
                password: hashedPassword,
            });

            return res.status(201).json({
                message: "User registered successfully",
                user: { id: user.id, username: user.username, role: user.role }
            });

        } catch (error) {
            console.error("Register error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };

    // POST /api/auth/logout
    logout = async (_req: Request, res: Response) => {
        res.clearCookie(authService.getCookieName(), {
            httpOnly: true,
            sameSite: "strict",
            path: "/",
        });
        return res.status(200).json({ message: "Logout successful" });
    };

    // GET /api/auth/me
    getMe = async (req: Request, res: Response) => {
        try {
            // Middleware should have attached user to req
            const user = (req as any).user;
            if (!user) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            // Return user without password
            const { password, ...safeUser } = user;
            return res.status(200).json({ user: safeUser });
        } catch (error) {
            return res.status(500).json({ message: "Internal server error" });
        }
    };
}

export const authController = new AuthController();
