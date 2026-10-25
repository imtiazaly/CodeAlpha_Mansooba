import "dotenv/config";
import { PrismaClient, Role, ProjectRole, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Helper to pick random item
const sample = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper for random integer between min and max (inclusive)
const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Realistic Mock Users
const MOCK_USERS_DATA = [
  { name: "Ali Khan", email: "ali.khan@mansooba.com" },
  { name: "Sara Ahmed", email: "sara.ahmed@mansooba.com" },
  { name: "Hamza Tariq", email: "hamza.tariq@mansooba.com" },
  { name: "Zainab Fatima", email: "zainab.fatima@mansooba.com" },
  { name: "Bilal Hussain", email: "bilal.hussain@mansooba.com" },
  { name: "Ayesha Malik", email: "ayesha.malik@mansooba.com" },
  { name: "Usman Farooq", email: "usman.farooq@mansooba.com" },
  { name: "Hira Siddiqui", email: "hira.siddiqui@mansooba.com" },
  { name: "Omer Sheikh", email: "omer.sheikh@mansooba.com" },
  { name: "Fatima Noor", email: "fatima.noor@mansooba.com" },
];

const COMMON_PASSWORD = "Password123!";

// 30 Realistic Project Names & Descriptions
const PROJECT_TEMPLATES = [
  { name: "E-Commerce Mobile App", desc: "Cross-platform mobile storefront with shopping cart & payment checkout." },
  { name: "Healthcare Patient Portal", desc: "Telehealth scheduling, medical records, and doctor consultations." },
  { name: "Cloud Infrastructure Migration", desc: "Migrating on-premise microservices to AWS with Terraform & Kubernetes." },
  { name: "CRM Analytics Dashboard", desc: "Real-time sales velocity metrics, pipeline tracking, and revenue forecast." },
  { name: "AI Customer Chatbot", desc: "LLM-powered contextual support agent integrated with knowledge base." },
  { name: "Payment Gateway Integration", desc: "Stripe, PayPal, and localized payment provider integration." },
  { name: "Inventory Management System", desc: "Warehouse stock auditing, SKU tracking, and automated reorder triggers." },
  { name: "HR Onboarding & Payroll", desc: "Employee lifecycle management, attendance tracking, and salary slips." },
  { name: "FinTech Crypto Wallet", desc: "Multi-currency decentralized wallet with biometric security." },
  { name: "Logistics & Fleet Tracker", desc: "Live GPS fleet tracking, delivery routing optimization, and fuel reports." },
  { name: "Real Estate Listing Engine", desc: "Property search filters, interactive map view, and virtual tours." },
  { name: "Social Media Scheduler", desc: "Automated content calendar, post publishing, and engagement analytics." },
  { name: "Learning Management System (LMS)", desc: "Interactive video courses, student progress tracking, and certificates." },
  { name: "Cybersecurity Compliance Audit", desc: "SOC2 Type II compliance checks, penetration test reports, and remediation." },
  { name: "IoT Smart Home Controller", desc: "Sensor telemetry, home automation rules, and mobile push notifications." },
  { name: "Customer Support Helpdesk", desc: "Ticketing system with SLA management and customer satisfaction metrics." },
  { name: "Automated Invoice Billing", desc: "Recurring SaaS billing, tax calculation, and PDF invoice generation." },
  { name: "Food Delivery Aggregator", desc: "Customer ordering, rider dispatching, and restaurant vendor dashboard." },
  { name: "Video Streaming Platform", desc: "HLS adaptive bitrate video playback, encoding pipelines, and DRM." },
  { name: "SEO Performance Monitor", desc: "SERP ranking tracker, page speed insights, and backlink analysis." },
  { name: "Warehouse Automation Suite", desc: "Barcode scanning, shelf dispatch validation, and robotic sorting." },
  { name: "Travel Booking Aggregator", desc: "Flight and hotel inventory booking engine with multi-currency checkout." },
  { name: "Enterprise Data Warehouse", desc: "Snowflake ETL pipeline, data transformations, and BI report models." },
  { name: "Corporate Intranet Redesign", desc: "Internal team wiki, knowledge sharing, and announcements portal." },
  { name: "Subscription Management API", desc: "Metered usage billing, tier downgrades, and dunning management." },
  { name: "Telemedicine Consultation", desc: "WebRTC peer-to-peer video calls and electronic prescription dispatch." },
  { name: "Smart City Traffic Analytics", desc: "Computer vision vehicle counts, traffic light phasing, and congestion alerts." },
  { name: "Fitness & Nutrition Tracker", desc: "Macro nutrient tracking, workout regimens, and Apple Health sync." },
  { name: "Event & Conference Ticketing", desc: "Seat reservation, QR badge scanning, and attendee networking." },
  { name: "Enterprise Single Sign-On (SSO)", desc: "SAML 2.0 and OIDC identity federation with Google Workspace & Okta." },
];

// Diverse Task Action Prefixes & Subjects
const TASK_ACTIONS = [
  "Implement", "Design", "Refactor", "Optimize", "Fix bug in", "Write unit tests for",
  "Configure", "Deploy", "Audit security of", "Update UI for", "Add validation for",
  "Setup CI/CD pipeline for", "Integrate third-party API for", "Benchmark performance of",
  "Document architecture for", "Review PR and merge", "Create database schema for",
  "Investigate memory leak in", "Add automated alerts for", "Conduct user testing on"
];

const TASK_SUBJECTS = [
  "authentication JWT token refresh", "user profile picture upload", "database index performance",
  "Kanban board drag-and-drop", "Redis caching layer", "email notification templates",
  "Stripe checkout webhook handler", "dark mode CSS variable overrides", "GraphQL query batching",
  "REST API rate limiting middleware", "PostgreSQL connection pool", "WebSocket connection heartbeat",
  "password reset OTP flow", "CSV export background worker", "Docker production container",
  "React Query caching strategy", "audit trail logging system", "search indexing pipeline",
  "mobile responsive sidebar", "role-based access control guards", "session timeout modal",
  "file compression utility", "health check monitoring endpoint", "customer onboarding walkthrough",
  "payment refund processing", "S3 asset upload pre-signed URL", "error boundary fallback UI",
  "real-time activity feed", "user account deletion cascade", "Google OAuth SSO callback"
];

const COMMENT_SNIPPETS = [
  "I have started working on this task.",
  "Draft PR is open for review. Please take a look when free.",
  "Blocked by the backend API schema update. Waiting for merge.",
  "Unit tests are passing with 95% coverage.",
  "Can someone verify this behavior on mobile screens?",
  "Found an edge case with null values, adding an extra check.",
  "Updated the UI styles to match the latest design system Figma.",
  "Verified in the staging environment. Ready for QA testing.",
  "Performance improved by ~40% after adding database indexes.",
  "Looking good! Clean code and nicely formatted.",
  "LGTM! Merged to main.",
  "Added additional documentation in the repo wiki.",
  "Please recheck the error boundary handling here.",
  "All acceptance criteria met. Moving status forward.",
  "Waiting for client feedback on this copy."
];

async function seed() {
  console.log("🌱 Starting Mock Data Seeding...");
  const startTime = Date.now();

  // 1. Hash password once for all users
  const hashedPassword = await bcrypt.hash(COMMON_PASSWORD, 10);

  // 2. Create / Upsert 10 Users
  console.log("Creating 10 Users...");
  const users = [];
  for (const u of MOCK_USERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, isActive: true },
      create: {
        id: crypto.randomUUID(),
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: Role.USER,
        isActive: true,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created/verified ${users.length} users.`);

  // 3. Create 30 Projects with Members
  console.log("Creating 30 Projects and assigning members...");
  const projects = [];
  const projectMembersBatch = [];

  for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
    const template = PROJECT_TEMPLATES[i];
    const owner = users[i % users.length];
    const projectId = crypto.randomUUID();

    projects.push({
      id: projectId,
      name: template.name,
      description: template.desc,
      ownerId: owner.id,
      isDeleted: false,
    });

    // Pick 3 to 6 distinct members from the users pool (excluding owner)
    const otherUsers = users.filter((u) => u.id !== owner.id);
    const memberCount = randomInt(3, 6);
    const shuffled = [...otherUsers].sort(() => 0.5 - Math.random());
    const selectedMembers = shuffled.slice(0, memberCount);

    for (const member of selectedMembers) {
      const role = sample([ProjectRole.MEMBER, ProjectRole.ADMIN, ProjectRole.VIEWER]);
      projectMembersBatch.push({
        id: crypto.randomUUID(),
        projectId,
        userId: member.id,
        role,
      });
    }
  }

  // Insert Projects
  await prisma.project.createMany({
    data: projects,
    skipDuplicates: true,
  });

  // Insert Project Members
  await prisma.projectMember.createMany({
    data: projectMembersBatch,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${projects.length} projects with ${projectMembersBatch.length} member assignments.`);

  // 4. Create 50 Tasks per Project (Total = 30 * 50 = 1500 tasks)
  console.log("Generating 1,500 Tasks across 30 Projects (50 per project)...");
  const tasksBatch = [];
  const taskIds: { id: string; projectId: string; possibleUserIds: string[] }[] = [];

  const statuses: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.DONE,
    TaskStatus.CANCELLED,
  ];
  const priorities: Priority[] = [
    Priority.LOW,
    Priority.MEDIUM,
    Priority.HIGH,
    Priority.URGENT,
  ];

  for (const project of projects) {
    // Project's member user IDs + owner
    const pMembers = projectMembersBatch
      .filter((m) => m.projectId === project.id)
      .map((m) => m.userId);
    const projectUserIds = [project.ownerId, ...pMembers];

    for (let t = 1; t <= 50; t++) {
      const taskId = crypto.randomUUID();
      const action = sample(TASK_ACTIONS);
      const subject = sample(TASK_SUBJECTS);
      const title = `${action} ${subject} (${project.name.split(" ")[0]} #${t})`;
      const status = sample(statuses);
      const priority = sample(priorities);
      const order = t * 1000;

      // Assignee (85% chance of being assigned to someone, 15% unassigned)
      const isAssigned = Math.random() > 0.15;
      const assigneeId = isAssigned ? sample(projectUserIds) : null;
      const creatorId = sample(projectUserIds);

      // Random due date within +/- 20 days
      const daysOffset = randomInt(-10, 20);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysOffset);

      tasksBatch.push({
        id: taskId,
        title,
        description: `Automated requirement specification for ${title}. Ensure unit test suites pass, proper error logging is configured, and responsive mobile view is verified.`,
        status,
        priority,
        order,
        dueDate,
        projectId: project.id,
        creatorId,
        assigneeId,
        isDeleted: false,
      });

      taskIds.push({ id: taskId, projectId: project.id, possibleUserIds: projectUserIds });
    }
  }

  // Insert Tasks in batches of 500 for efficiency
  for (let i = 0; i < tasksBatch.length; i += 500) {
    const chunk = tasksBatch.slice(i, i + 500);
    await prisma.task.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  console.log(`✅ Created ${tasksBatch.length} tasks.`);

  // 5. Generate Comments (random number between 0 and 30 per task)
  console.log("Generating comments for tasks (0 to 30 comments per task)...");
  const commentsBatch = [];

  for (const task of taskIds) {
    const commentCount = randomInt(0, 30); // Random between 0 and 30
    for (let c = 0; c < commentCount; c++) {
      const userId = sample(task.possibleUserIds);
      const commentContent = sample(COMMENT_SNIPPETS);
      commentsBatch.push({
        id: crypto.randomUUID(),
        content: commentContent,
        taskId: task.id,
        userId,
      });
    }
  }

  console.log(`Generated ${commentsBatch.length} total comments. Inserting into database...`);

  // Insert Comments in chunks of 2,000 for high performance
  for (let i = 0; i < commentsBatch.length; i += 2000) {
    const chunk = commentsBatch.slice(i, i + 2000);
    await prisma.comment.createMany({
      data: chunk,
      skipDuplicates: true,
    });
  }
  console.log(`✅ Inserted all ${commentsBatch.length} comments.`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n========================================");
  console.log(`🎉 MOCK DATA SEEDING COMPLETE in ${duration}s!`);
  console.log(`👥 Users: ${users.length} (Password for all: ${COMMON_PASSWORD})`);
  console.log(`📁 Projects: ${projects.length}`);
  console.log(`📌 Tasks: ${tasksBatch.length} (50 per project)`);
  console.log(`💬 Comments: ${commentsBatch.length} (0-30 per task)`);
  console.log("========================================\n");
}

seed()
  .catch((err) => {
    console.error("❌ Error while seeding mock data:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
