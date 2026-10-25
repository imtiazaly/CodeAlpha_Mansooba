import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Helper: organization name se clean slug banao
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
};

export class AuthService {
  static async register(input: RegisterInput) {
    // 1. Email already exists check
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 2. Unique slug generate karo (collision handle)
    let slug = generateSlug(input.organizationName);
    const existingSlug = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      // Collision hone par random suffix lagao
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // 3. Transaction: Organization + User ek sath banao
    const result = await prisma.$transaction(async (tx) => {
      // Organization create karo
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName.trim(),
          slug,
        },
      });

      // User create karo — ADMIN role (workspace owner)
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: Role.ADMIN, // Naye workspace ka creator hamesha ADMIN
          organizationId: organization.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return { user, organization };
    });

    const token = this.generateToken(
      result.user.id,
      result.user.email,
      result.user.role,
    );

    return { user: result.user, token };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  private static generateToken(id: string, email: string, role: Role): string {
    return jwt.sign({ id, email, role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }
}