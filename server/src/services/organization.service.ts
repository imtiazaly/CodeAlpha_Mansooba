import { MembershipStatus, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

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

  // 3. Invitation Accept ya Decline karo
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

    if (action === "ACCEPT") {
      await prisma.userOrganizationMembership.update({
        where: { id: membershipId },
        data: { status: MembershipStatus.ACCEPTED },
      });

      return {
        action: "ACCEPTED",
        message: `Accepted invitation to ${membership.organization.name}`,
        organization: membership.organization,
      };
    } else {
      await prisma.userOrganizationMembership.delete({
        where: { id: membershipId },
      });

      return {
        action: "DECLINED",
        message: `Declined invitation to ${membership.organization.name}`,
        organization: membership.organization,
      };
    }
  }

  // 4. Active organization switch karo (User ka session role bhi is org ke role se match hoga)
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

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId,
        role: membership.role,
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
}
