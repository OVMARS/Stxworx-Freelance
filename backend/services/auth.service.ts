import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { User } from "@shared/schema";
import jwt from "jsonwebtoken";

const scrypt = promisify(_scrypt);

// Default secret for development, but should be replaced in production
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_development_only";
const COOKIE_NAME = "auth_token";

export interface TokenPayload {
    id: string;
    role: string;
}

export class AuthService {
    /**
     * Hashes a password using scrypt with a random salt.
     * Returns salt.hash string.
     */
    async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(16).toString("hex");
        const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

        // Store salt and hash, separated by a period
        return `${salt}.${derivedKey.toString("hex")}`;
    }

    /**
     * Compares a plain text password with a stored hash (format: salt.hash).
     */
    async comparePassword(supplied: string, stored: string): Promise<boolean> {
        const [salt, storedHash] = stored.split(".");
        if (!salt || !storedHash) return false;

        const storedHashBuf = Buffer.from(storedHash, "hex");
        const derivedKey = (await scrypt(supplied, salt, 64)) as Buffer;

        return timingSafeEqual(storedHashBuf, derivedKey);
    }

    /**
     * Generates a signed JWT token
     */
    generateToken(user: User): string {
        const payload: TokenPayload = {
            id: user.id,
            role: user.role,
        };

        // Set expiry to 24h
        return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
    }

    /**
     * Verifies a token and returns the payload or null
     */
    verifyToken(token: string): TokenPayload | null {
        try {
            // @ts-ignore - JWT types issue
            return jwt.verify(token, JWT_SECRET) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    getCookieName(): string {
        return COOKIE_NAME;
    }
}

export const authService = new AuthService();
