import { MembershipStatus, NotificationType, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { NotificationService } from "./notification.service.js";
import bcrypt from "bcryptjs";

export class UserService {
  // 1. Organization Members Directory (Sirf ACCEPTED members)
  static async getOrganizationMembers(currentUser: {
    id: string;
    role: Role;
    organizationId?: string | null;
  }) {
    const orgId = currentUser.organizationId;
    if (!orgId) return [];

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
          where: {
            ownerId: currentUser.id,
            isDeleted: false,
            organizationId: orgId,
          },
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

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    });

    const orgMemberships = await prisma.userOrganizationMembership.findMany({
      where: {
        organizationId: orgId,
        status: MembershipStatus.ACCEPTED,
        ...(allowedUserIds
          ? { userId: { in: Array.from(allowedUserIds) } }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                assignedTasks: {
                  where: {
                    isDeleted: false,
                    project: { organizationId: orgId },
                  },
                },
                projectMembers: {
                  where: {
                    project: { organizationId: orgId, isDeleted: false },
                  },
                },
              },
            },
            projectMembers: {
              where: { project: { organizationId: orgId, isDeleted: false } },
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
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return orgMemberships
      .filter((om) => om.user.isActive)
      .map((om) => {
        const u = om.user;
        const visibleProjects = u.projectMembers
          .filter((pm) => !pm.project.isDeleted)
          .filter((pm) => isAdmin || myProjectIds.has(pm.project.id))
          .map((pm) => ({
            id: pm.project.id,
            name: pm.project.name,
            role: pm.role,
          }));

        const isOwner = organization?.ownerId === u.id;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: isOwner ? Role.ADMIN : om.role,
          isOwner,
          createdAt: om.joinedAt.toISOString(),
          totalTasks: isAdmin ? u._count.assignedTasks : null,
          totalProjects: isAdmin ? u._count.projectMembers : null,
          projects: visibleProjects,
        };
      });
  }

  // 2. Update Member Role within Organization (Admin only)
  static async updateMemberRole(
    targetUserId: string,
    newRole: Role,
    adminUser: { id: string; role: Role; organizationId?: string | null },
  ) {
    if (adminUser.role !== Role.ADMIN) {
      throw new ApiError(403, "Only administrators can update member roles");
    }

    const orgId = adminUser.organizationId;
    if (!orgId) {
      throw new ApiError(400, "Admin does not have an active workspace");
    }

    if (targetUserId === adminUser.id) {
      throw new ApiError(400, "You cannot modify your own administrator role");
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    });

    if (org?.ownerId === targetUserId) {
      throw new ApiError(
        400,
        "The organization owner's role cannot be modified. The creator always remains Admin.",
      );
    }

    const membership = await prisma.userOrganizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACCEPTED) {
      throw new ApiError(404, "Active member not found in this organization");
    }

    await prisma.userOrganizationMembership.update({
      where: { id: membership.id },
      data: { role: newRole },
    });

    // Agar user is waqt isi workspace mein logged in hai to session role bhi update karo
    await prisma.user.updateMany({
      where: { id: targetUserId, organizationId: orgId },
      data: { role: newRole },
    });

    return { message: "Member role updated successfully", role: newRole };
  }

  // 3. Remove Member from Organization (Admin only — User account stays safe)
  static async removeOrganizationMember(
    targetUserId: string,
    adminUser: { id: string; role: Role; organizationId?: string | null },
  ) {
    if (adminUser.role !== Role.ADMIN) {
      throw new ApiError(
        403,
        "Only administrators can remove members from the workspace",
      );
    }

    const orgId = adminUser.organizationId;
    if (!orgId) {
      throw new ApiError(400, "Admin does not have an active workspace");
    }

    if (targetUserId === adminUser.id) {
      throw new ApiError(
        400,
        "You cannot remove yourself from your own organization",
      );
    }

    const membership = await prisma.userOrganizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId,
        },
      },
      include: {
        organization: { select: { name: true } },
      },
    });

    if (!membership) {
      throw new ApiError(404, "Member not found in this organization");
    }

    // Safe Workspace Removal Transaction:
    // 1. Delete organization membership
    // 2. Remove member from projects belonging to this organization
    // 3. If active workspace was this org, fallback to another workspace or null
    await prisma.$transaction(async (tx) => {
      await tx.userOrganizationMembership.delete({
        where: { id: membership.id },
      });

      const orgProjects = await tx.project.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });
      const projectIds = orgProjects.map((p) => p.id);

      if (projectIds.length > 0) {
        await tx.projectMember.deleteMany({
          where: {
            userId: targetUserId,
            projectId: { in: projectIds },
          },
        });
      }

      const otherMembership = await tx.userOrganizationMembership.findFirst({
        where: {
          userId: targetUserId,
          status: MembershipStatus.ACCEPTED,
        },
      });

      await tx.user.updateMany({
        where: { id: targetUserId, organizationId: orgId },
        data: {
          organizationId: otherMembership
            ? otherMembership.organizationId
            : null,
          role: otherMembership ? otherMembership.role : Role.USER,
        },
      });
    });

    // Notification bhejo
    await NotificationService.createNotification({
      userId: targetUserId,
      type: NotificationType.PROJECT_REMOVED,
      title: "Removed from Workspace",
      message: `You were removed from "${membership.organization.name}" workspace by an administrator.`,
    });

    return { message: "Member removed from organization successfully" };
  }

  // 4. Update Profile
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

  // 5. Change Password
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

  // 6. Update Organization Name
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

  // 7. Invite User
  static async inviteUser(
    data: { name: string; email: string; role?: Role; password?: string },
    adminUser: { id: string; role: Role },
  ) {
    if (adminUser.role !== Role.ADMIN) {
      throw new ApiError(403, "Only admins can invite members");
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminUser.id },
      select: {
        organizationId: true,
        organization: { select: { id: true, name: true } },
      },
    });

    if (!admin?.organizationId) {
      throw new ApiError(400, "Admin does not belong to any organization");
    }

    const targetEmail = data.email.trim();
    const assignedRole = data.role === Role.ADMIN ? Role.ADMIN : Role.USER;

    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: targetEmail, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (existingUser) {
      const existingMembership =
        await prisma.userOrganizationMembership.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: admin.organizationId,
            },
          },
        });

      if (existingMembership) {
        if (existingMembership.status === MembershipStatus.ACCEPTED) {
          throw new ApiError(
            409,
            `${existingUser.name} is already an active member of this workspace`,
          );
        }
        if (existingMembership.status === MembershipStatus.PENDING) {
          throw new ApiError(
            409,
            `An invitation is already pending for ${existingUser.name}`,
          );
        }
        await prisma.userOrganizationMembership.update({
          where: { id: existingMembership.id },
          data: {
            status: MembershipStatus.PENDING,
            role: assignedRole,
            joinedAt: new Date(),
          },
        });
      } else {
        await prisma.userOrganizationMembership.create({
          data: {
            userId: existingUser.id,
            organizationId: admin.organizationId,
            role: assignedRole,
            status: MembershipStatus.PENDING,
          },
        });
      }

      await NotificationService.createNotification({
        userId: existingUser.id,
        type: NotificationType.WORKSPACE_INVITATION,
        title: "Workspace Invitation",
        message: `You were invited to join "${admin.organization?.name}" as ${
          assignedRole === Role.ADMIN ? "Admin" : "Member"
        }`,
      });

      return {
        ...existingUser,
        role: assignedRole,
        _isExistingUser: true,
        _status: "PENDING",
      };
    }

    const defaultPassword = data.password || "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: targetEmail.toLowerCase(),
          password: hashedPassword,
          role: assignedRole,
          organizationId: admin.organizationId,
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

      await tx.userOrganizationMembership.create({
        data: {
          userId: newUser.id,
          organizationId: admin.organizationId!,
          role: assignedRole,
          status: MembershipStatus.ACCEPTED,
        },
      });

      return { ...newUser, _isExistingUser: false, _status: "ACCEPTED" };
    });
  }

  // 8. Search users
  static async searchUsers(
    query: string,
    currentUserId: string,
    limit: number,
  ) {
    const trimmed = query.trim();
    return prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { email: { contains: trimmed, mode: "insensitive" } },
          { name: { contains: trimmed, mode: "insensitive" } },
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

  // 9. Get user by ID
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
