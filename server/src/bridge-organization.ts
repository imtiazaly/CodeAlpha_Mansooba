import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function bridge() {
  console.log("🏢 Initializing Default Workspace Bridge...");

  // 1. Create or Find Default Organization
  const org = await prisma.organization.upsert({
    where: { slug: "mansooba-default" },
    update: {},
    create: {
      name: "Mansooba Organization",
      slug: "mansooba-default",
    },
  });

  console.log(`✅ Organization ready: ${org.name} (${org.id})`);

  // 2. Link all existing users without an organization
  const updatedUsers = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(`✅ Linked ${updatedUsers.count} existing users to ${org.name}`);

  // 3. Link all existing projects without an organization
  const updatedProjects = await prisma.project.updateMany({
    where: { organizationId: null },
    data: { organizationId: org.id },
  });
  console.log(
    `✅ Linked ${updatedProjects.count} existing projects to ${org.name}`,
  );

  console.log("🎉 Bridge completed successfully! Zero data broken.");
}

bridge()
  .catch((e) => {
    console.error("❌ Error running bridge:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
