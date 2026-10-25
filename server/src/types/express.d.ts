import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role: Role;
        organizationId?: string | null;
        organization?: {
          id: string;
          name: string;
          slug: string;
        } | null;
      };
    }
  }
}

export {};