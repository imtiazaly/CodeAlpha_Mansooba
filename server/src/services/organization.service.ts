import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export class OrganizationService {
  // User ki tamam organizations fetch karo
  static async getMyOrganizations(userId: string) {
    const memberships = await prisma.userOrganizationMembership.findMany({
      where: { userId },
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
      membersCount: m.organization._count.users,
      projectsCount: m.organization._count.projects,
      joinedAt: m.joinedAt,
    }));
  }

  // Active organization switch karo
  static async switchOrganization(userId: string, organizationId: string) {
    // Check: user is org ka member hai?
    const membership = await prisma.userOrganizationMembership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You are not a member of this organization");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { organizationId },
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
