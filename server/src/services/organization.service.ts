import { MembershipStatus, NotificationType, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { NotificationService } from "./notification.service.js";

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
};

export class OrganizationService {
  // 1. User ki active (ACCEPTED) organizations fetch karo
  static async getMyOrganizations(userId: string) {
    const memberships = await prisma.userOrganizationMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.ACCEPTED,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            _count: {
              select: { users: true, projects: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      membersCount: m.organization._count.users,
      projectsCount: m.organization._count.projects,
      joinedAt: m.joinedAt,
    }));
  }

  // 2. User ki Pending Invitations fetch karo
  static async getPendingInvitations(userId: string) {
    const invitations = await prisma.userOrganizationMembership.findMany({
      where: {
        userId,
        status: MembershipStatus.PENDING,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      organizationId: inv.organization.id,
      organizationName: inv.organization.name,
      organizationSlug: inv.organization.slug,
      role: inv.role,
      invitedAt: inv.joinedAt,
    }));
  }

  // 3. Invitation Accept ya Decline karo (With Live Notification to Admins)
  static async respondToInvitation(
    userId: string,
    membershipId: string,
    action: "ACCEPT" | "DECLINE",
  ) {
    const membership = await prisma.userOrganizationMembership.findFirst({
      where: {
        id: membershipId,
        userId,
        status: MembershipStatus.PENDING,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!membership) {
      throw new ApiError(404, "Pending invitation not found");
    }

    // Responding user ki details
    const respondingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const userName =
      respondingUser?.name || respondingUser?.email || "A member";

    // Workspace ke active Admins nikalo jinhe notify karna hai
    const orgAdmins = await prisma.userOrganizationMembership.findMany({
      where: {
        organizationId: membership.organizationId,
        role: Role.ADMIN,
        status: MembershipStatus.ACCEPTED,
        userId: { not: userId },
      },
      select: { userId: true },
    });

    if (action === "ACCEPT") {
      await prisma.userOrganizationMembership.update({
        where: { id: membershipId },
        data: { status: MembershipStatus.ACCEPTED },
      });

      // Tamam workspace Admins ko instant live notification deliver karo
      for (const admin of orgAdmins) {
        await NotificationService.createNotification({
          userId: admin.userId,
          type: NotificationType.WORKSPACE_INVITATION,
          title: "Invitation Accepted",
          message: `${userName} accepted your invitation and joined "${membership.organization.name}".`,
        });
      }

      return {
        action: "ACCEPTED",
        message: `Accepted invitation to ${membership.organization.name}`,
        organization: membership.organization,
      };
    } else {
      await prisma.userOrganizationMembership.delete({
        where: { id: membershipId },
      });

      // Tamam workspace Admins ko instant decline notification bhejo
      for (const admin of orgAdmins) {
        await NotificationService.createNotification({
          userId: admin.userId,
          type: NotificationType.WORKSPACE_INVITATION,
          title: "Invitation Declined",
          message: `${userName} declined the invitation to join "${membership.organization.name}".`,
        });
      }

      return {
        action: "DECLINED",
        message: `Declined invitation to ${membership.organization.name}`,
        organization: membership.organization,
      };
    }
  }

  // 4. Active organization switch karo
  static async switchOrganization(userId: string, organizationId: string) {
    const membership = await prisma.userOrganizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership || membership.status !== MembershipStatus.ACCEPTED) {
      throw new ApiError(
        403,
        "You do not have active access to this organization",
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    const isOwner = org?.ownerId === userId;
    const finalRole = isOwner ? Role.ADMIN : membership.role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId,
        role: finalRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
        createdAt: true,
      },
    });

    return updatedUser;
  }

  // 5. Nayi organization create karo (Existing logged-in user ke liye)
  static async createOrganization(userId: string, organizationName: string) {
    const trimmed = organizationName?.trim();
    if (!trimmed || trimmed.length < 2) {
      throw new ApiError(
        400,
        "Organization name must be at least 2 characters",
      );
    }

    let slug = generateSlug(trimmed);
    const existingSlug = await prisma.organization.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Organization banao jiska owner ye user hai
      const organization = await tx.organization.create({
        data: {
          name: trimmed,
          slug,
          ownerId: userId,
        },
      });

      // 2. User ki membership ADMIN ke sath create karo
      await tx.userOrganizationMembership.create({
        data: {
          userId,
          organizationId: organization.id,
          role: Role.ADMIN,
          status: MembershipStatus.ACCEPTED,
        },
      });

      // 3. User ka active workspace aur role update karo
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: organization.id,
          role: Role.ADMIN,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          organization: {
            select: { id: true, name: true, slug: true },
          },
          createdAt: true,
        },
      });

      return { organization, user: updatedUser };
    });

    return result;
  }
}
