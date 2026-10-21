import { ProjectRole, Role } from "@prisma/client";
import { prisma } from "../config/db.js";
import { ApiError } from "./ApiError.js";

interface CurrentUser {
  id: string;
  email: string;
  role: Role;
}

// Role hierarchy rank define karein
const ROLE_WEIGHT: Record<ProjectRole, number> = {
  [ProjectRole.VIEWER]: 1,
  [ProjectRole.MEMBER]: 2,
  [ProjectRole.ADMIN]: 3,
  [ProjectRole.OWNER]: 4,
};

/**
 * Project membership aur role permissions verify karta hai.
 * @param projectId - Target project id
 * @param user - Current authenticated user
 * @param minRole - Kam az kam zaroori role (default: VIEWER yani koi bhi member)
 */
export async function assertProjectAccess(
  projectId: string,
  user: CurrentUser,
  minRole: ProjectRole = ProjectRole.VIEWER,
) {
  // 1. Project find karein (sirf non-deleted)
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // 2. Agar user System ADMIN hai to use poora access hai
  if (user.role === Role.ADMIN) {
    return { project, role: ProjectRole.OWNER };
  }

  // 3. User ki project membership check karein
  const membership = project.members[0];
  if (!membership) {
    throw new ApiError(403, "Forbidden: You are not a member of this project");
  }

  // 4. Role Hierarchy check karein
  if (ROLE_WEIGHT[membership.role] < ROLE_WEIGHT[minRole]) {
    throw new ApiError(
      403,
      `Forbidden: Insufficient permissions. Requires at least ${minRole} role`,
    );
  }

  return { project, role: membership.role };
}
