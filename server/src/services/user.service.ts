import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export class UserService {
  // Email ya Name se users search karein (team member add ya assign karne ke liye)
  static async searchUsers(
    query: string,
    currentUserId: string,
    limit: number,
  ) {
    return prisma.user.findMany({
      where: {
        isActive: true,
        id: { not: currentUserId }, // Khud ko search result se exclude karein
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
