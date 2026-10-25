import { ProjectRole, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { emitToProject } from "../config/socket.js";
import { NotificationService } from "./notification.service.js";
import { NotificationType } from "@prisma/client";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  organizationId?: string | null;
}

export class ProjectService {
  static async createProject(
    data: { name: string; description?: string },
    user: CurrentUser,
  ) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: user.id,
          organizationId: user.organizationId || undefined,
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
    const orgFilter = user.organizationId
      ? { organizationId: user.organizationId }
      : {};

    if (user.role === Role.ADMIN) {
      return prisma.project.findMany({
        where: {
          isDeleted: false,
          ...orgFilter,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: {
            select: {
              members: true,
              tasks: { where: { isDeleted: false } },
            },
          },
        },
      });
    }

    // Regular user: sirf apni org ke projects + member hona zaroori
    return prisma.project.findMany({
      where: {
        isDeleted: false,
        ...orgFilter, // ← Org isolation for USER
        members: { some: { userId: user.id } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            members: true,
            tasks: { where: { isDeleted: false } },
          },
        },
      },
    });
  }

  static async getProjectById(id: string, user: CurrentUser) {
    const project = await prisma.project.findFirst({
      where: {
        id,
        isDeleted: false,
        ...(user.organizationId && { organizationId: user.organizationId }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
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
    if (role === ProjectRole.OWNER) {
      throw new ApiError(
        400,
        "Project owner role cannot be assigned to members",
      );
    }

    const project = await this.getProjectById(projectId, user);

    const member = project.members.find((m) => m.userId === user.id);
    const isSystemAdmin = user.role === Role.ADMIN;
    const isProjectOwner =
      member?.role === ProjectRole.OWNER || project.ownerId === user.id;
    const isProjectAdmin = member?.role === ProjectRole.ADMIN;

    const canManage = isSystemAdmin || isProjectOwner || isProjectAdmin;

    if (!canManage) {
      throw new ApiError(
        403,
        "Forbidden: Insufficient permissions to add members",
      );
    }

    if (role === ProjectRole.ADMIN && !isSystemAdmin && !isProjectOwner) {
      throw new ApiError(
        403,
        "Forbidden: Only the project owner can grant ADMIN privileges",
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new ApiError(404, "User to add was not found");

    const existingMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: targetUserId } },
    });

    if (existingMember) {
      throw new ApiError(409, "User is already a member of this project");
    }

    const newMember = await prisma.projectMember.create({
      data: { projectId, userId: targetUserId, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    emitToProject(projectId, "member:added", newMember);

    // CASE 1: Notification on Add to Project
    if (targetUserId !== user.id) {
      await NotificationService.createNotification({
        userId: targetUserId,
        type: NotificationType.PROJECT_INVITATION,
        title: "Added to Project",
        message: `You were added to project "${project.name}" as ${role}`,
        projectId: project.id,
      });
    }

    return newMember;
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

    emitToProject(projectId, "member:removed", {
      projectId,
      userId: targetUserId,
    });

    // CASE 2: Notification on Remove from Project
    if (targetUserId !== user.id) {
      await NotificationService.createNotification({
        userId: targetUserId,
        type: NotificationType.PROJECT_REMOVED,
        title: "Removed from Project",
        message: `You were removed from project "${project.name}"`,
        projectId: project.id,
      });
    }

    return { message: "Member successfully removed" };
  }
}