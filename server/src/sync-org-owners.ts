import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function syncOrgOwners() {
  console.log("🔄 Syncing organization owners & admin roles in database...");

  const organizations = await prisma.organization.findMany({
    include: {
      users: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  for (const org of organizations) {
    if (org.users.length === 0) continue;

    // Pehle se owner set hai ya pehla user (creator) owner banega
    const owner = org.users[0]; // Sabse pehla created user hi organization ka creator/owner hai

    // 1. Organization ka ownerId set karo
    await prisma.organization.update({
      where: { id: org.id },
      data: { ownerId: owner.id },
    });

    // 2. Owner ka User role ADMIN karo
    await prisma.user.update({
      where: { id: owner.id },
      data: { role: Role.ADMIN },
    });

    // 3. Owner ka Membership role bhi ADMIN karo
    await prisma.userOrganizationMembership.updateMany({
      where: {
        userId: owner.id,
        organizationId: org.id,
      },
      data: { role: Role.ADMIN },
    });

    console.log(
      `✅ Set "${owner.name}" (${owner.email}) as Owner of "${org.name}" with ADMIN role.`,
    );
  }

  console.log("\n🎉 Database sync completed successfully!");
  await prisma.$disconnect();
}

syncOrgOwners().catch((err) => {
  console.error("❌ Sync error:", err);
  prisma.$disconnect();
  process.exit(1);
});
