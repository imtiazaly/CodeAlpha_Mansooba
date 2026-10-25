import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillMemberships() {
  console.log("🔄 Backfilling organization memberships for existing users...");

  // Tamam users jinka organizationId set hai
  const users = await prisma.user.findMany({
    where: { organizationId: { not: null } },
    select: { id: true, name: true, email: true, organizationId: true },
  });

  console.log(`Found ${users.length} users with an organization.`);

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.organizationId) continue;

    // Check: membership pehle se hai?
    const existing = await prisma.userOrganizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: user.organizationId,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.userOrganizationMembership.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
      },
    });

    console.log(`  ✅ ${user.name} (${user.email})`);
    created++;
  }

  console.log(
    `\n🎉 Done! Created: ${created}, Skipped (already exists): ${skipped}`,
  );
  await prisma.$disconnect();
}

backfillMemberships().catch((e) => {
  console.error("❌ Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
