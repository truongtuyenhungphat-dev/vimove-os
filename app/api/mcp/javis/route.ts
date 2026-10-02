import "server-only";
import crypto from "node:crypto";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { getJavisActorId, getVimoveOrgId } from "@/lib/mcp/javis-context";
import { listOrders, getOrder, getOrdersSummary, createOrder, updateOrderStatus } from "@/services/sales/orders";
import {
  listWarranties,
  getWarranty,
  findWarrantyByCode,
  getWarrantySummary,
  createWarranty,
  updateWarranty,
  generateWarrantyCode,
} from "@/services/warranty/warranties";
import { listCustomers, getCustomer360, getCustomersSummary, createCustomer, updateCustomer } from "@/services/crm/customers";
import { listProducts } from "@/services/sales/products";

// MCP server cho Javis OS đọc + (tuỳ JAVIS_MCP_ALLOW_WRITE) thao tác thật trên
// VIMOVE OS. Chạy Streamable HTTP ở chế độ KHÔNG session (stateless) — đúng
// pattern khuyến nghị cho serverless/Vercel, vì mỗi request có thể rơi vào
// lambda instance khác nhau nên không giữ session trong bộ nhớ được.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ORDER_STATUS_VALUES = ["DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED", "REFUNDED"] as const;
const WARRANTY_STATUS_VALUES = ["ACTIVE", "CLAIMED", "EXPIRED", "VOIDED"] as const;

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// z.coerce.date() không convert được sang JSON Schema (tools/list báo lỗi "Date
// cannot be represented in JSON Schema") — nhận chuỗi ISO rồi tự parse Date.
const isoDate = () => z.string().describe("Ngày giờ dạng ISO 8601, vd 2026-10-02");
function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.JAVIS_MCP_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match) return false;
  const provided = Buffer.from(match[1]);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(provided, expectedBuf);
}

