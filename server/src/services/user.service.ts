import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

export class UserService {
  // 1. Organization Members Directory (Tareeqa A: Shared/Protected Projects)
  static async getOrganizationMembers(currentUser: { id: string; role: Role }) {
    // Current user ka organizationId check karein
    const me = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { organizationId: true },
    });

    const whereOrg = me?.organizationId
      ? { organizationId: me.organizationId }
      : {};

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...whereOrg,
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

    // Tareeqa A Privacy: Regular USER ko sirf wahi projects show hon jisme woh khud bhi member hai
    let myProjectIds = new Set<string>();
    if (currentUser.role !== Role.ADMIN) {
      const myMemberships = await prisma.projectMember.findMany({
        where: { userId: currentUser.id },
        select: { projectId: true },
      });
      myProjectIds = new Set(myMemberships.map((m) => m.projectId));
    }

    return users.map((u) => {
      // Filter projects based on privacy
      const visibleProjects = u.projectMembers
        .filter((pm) => !pm.project.isDeleted)
        .filter(
          (pm) =>
            currentUser.role === Role.ADMIN || myProjectIds.has(pm.project.id),
        )
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
        totalTasks: u._count.assignedTasks,
        totalProjects: u._count.projectMembers,
        projects: visibleProjects,
      };
    });
  }

  // 2. Invite / Add Member (Only for Admin)
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

    return prisma.user.create({
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
  }

  // 3. Search users (existing function)
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
