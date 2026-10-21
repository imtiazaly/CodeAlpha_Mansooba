import { ProjectRole, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

export class ProjectService {
  static async createProject(
    data: { name: string; description?: string },
    user: CurrentUser,
  ) {
    // Project create karein aur user ko automatically OWNER banayein
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: user.id,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: ProjectRole.OWNER,
        },
      });

      return project;
    });
  }

  static async getProjects(user: CurrentUser) {
    if (user.role === Role.ADMIN) {
      return prisma.project.findMany({
        where: { isDeleted: false },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
    }

    // Regular user sirf apne projects dekh sake (Owner ya Member)
    return prisma.project.findMany({
      where: {
        isDeleted: false,
        members: { some: { userId: user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
  }

  static async getProjectById(id: string, user: CurrentUser) {
    const project = await prisma.project.findFirst({
      where: { id, isDeleted: false },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: { where: { isDeleted: false } },
      },
    });

    if (!project) throw new ApiError(404, "Project not found");

    const isMember = project.members.some((m) => m.userId === user.id);
    if (user.role !== Role.ADMIN && !isMember) {
      throw new ApiError(
        403,
        "Forbidden: You are not a member of this project",
      );
    }

    return project;
  }

  static async updateProject(
    id: string,
    data: { name?: string; description?: string | null },
    user: CurrentUser,
  ) {
    const project = await this.getProjectById(id, user);

    const member = project.members.find((m) => m.userId === user.id);
    const canEdit =
      user.role === Role.ADMIN ||
      member?.role === ProjectRole.OWNER ||
      member?.role === ProjectRole.ADMIN;

    if (!canEdit)
      throw new ApiError(
        403,
        "Forbidden: Only Project Owners and Admins can update project details",
      );

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  static async deleteProject(id: string, user: CurrentUser) {
    const project = await this.getProjectById(id, user);

    if (user.role !== Role.ADMIN && project.ownerId !== user.id) {
      throw new ApiError(
        403,
        "Forbidden: Only the project owner can delete this project",
      );
    }

    await prisma.project.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { id, message: "Project deleted successfully" };
  }

  static async addMember(
    projectId: string,
    targetUserId: string,
    role: ProjectRole,
    user: CurrentUser,
  ) {
    const project = await this.getProjectById(projectId, user);

    const member = project.members.find((m) => m.userId === user.id);
    const canManage =
      user.role === Role.ADMIN ||
      member?.role === ProjectRole.OWNER ||
      member?.role === ProjectRole.ADMIN;

    if (!canManage)
      throw new ApiError(
        403,
        "Forbidden: Insufficient permissions to add members",
      );

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new ApiError(404, "User to add was not found");

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    if (existingMember)
      throw new ApiError(409, "User is already a member of this project");

    return prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  static async removeMember(
    projectId: string,
    targetUserId: string,
    user: CurrentUser,
  ) {
    const project = await this.getProjectById(projectId, user);

    if (targetUserId === project.ownerId) {
      throw new ApiError(400, "Project owner cannot be removed from members");
    }

    const member = project.members.find((m) => m.userId === user.id);
    const canManage =
      user.role === Role.ADMIN ||
      member?.role === ProjectRole.OWNER ||
      member?.role === ProjectRole.ADMIN ||
      user.id === targetUserId;

    if (!canManage)
      throw new ApiError(403, "Forbidden: Cannot remove this member");

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    return { message: "Member successfully removed" };
  }
}
