import { Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

export class UserService {
  // 1. Organization Members Directory (Strict Project Co-worker Boundary)
  static async getOrganizationMembers(currentUser: { id: string; role: Role }) {
    // Current user ka organizationId check karein
    const me = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { organizationId: true },
    });

    const whereOrg = me?.organizationId
      ? { organizationId: me.organizationId }
      : {};

    // ── Regular USER logic: Sirf shared projects ke members dhoondein ──
    let allowedUserIds: Set<string> | null = null;
    let myProjectIds = new Set<string>();

    if (currentUser.role !== Role.ADMIN) {
      // 1. Current user kin kin projects mein Owner ya Member hai
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

      // 2. Un projects ke tamam members aur owners ke IDs nikalein
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

      // Co-workers list (including self)
      allowedUserIds = new Set<string>([
        currentUser.id,
        ...coMembers.map((cm) => cm.userId),
        ...projectOwners.map((po) => po.ownerId),
      ]);
    }

    // ── Fetch Users ──
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...whereOrg,
        // Regular USER ko sirf allowed co-workers dikhein
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
      // Filter projects: Regular user ko sirf wahi projects dikhein jo shared hon
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
        totalProjects: visibleProjects.length,
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