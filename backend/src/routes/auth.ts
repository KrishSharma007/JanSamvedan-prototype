import { Router } from "express";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signJwt } from "../utils/jwt";
import { authMiddleware } from "../middleware/auth";

const prisma = new PrismaClient();
export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address, role, organization, serviceArea } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Determine user role
    const userRole = role === "NGO" ? UserRole.NGO : UserRole.CITIZEN;
    
    // Create user with appropriate role and role-specific fields
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        address,
        role: userRole,
        // Role-specific fields
        organization: userRole === UserRole.NGO ? organization : null,
        serviceArea: userRole === UserRole.NGO ? serviceArea : null,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = signJwt({ sub: user.id, role: user.role });
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    // Check User table for all roles
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // For ADMIN users, compare the password as plaintext to allow
    // direct admin creation in the database without hashing.
    // For all other users, fall back to bcrypt comparison.
    const isAdmin = user.role === UserRole.ADMIN;
    const valid = isAdmin
      ? password === user.passwordHash
      : await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ sub: user.id, role: user.role });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "Unauthorized" });
    const token = authHeader.substring("Bearer ".length);
    // We could verify, but the middleware can be added on server.ts for all /me
    // Kept here simple: decode via verify in middleware if applied there
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users (Admin only)
authRouter.get("/users", authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
    });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            complaints: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(users);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Stateless logout endpoint for client convenience
authRouter.post("/logout", async (_req, res) => {
  try {
    // JWT is stateless; client should delete token. Provide a consistent response.
    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});
