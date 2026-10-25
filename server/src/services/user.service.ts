import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

export class UserService {
  // 1. Organization Members Directory (Strict Privacy & Permission Scoping)
  static async getOrganizationMembers(currentUser: { id: string; role: Role }) {
    const me = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { organizationId: true },
    });

    const whereOrg = me?.organizationId
      ? { organizationId: me.organizationId }
      : {};

    const isAdmin = currentUser.role === Role.ADMIN;
    let allowedUserIds: Set<string> | null = null;
    let myProjectIds = new Set<string>();

    if (!isAdmin) {
      const [memberships, ownedProjects] = await Promise.all([
        prisma.projectMember.findMany({
          where: { userId: currentUser.id },
          select: { projectId: true },
        }),
        prisma.project.findMany({
          where: { ownerId: currentUser.id, isDeleted: false },
          select: { id: true },
        }),
      ]);

      myProjectIds = new Set([
        ...memberships.map((m) => m.projectId),
        ...ownedProjects.map((p) => p.id),
      ]);

      const [coMembers, projectOwners] = await Promise.all([
        prisma.projectMember.findMany({
          where: { projectId: { in: Array.from(myProjectIds) } },
          select: { userId: true },
        }),
        prisma.project.findMany({
          where: { id: { in: Array.from(myProjectIds) } },
          select: { ownerId: true },
        }),
      ]);

      allowedUserIds = new Set<string>([
        currentUser.id,
        ...coMembers.map((cm) => cm.userId),
        ...projectOwners.map((po) => po.ownerId),
      ]);
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...whereOrg,
        ...(allowedUserIds ? { id: { in: Array.from(allowedUserIds) } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: { where: { isDeleted: false } },
            projectMembers: true,
          },
        },
        projectMembers: {
          select: {
            role: true,
            project: {
              select: {
                id: true,
                name: true,
                isDeleted: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return users.map((u) => {
      const visibleProjects = u.projectMembers
        .filter((pm) => !pm.project.isDeleted)
        .filter((pm) => isAdmin || myProjectIds.has(pm.project.id))
        .map((pm) => ({
          id: pm.project.id,
          name: pm.project.name,
          role: pm.role,
        }));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        totalTasks: isAdmin ? u._count.assignedTasks : null,
        totalProjects: isAdmin ? u._count.projectMembers : null,
        projects: visibleProjects,
      };
    });
  }

  // 2. Update Profile (Name only)
  static async updateProfile(userId: string, data: { name: string }) {
    if (!data.name || data.name.trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters");
    }

    return prisma.user.update({
      where: { id: userId },
      data: { name: data.name.trim() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  // 3. Change Password (Current password verify karke)
  static async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ) {
    if (!data.newPassword || data.newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) throw new ApiError(404, "User not found");

    const isValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Same password check
    const isSame = await bcrypt.compare(data.newPassword, user.password);
    if (isSame) {
      throw new ApiError(
        400,
        "New password cannot be same as current password",
      );
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: "Password changed successfully" };
  }

  // 4. Update Organization Name (Admin only)
  static async updateOrganization(
    userId: string,
    userRole: Role,
    data: { name: string },
  ) {
    if (userRole !== Role.ADMIN) {
      throw new ApiError(
        403,
        "Only administrators can update organization details",
      );
    }

    if (!data.name || data.name.trim().length < 2) {
      throw new ApiError(
        400,
        "Organization name must be at least 2 characters",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new ApiError(404, "No organization found for this account");
    }

    return prisma.organization.update({
      where: { id: user.organizationId },
      data: { name: data.name.trim() },
      select: { id: true, name: true, slug: true },
    });
  }

  // 5. Invite / Add Member (Only for Admin)
  static async inviteUser(
    data: { name: string; email: string; role?: Role; password?: string },
    adminUser: { id: string; role: Role },
  ) {
    if (adminUser.role !== Role.ADMIN) {
      throw new ApiError(403, "Only admins can add new members");
    }

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ApiError(400, "User with this email already exists");
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminUser.id },
      select: { organizationId: true },
    });

    const defaultPassword = data.password || "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Transaction: User + Membership ek sath banao
    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role || Role.USER,
          organizationId: admin?.organizationId || null,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Membership bhi create karo
      if (admin?.organizationId) {
        await tx.userOrganizationMembership.create({
          data: {
            userId: newUser.id,
            organizationId: admin.organizationId,
          },
        });
      }

      return newUser;
    });
  }
  // 6. Search users
  static async searchUsers(
    query: string,
    currentUserId: string,
    limit: number,
  ) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: currentUserId },
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  // 7. Get user by ID
  static async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new ApiError(404, "User not found");
    return user;
  }
}