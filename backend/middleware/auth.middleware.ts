import { type Request, type Response, type NextFunction } from "express";
import { authService } from "../services/auth.service";
import { storage } from "../storage";

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    // Check for token in cookies
    const token = req.cookies && req.cookies[authService.getCookieName()];

    if (!token) {
        // If we're hitting an API endpoint, return 401
        return res.status(401).json({ message: "Authentication required" });
    }

    const payload = authService.verifyToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid or expired session" });
    }

    try {
        const user = await storage.getUser(payload.id);

        if (!user) {
            return res.status(401).json({ message: "User session revoked" });
        }

        req.user = payload;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};
