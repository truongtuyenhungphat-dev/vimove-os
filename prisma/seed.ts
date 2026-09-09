/**
 * Seed data cho môi trường dev/demo — KHÔNG chạy tự động trong production build
 * (§34 quy tắc 5: "Seed data tách khỏi production path"). Chạy thủ công:
 *   npx prisma db seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERMISSIONS } from "../lib/permissions/catalog";
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_PERMISSION_SCOPES, ROLE_LABELS } from "../lib/permissions/role-defaults";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLE_KEYS = Object.keys(ROLE_LABELS);

async function main() {
  console.log("Seeding VIMOVE OS...");

  const organization = await prisma.organization.upsert({
    where: { slug: "vimove" },
    update: {},
    create: { name: "VIMOVE", slug: "vimove" },
  });
  console.log(`Organization: ${organization.name} (${organization.id})`);

  // 1. Permission catalog (danh mục toàn cục)
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { resource: p.resource, action: p.action, description: p.description },
      create: p,
    });
  }
  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));
  console.log(`Permissions: ${allPermissions.length}`);

  // 2. Roles theo RoleKey enum + gán permission mặc định
  for (const key of ROLE_KEYS) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: organization.id, key: key as never } },
      update: {},
      create: {
        organizationId: organization.id,
        key: key as never,
        name: ROLE_LABELS[key],
        isSystem: true,
      },
    });

    const defaultKeys = DEFAULT_ROLE_PERMISSIONS[key] ?? [];
    const scopeOverrides = DEFAULT_PERMISSION_SCOPES[key] ?? {};
    for (const permKey of defaultKeys) {
      const permission = permissionByKey.get(permKey);
      if (!permission) continue;
      // Phase 10: scope mặc định lấy từ DEFAULT_PERMISSION_SCOPES nếu có override, ALL
      // nếu không — set cả `update` để re-seed áp đúng scope cho role đã tồn tại từ
      // trước Phase 10 (không chỉ khi tạo mới), khớp đúng quyết định seed idempotent.
      const scope = scopeOverrides[permKey] ?? "ALL";
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: { scope },
        create: { roleId: role.id, permissionId: permission.id, scope },
      });
    }
  }
  console.log(`Roles: ${ROLE_KEYS.length}`);

  // 3. Phòng ban mẫu
  const executiveBoard = await prisma.department.upsert({
    where: { id: "seed-dept-executive" },
    update: {},
    create: { id: "seed-dept-executive", organizationId: organization.id, name: "Ban Giám đốc" },
  });
  await prisma.department.upsert({
    where: { id: "seed-dept-marketing" },
    update: {},
    create: { id: "seed-dept-marketing", organizationId: organization.id, name: "Phòng Marketing" },
  });
  await prisma.department.upsert({
    where: { id: "seed-dept-sales" },
    update: {},
    create: { id: "seed-dept-sales", organizationId: organization.id, name: "Phòng Kinh doanh" },
  });
  await prisma.department.upsert({
    where: { id: "seed-dept-ops" },
    update: {},
    create: { id: "seed-dept-ops", organizationId: organization.id, name: "Phòng Vận hành" },
  });

  // 4. Super Admin user mặc định
  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { organizationId_key: { organizationId: organization.id, key: "SUPER_ADMIN" } },
  });

  const defaultPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@vimove.vn" },
    update: {},
    create: {
      organizationId: organization.id,
      email: "admin@vimove.vn",
      name: "Quản trị viên VIMOVE",
      passwordHash,
      departmentId: executiveBoard.id,
      title: "Administrator",
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });

  console.log(`Admin user: admin@vimove.vn / ${defaultPassword} (đổi ngay sau lần đăng nhập đầu)`);

  // 5. Work Hub (Phase 2) — dữ liệu mẫu idempotent qua id cố định, để Kanban/Gantt/
  // Workload có dữ liệu ngay khi dev/demo. Tạo thêm 2 user mẫu vì Workload theo
  // user/team cần nhiều hơn 1 người mới có ý nghĩa để kiểm tra.
  const marketingStaff = await prisma.user.upsert({
    where: { email: "marketing@vimove.vn" },
    update: {},
    create: {
      organizationId: organization.id,
      email: "marketing@vimove.vn",
      name: "Lê Thị Marketing",
      passwordHash,
      departmentId: "seed-dept-marketing",
      title: "Nhân viên Marketing",
    },
  });
  const marketingStaffRole = await prisma.role.findUniqueOrThrow({
    where: { organizationId_key: { organizationId: organization.id, key: "MARKETING_STAFF" } },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: marketingStaff.id, roleId: marketingStaffRole.id } },
    update: {},
    create: { userId: marketingStaff.id, roleId: marketingStaffRole.id },
  });

  const salesStaff = await prisma.user.upsert({
    where: { email: "sales@vimove.vn" },
    update: {},
    create: {
      organizationId: organization.id,
      email: "sales@vimove.vn",
      name: "Trần Văn Kinh Doanh",
      passwordHash,
      departmentId: "seed-dept-sales",
      title: "Nhân viên Kinh doanh",
    },
  });
  const salesRole = await prisma.role.findUniqueOrThrow({
    where: { organizationId_key: { organizationId: organization.id, key: "SALES" } },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: salesStaff.id, roleId: salesRole.id } },
    update: {},
    create: { userId: salesStaff.id, roleId: salesRole.id },
  });

  const marketingTeam = await prisma.team.upsert({
    where: { id: "seed-team-marketing" },
    update: {},
    create: {
      id: "seed-team-marketing",
      organizationId: organization.id,
      departmentId: "seed-dept-marketing",
      name: "Đội Marketing",
    },
  });
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: marketingTeam.id, userId: marketingStaff.id } },
    update: {},
    create: { teamId: marketingTeam.id, userId: marketingStaff.id },
  });

  const tagInternal = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Nội bộ" } },
    update: {},
    create: { organizationId: organization.id, name: "Nội bộ", color: "#6366F1" },
  });
  const tagCustomer = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Khách hàng" } },
    update: {},
    create: { organizationId: organization.id, name: "Khách hàng", color: "#10B981" },
  });
  const tagUrgent = await prisma.tag.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "Gấp" } },
    update: {},
    create: { organizationId: organization.id, name: "Gấp", color: "#EF4444" },
  });

  await prisma.taskTemplate.upsert({
    where: { id: "seed-template-onboarding" },
    update: {},
    create: {
      id: "seed-template-onboarding",
      organizationId: organization.id,
      name: "Onboarding nhân sự mới",
      description: "Checklist chuẩn khi có nhân sự mới gia nhập",
      defaultPriority: "MEDIUM",
      checklistItems: ["Tạo tài khoản email", "Cấp quyền hệ thống", "Giới thiệu quy trình làm việc"],
      createdById: admin.id,
    },
  });

  const DAY_MS = 24 * 60 * 60 * 1000;
  const today = new Date();
  const addDays = (n: number) => new Date(today.getTime() + n * DAY_MS);

  const taskA = await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      organizationId: organization.id,
      title: "Lên kế hoạch chiến dịch Marketing Q4",
      description: "Xây dựng kế hoạch tổng thể chiến dịch quý 4",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: marketingStaff.id,
      teamId: marketingTeam.id,
      creatorId: admin.id,
      startAt: addDays(-2),
      dueAt: addDays(3),
      estimateHours: 16,
      position: 0,
      checklistItems: {
        create: [
          { title: "Xác định mục tiêu", position: 0, isDone: true },
          { title: "Phân bổ ngân sách", position: 1, isDone: false },
        ],
      },
      tags: { create: [{ tagId: tagInternal.id }] },
    },
  });

  const taskB = await prisma.task.upsert({
    where: { id: "seed-task-2" },
    update: {},
    create: {
      id: "seed-task-2",
      organizationId: organization.id,
      title: "Triển khai landing page chiến dịch",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: marketingStaff.id,
      teamId: marketingTeam.id,
      creatorId: admin.id,
      startAt: addDays(4),
      dueAt: addDays(9),
      estimateHours: 20,
      position: 0,
      tags: { create: [{ tagId: tagInternal.id }] },
    },
  });
  // taskB phụ thuộc taskA (finish-to-start) — demo mũi tên + chặn kéo vi phạm ở Gantt.
  await prisma.taskDependency.upsert({
    where: { taskId_dependsOnTaskId: { taskId: taskB.id, dependsOnTaskId: taskA.id } },
    update: {},
    create: { taskId: taskB.id, dependsOnTaskId: taskA.id },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-3" },
    update: {},
    create: {
      id: "seed-task-3",
      organizationId: organization.id,
      title: "Theo dõi công nợ khách hàng tháng 9",
      status: "TODO",
      priority: "URGENT",
      assigneeId: salesStaff.id,
      creatorId: admin.id,
      startAt: addDays(-1),
      dueAt: addDays(1),
      estimateHours: 6,
      position: 1,
      tags: { create: [{ tagId: tagCustomer.id }, { tagId: tagUrgent.id }] },
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-4" },
    update: {},
    create: {
      id: "seed-task-4",
      organizationId: organization.id,
      title: "Soạn báo giá cho khách hàng ABC",
      status: "IN_REVIEW",
      priority: "HIGH",
      assigneeId: salesStaff.id,
      creatorId: admin.id,
      startAt: addDays(-3),
      dueAt: addDays(0),
      estimateHours: 4,
      position: 0,
      tags: { create: [{ tagId: tagCustomer.id }] },
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-5" },
    update: {},
    create: {
      id: "seed-task-5",
      organizationId: organization.id,
      title: "Rà soát checklist bảo mật hệ thống",
      status: "DONE",
      priority: "MEDIUM",
      assigneeId: admin.id,
      creatorId: admin.id,
      startAt: addDays(-10),
      dueAt: addDays(-7),
      completedAt: addDays(-7),
      estimateHours: 8,
      position: 0,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-6" },
    update: {},
    create: {
      id: "seed-task-6",
      organizationId: organization.id,
      title: "Chuẩn bị họp tổng kết tuần",
      status: "TODO",
      priority: "LOW",
      assigneeId: admin.id,
      creatorId: admin.id,
      dueAt: addDays(2),
      estimateHours: 2,
      position: 2,
    },
  });

  await prisma.task.upsert({
    where: { id: "seed-task-7" },
    update: {},
    create: {
      id: "seed-task-7",
      organizationId: organization.id,
      title: "Đánh giá hiệu quả quảng cáo tuần trước",
      status: "CANCELLED",
      priority: "LOW",
      assigneeId: marketingStaff.id,
      creatorId: admin.id,
      startAt: addDays(-14),
      dueAt: addDays(-10),
      estimateHours: 5,
      position: 1,
    },
  });

  console.log(`Demo user: marketing@vimove.vn / ${defaultPassword}`);
  console.log(`Demo user: sales@vimove.vn / ${defaultPassword}`);
  console.log("Work Hub demo data: 7 task, 3 nhãn, 1 mẫu, 1 nhóm.");

  // 6. Project & Process (Phase 3) — dữ liệu mẫu idempotent.
  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      organizationId: organization.id,
      name: "Ra mắt sản phẩm Q4",
      description: "Chiến dịch ra mắt sản phẩm mới quý 4 — phối hợp Marketing + Sales.",
      status: "ACTIVE",
      ownerId: admin.id,
      startAt: addDays(-5),
      endAt: addDays(30),
      members: {
        create: [
          { userId: admin.id, role: "OWNER" },
          { userId: marketingStaff.id, role: "MEMBER" },
          { userId: salesStaff.id, role: "MEMBER" },
        ],
      },
      milestones: {
        create: [
          { name: "Chốt kế hoạch marketing", dueAt: addDays(-2), status: "DONE", position: 0 },
          { name: "Triển khai landing page", dueAt: addDays(9), status: "PENDING", position: 1 },
          { name: "Ra mắt chính thức", dueAt: addDays(30), status: "PENDING", position: 2 },
        ],
      },
    },
  });
  await prisma.task.updateMany({ where: { id: { in: ["seed-task-1", "seed-task-2"] } }, data: { projectId: project.id } });

  const workflow = await prisma.workflow.upsert({
    where: { id: "seed-workflow-1" },
    update: {},
    create: {
      id: "seed-workflow-1",
      organizationId: organization.id,
      name: "Thông báo khi có công việc khẩn cấp",
      description: "Demo Workflow Builder: Trigger thủ công → gửi thông báo cho Admin.",
      isActive: true,
      createdById: admin.id,
    },
  });
  const workflowVersion = await prisma.workflowVersion.upsert({
    where: { workflowId_version: { workflowId: workflow.id, version: 1 } },
    update: {},
    create: {
      workflowId: workflow.id,
      version: 1,
      publishedAt: new Date(),
      createdById: admin.id,
      definition: {
        nodes: [
          { id: "trigger-1", type: "TRIGGER", position: { x: 0, y: 0 }, data: { label: "Chạy thủ công", config: {} } },
          {
            id: "action-1",
            type: "ACTION",
            position: { x: 0, y: 120 },
            data: { label: "Báo Admin", config: { actionKind: "notify", userId: admin.id, message: "Workflow demo đã chạy" } },
          },
        ],
        edges: [{ id: "e1", source: "trigger-1", target: "action-1" }],
      },
    },
  });
  await prisma.workflow.update({ where: { id: workflow.id }, data: { currentVersionId: workflowVersion.id } });

  await prisma.approvalRequest.upsert({
    where: { id: "seed-approval-1" },
    update: {},
    create: {
      id: "seed-approval-1",
      organizationId: organization.id,
      entityType: "TASK",
      entityId: "seed-task-3",
      title: "Theo dõi công nợ khách hàng tháng 9",
      requestedById: salesStaff.id,
      mode: "SEQUENTIAL",
      slaHours: 48,
      dueAt: addDays(2),
      steps: {
        create: [
          { position: 0, approverId: admin.id },
          { position: 1, approverId: marketingStaff.id },
        ],
      },
    },
  });

  console.log("Project & Process demo data: 1 dự án, 1 workflow đã publish, 1 yêu cầu duyệt.");

  // 8. CRM & Sales (Phase 4) — pipeline mặc định đúng theo roadmap NEW→CONTACTED→
  // QUALIFIED→OFFER→NEGOTIATION→WON/LOST, vài lead trải đều các giai đoạn, 1 khách
  // hàng đã convert từ lead thắng + có đơn hàng, sản phẩm/kênh bán mẫu.
  const pipeline = await prisma.pipeline.upsert({
    where: { id: "seed-pipeline-1" },
    update: {},
    create: {
      id: "seed-pipeline-1",
      organizationId: organization.id,
      name: "Pipeline bán hàng",
      isDefault: true,
      stages: {
        create: [
          { id: "seed-stage-new", name: "Mới", type: "OPEN", position: 0 },
          { id: "seed-stage-contacted", name: "Đã liên hệ", type: "OPEN", position: 1 },
          { id: "seed-stage-qualified", name: "Đạt yêu cầu", type: "OPEN", position: 2 },
          { id: "seed-stage-offer", name: "Báo giá", type: "OPEN", position: 3 },
          { id: "seed-stage-negotiation", name: "Đàm phán", type: "OPEN", position: 4 },
          { id: "seed-stage-won", name: "Thắng", type: "WON", position: 5 },
          { id: "seed-stage-lost", name: "Thua", type: "LOST", position: 6 },
        ],
      },
    },
  });

  const wonCustomer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      organizationId: organization.id,
      name: "Công ty TNHH ABC",
      email: "contact@abc.vn",
      phone: "0901234567",
      company: "ABC Co., Ltd",
      ownerId: salesStaff.id,
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-won" },
    update: {},
    create: {
      id: "seed-lead-won",
      organizationId: organization.id,
      name: "Công ty TNHH ABC — Gói giải pháp Q4",
      contactName: "Chị Hoa",
      email: "contact@abc.vn",
      source: "REFERRAL",
      value: 85_000_000,
      pipelineId: pipeline.id,
      stageId: "seed-stage-won",
      ownerId: salesStaff.id,
      customerId: wonCustomer.id,
      wonAt: addDays(-3),
      activities: {
        create: [
          { actorId: salesStaff.id, type: "NOTE", content: "Tạo lead", createdAt: addDays(-14) },
          { actorId: salesStaff.id, type: "STAGE_CHANGED", content: "Mới → Thắng", createdAt: addDays(-3) },
          { actorId: salesStaff.id, type: "CONVERTED", content: `Đã chuyển thành khách hàng "${wonCustomer.name}"`, createdAt: addDays(-3) },
        ],
      },
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-negotiation" },
    update: {},
    create: {
      id: "seed-lead-negotiation",
      organizationId: organization.id,
      name: "Công ty CP XYZ — Nâng cấp hệ thống",
      contactName: "Anh Nam",
      email: "nam@xyz.vn",
      source: "WEBSITE",
      value: 42_000_000,
      pipelineId: pipeline.id,
      stageId: "seed-stage-negotiation",
      ownerId: salesStaff.id,
      activities: { create: [{ actorId: salesStaff.id, type: "CALL", content: "Đã gọi trao đổi báo giá", createdAt: addDays(-1) }] },
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-new" },
    update: {},
    create: {
      id: "seed-lead-new",
      organizationId: organization.id,
      name: "Cửa hàng Minh Phát",
      source: "ADS",
      value: 15_000_000,
      pipelineId: pipeline.id,
      stageId: "seed-stage-new",
      ownerId: marketingStaff.id,
    },
  });

  const productWebsite = await prisma.product.upsert({
    where: { id: "seed-product-1" },
    update: {},
    create: { id: "seed-product-1", organizationId: organization.id, name: "Gói triển khai Website", sku: "SVC-WEB-01", price: 25_000_000, unit: "gói" },
  });
  const productSupport = await prisma.product.upsert({
    where: { id: "seed-product-2" },
    update: {},
    create: { id: "seed-product-2", organizationId: organization.id, name: "Gói hỗ trợ vận hành 12 tháng", sku: "SVC-SUP-12", price: 60_000_000, unit: "gói" },
  });

  const onlineChannel = await prisma.salesChannel.upsert({
    where: { id: "seed-channel-1" },
    update: {},
    create: { id: "seed-channel-1", organizationId: organization.id, name: "Website công ty", type: "ONLINE" },
  });
  await prisma.salesChannel.upsert({
    where: { id: "seed-channel-2" },
    update: {},
    create: { id: "seed-channel-2", organizationId: organization.id, name: "Giới thiệu đối tác", type: "PARTNER" },
  });

  const orderTotal = Number(productWebsite.price) + Number(productSupport.price);
  await prisma.order.upsert({
    where: { id: "seed-order-1" },
    update: {},
    create: {
      id: "seed-order-1",
      organizationId: organization.id,
      customerId: wonCustomer.id,
      channelId: onlineChannel.id,
      ownerId: salesStaff.id,
      status: "CONFIRMED",
      totalAmount: orderTotal,
      orderDate: addDays(-2),
      items: {
        create: [
          { productId: productWebsite.id, quantity: 1, unitPrice: productWebsite.price, lineTotal: productWebsite.price },
          { productId: productSupport.id, quantity: 1, unitPrice: productSupport.price, lineTotal: productSupport.price },
        ],
      },
    },
  });

  console.log("CRM & Sales demo data: 1 pipeline (7 giai đoạn), 3 lead, 1 khách hàng, 2 sản phẩm, 2 kênh bán, 1 đơn hàng.");

  // 9. Marketing (Phase 5) — 1 chiến dịch gắn với dự án Phase 3, gắn campaignId cho
  // lead seed-lead-won (đã có customer + order) để KPI Revenue/Orders/CAC hiện số
  // thật thay vì toàn 0. Content trải đều vài giai đoạn để board không rỗng.
  const campaign = await prisma.campaign.upsert({
    where: { id: "seed-campaign-1" },
    update: {},
    create: {
      id: "seed-campaign-1",
      organizationId: organization.id,
      projectId: project.id,
      name: "Ra mắt sản phẩm Q4",
      description: "Chiến dịch marketing đồng hành cùng dự án Ra mắt sản phẩm Q4.",
      status: "ACTIVE",
      budget: 50_000_000,
      startAt: addDays(-14),
      endAt: addDays(30),
      createdById: marketingStaff.id,
      channels: {
        create: [
          { type: "FACEBOOK", plannedBudget: 20_000_000 },
          { type: "GOOGLE", plannedBudget: 15_000_000 },
        ],
      },
    },
  });

  // Quy lead đã thắng (có order thật) về chiến dịch này để KPI Revenue/Orders/CAC
  // tính ra số thật khi verify (không phải mọi lead đều thuộc chiến dịch).
  await prisma.lead.update({ where: { id: "seed-lead-won" }, data: { campaignId: campaign.id } });

  await prisma.content.upsert({
    where: { id: "seed-content-1" },
    update: {},
    create: {
      id: "seed-content-1",
      organizationId: organization.id,
      campaignId: campaign.id,
      title: "Bài viết giới thiệu sản phẩm mới",
      type: "ARTICLE",
      status: "REVIEW",
      body: "Bài blog giới thiệu tính năng nổi bật của sản phẩm Q4.",
      assigneeId: marketingStaff.id,
      createdById: marketingStaff.id,
      position: 0,
    },
  });
  await prisma.content.upsert({
    where: { id: "seed-content-2" },
    update: {},
    create: {
      id: "seed-content-2",
      organizationId: organization.id,
      campaignId: campaign.id,
      title: "Video teaser ra mắt",
      type: "VIDEO",
      status: "PRODUCTION",
      assigneeId: marketingStaff.id,
      createdById: marketingStaff.id,
      position: 0,
    },
  });
  await prisma.content.upsert({
    where: { id: "seed-content-3" },
    update: {},
    create: {
      id: "seed-content-3",
      organizationId: organization.id,
      campaignId: campaign.id,
      title: "Ý tưởng livestream Q&A",
      type: "SOCIAL_POST",
      status: "IDEA",
      createdById: marketingStaff.id,
      position: 0,
    },
  });

  const fbAccount = await prisma.socialAccount.upsert({
    where: { id: "seed-social-account-1" },
    update: {},
    create: { id: "seed-social-account-1", organizationId: organization.id, platform: "FACEBOOK", name: "VIMOVE Official", handle: "@vimove.official" },
  });
  await prisma.socialPost.upsert({
    where: { id: "seed-social-post-1" },
    update: {},
    create: {
      id: "seed-social-post-1",
      organizationId: organization.id,
      socialAccountId: fbAccount.id,
      contentId: "seed-content-1",
      caption: "Sắp ra mắt sản phẩm mới — đón chờ nhé!",
      status: "SCHEDULED",
      scheduledAt: addDays(3),
      createdById: marketingStaff.id,
    },
  });

  await prisma.landingPage.upsert({
    where: { id: "seed-landing-page-1" },
    update: {},
    create: {
      id: "seed-landing-page-1",
      organizationId: organization.id,
      campaignId: campaign.id,
      name: "Landing page ra mắt Q4",
      slug: "ra-mat-q4",
      status: "PUBLISHED",
      headline: "Sản phẩm mới sắp ra mắt — Đăng ký nhận ưu đãi sớm",
      body: "Để lại thông tin để nhận thông báo ngay khi sản phẩm chính thức ra mắt và ưu đãi giới hạn dành riêng cho người đăng ký sớm.",
      ctaLabel: "Đăng ký ngay",
      createdById: marketingStaff.id,
      forms: {
        create: [
          {
            id: "seed-landing-form-1",
            name: "Đăng ký nhận tư vấn",
            fields: [
              { key: "name", label: "Họ tên", type: "text", required: true },
              { key: "email", label: "Email", type: "email", required: true },
              { key: "phone", label: "Số điện thoại", type: "phone", required: false },
            ],
          },
        ],
      },
    },
  });
  await prisma.formSubmission.upsert({
    where: { id: "seed-form-submission-1" },
    update: {},
    create: {
      id: "seed-form-submission-1",
      landingFormId: "seed-landing-form-1",
      data: { name: "Nguyễn Văn A", email: "nguyenvana@example.com", phone: "0909123456" },
      submittedAt: addDays(-1),
    },
  });

  await prisma.emailCampaign.upsert({
    where: { id: "seed-email-campaign-1" },
    update: {},
    create: {
      id: "seed-email-campaign-1",
      organizationId: organization.id,
      campaignId: campaign.id,
      name: "Email thông báo ra mắt",
      subject: "🎉 Sản phẩm mới sắp ra mắt — ưu đãi dành riêng cho bạn",
      status: "DRAFT",
      createdById: marketingStaff.id,
    },
  });

  console.log("Marketing demo data: 1 chiến dịch (2 kênh), 3 nội dung, 1 tài khoản social + 1 bài đăng, 1 landing page (đã publish, 1 lượt đăng ký), 1 email campaign.");
  console.log("Seed hoàn tất.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