function buildServer(): McpServer {
  const server = new McpServer({ name: "vimove-os", version: "1.0.0" });

  server.registerTool(
    "vimove_list_orders",
    {
      title: "Danh sách đơn hàng",
      description: "Liệt kê đơn hàng VIMOVE, lọc theo trạng thái và/hoặc khách hàng.",
      inputSchema: {
        status: z.enum(ORDER_STATUS_VALUES).optional(),
        customerId: z.string().optional(),
      },
    },
    async ({ status, customerId }) => {
      const organizationId = await getVimoveOrgId();
      return jsonResult(await listOrders(organizationId, { status, customerId }));
    }
  );

  server.registerTool(
    "vimove_get_order",
    {
      title: "Chi tiết đơn hàng",
      description: "Lấy chi tiết 1 đơn hàng theo id, gồm danh sách sản phẩm trong đơn.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const organizationId = await getVimoveOrgId();
      const order = await getOrder(organizationId, id);
      if (!order) throw new Error("Không tìm thấy đơn hàng");
      return jsonResult(order);
    }
  );

  server.registerTool(
    "vimove_get_orders_summary",
    {
      title: "Tóm tắt đơn hàng",
      description: "KPI tổng quan đơn hàng: số đơn tháng này, doanh thu tháng này, đơn chờ xử lý, giá trị đơn trung bình (AOV).",
      inputSchema: {},
    },
    async () => jsonResult(await getOrdersSummary(await getVimoveOrgId()))
  );

  server.registerTool(
    "vimove_list_warranties",
    {
      title: "Danh sách bảo hành",
      description: "Liệt kê phiếu bảo hành, lọc theo trạng thái và/hoặc từ khoá (mã bảo hành, tên sản phẩm, tên/SĐT khách).",
      inputSchema: {
        status: z.enum(WARRANTY_STATUS_VALUES).optional(),
        search: z.string().optional(),
      },
    },
    async ({ status, search }) => {
      const organizationId = await getVimoveOrgId();
      return jsonResult(await listWarranties(organizationId, { status, search }));
    }
  );

  server.registerTool(
    "vimove_get_warranty",
    {
      title: "Chi tiết bảo hành",
      description: "Lấy chi tiết 1 phiếu bảo hành theo id.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const organizationId = await getVimoveOrgId();
      const warranty = await getWarranty(organizationId, id);
      if (!warranty) throw new Error("Không tìm thấy bảo hành");
      return jsonResult(warranty);
    }
  );

  server.registerTool(
    "vimove_find_warranty_by_code",
    {
      title: "Tra bảo hành theo mã",
      description: "Tra cứu phiếu bảo hành bằng mã bảo hành (vd VM-ABC123).",
      inputSchema: { warrantyCode: z.string() },
    },
    async ({ warrantyCode }) => {
      const warranty = await findWarrantyByCode(warrantyCode);
      if (!warranty) throw new Error("Không tìm thấy bảo hành với mã này");
      return jsonResult(warranty);
    }
  );

  server.registerTool(
    "vimove_get_warranty_summary",
    {
      title: "Tóm tắt bảo hành",
      description: "KPI tổng quan bảo hành: tổng số, còn hạn, sắp hết hạn trong 30 ngày, đã bảo hành.",
      inputSchema: {},
    },
    async () => jsonResult(await getWarrantySummary(await getVimoveOrgId()))
  );

  server.registerTool(
    "vimove_list_customers",
    {
      title: "Danh sách khách hàng",
      description: "Liệt kê khách hàng CRM, lọc theo từ khoá (tên, email, SĐT).",
      inputSchema: { search: z.string().optional() },
    },
    async ({ search }) => {
      const organizationId = await getVimoveOrgId();
      return jsonResult(await listCustomers(organizationId, search));
    }
  );

  server.registerTool(
    "vimove_get_customer_360",
    {
      title: "Hồ sơ 360 khách hàng",
      description: "Hồ sơ đầy đủ 1 khách hàng: thông tin, leads, đơn hàng, tổng doanh thu (LTV).",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const organizationId = await getVimoveOrgId();
      const customer = await getCustomer360(organizationId, id);
      if (!customer) throw new Error("Không tìm thấy khách hàng");
      return jsonResult(customer);
    }
  );

  server.registerTool(
    "vimove_get_customers_summary",
    {
      title: "Tóm tắt khách hàng",
      description: "KPI tổng quan khách hàng: tổng số, mới trong tháng, đã có đơn hàng.",
      inputSchema: {},
    },
    async () => jsonResult(await getCustomersSummary(await getVimoveOrgId()))
  );

  server.registerTool(
    "vimove_list_products",
    {
      title: "Danh sách sản phẩm",
      description: "Liệt kê sản phẩm VIMOVE (vali, balo, túi du lịch...), kèm giá.",
      inputSchema: { includeInactive: z.boolean().optional() },
    },
    async ({ includeInactive }) => {
      const organizationId = await getVimoveOrgId();
      return jsonResult(await listProducts(organizationId, includeInactive ?? true));
    }
  );

  if (process.env.JAVIS_MCP_ALLOW_WRITE !== "false") {
    server.registerTool(
      "vimove_create_order",
      {
        title: "Tạo đơn hàng",
        description: "Tạo đơn hàng mới cho một khách hàng đã có trong hệ thống, kèm danh sách sản phẩm + số lượng.",
        inputSchema: {
          customerId: z.string(),
          channelId: z.string().optional(),
          orderDate: isoDate().optional(),
          notes: z.string().optional(),
          items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
        },
      },
      async ({ customerId, channelId, orderDate, notes, items }) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        const order = await createOrder(organizationId, actorId, { customerId, channelId, orderDate: toDate(orderDate), notes, items });
        return jsonResult(order);
      }
    );

    server.registerTool(
      "vimove_update_order_status",
      {
        title: "Cập nhật trạng thái đơn hàng",
        description: "Đổi trạng thái đơn hàng (DRAFT/CONFIRMED/FULFILLED/CANCELLED/REFUNDED).",
        inputSchema: { id: z.string(), status: z.enum(ORDER_STATUS_VALUES) },
      },
      async ({ id, status }) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        const order = await updateOrderStatus(organizationId, actorId, id, status);
        return jsonResult(order);
      }
    );

    server.registerTool(
      "vimove_create_warranty",
      {
        title: "Đăng ký bảo hành",
        description:
          "Tạo phiếu bảo hành mới cho một khách hàng đã có trong hệ thống. Bỏ trống warrantyCode để hệ thống tự sinh mã (dạng VM-XXXXXX).",
        inputSchema: {
          customerId: z.string(),
          productId: z.string().optional(),
          productName: z.string(),
          color: z.string().optional(),
          size: z.string().optional(),
          purchaseChannel: z.string().optional(),
          purchaseDate: isoDate().optional(),
          activatedAt: isoDate().optional(),
          warrantyExpiry: isoDate().optional(),
          warrantyCode: z.string().optional(),
          status: z.enum(WARRANTY_STATUS_VALUES).optional(),
          notes: z.string().optional(),
        },
      },
      async (data) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        const warrantyCode = data.warrantyCode || (await generateWarrantyCode());
        const warranty = await createWarranty(organizationId, actorId, {
          ...data,
          warrantyCode,
          purchaseDate: toDate(data.purchaseDate),
          activatedAt: toDate(data.activatedAt),
          warrantyExpiry: toDate(data.warrantyExpiry),
        });
        return jsonResult(warranty);
      }
    );

    server.registerTool(
      "vimove_update_warranty",
      {
        title: "Cập nhật bảo hành",
        description: "Sửa thông tin một phiếu bảo hành đã có (không đổi được mã bảo hành).",
        inputSchema: {
          id: z.string(),
          customerId: z.string(),
          productId: z.string().optional(),
          productName: z.string(),
          color: z.string().optional(),
          size: z.string().optional(),
          purchaseChannel: z.string().optional(),
          purchaseDate: isoDate().optional(),
          activatedAt: isoDate().optional(),
          warrantyExpiry: isoDate().optional(),
          status: z.enum(WARRANTY_STATUS_VALUES),
          notes: z.string().optional(),
        },
      },
      async ({ id, ...data }) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        const warranty = await updateWarranty(organizationId, actorId, id, {
          ...data,
          purchaseDate: toDate(data.purchaseDate),
          activatedAt: toDate(data.activatedAt),
          warrantyExpiry: toDate(data.warrantyExpiry),
        });
        return jsonResult(warranty);
      }
    );

    server.registerTool(
      "vimove_create_customer",
      {
        title: "Tạo khách hàng",
        description: "Tạo khách hàng mới trong CRM.",
        inputSchema: {
          name: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          address: z.string().optional(),
        },
      },
      async (data) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        return jsonResult(await createCustomer(organizationId, actorId, data));
      }
    );

    server.registerTool(
      "vimove_update_customer",
      {
        title: "Cập nhật khách hàng",
        description: "Sửa thông tin một khách hàng đã có.",
        inputSchema: {
          id: z.string(),
          name: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          address: z.string().optional(),
        },
      },
      async ({ id, ...data }) => {
        const organizationId = await getVimoveOrgId();
        const actorId = await getJavisActorId();
        return jsonResult(await updateCustomer(organizationId, actorId, id, data));
      }
    );
  }

  return server;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport();
  await server.connect(transport);
  return transport.handleRequest(request);
}
