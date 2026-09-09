"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createOrder, updateOrderStatus, deleteOrder } from "@/services/sales/orders";

const itemsSchema = z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().min(1) })).min(1, "Cần ít nhất 1 sản phẩm");

const orderSchema = z.object({
  customerId: z.string().min(1, "Cần chọn khách hàng"),
  channelId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createOrderAction(formData: FormData) {
  const session = await assertPermission("orders.create");
  const parsed = orderSchema.parse({
    customerId: formData.get("customerId"),
    channelId: formData.get("channelId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  const items = itemsSchema.parse(JSON.parse(String(formData.get("itemsJson") || "[]")));
  // Không return order: Prisma trả `totalAmount`/`unitPrice`/`lineTotal` dạng Decimal,
  // không serialize được qua RSC boundary khi Server Action được gọi từ Client
  // Component (Next.js báo lỗi "Only plain objects... Decimal objects are not
  // supported") — OrderDialog cũng không cần giá trị trả về, chỉ cần biết đã xong.
  await createOrder(session.user.organizationId, session.user.id, {
    customerId: parsed.customerId,
    channelId: parsed.channelId || null,
    notes: parsed.notes || null,
    items,
  });
  revalidatePath("/sales/orders");
  revalidatePath(`/crm/customers/${parsed.customerId}`);
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  const session = await assertPermission("orders.update");
  const parsed = z.enum(["DRAFT", "CONFIRMED", "FULFILLED", "CANCELLED", "REFUNDED"]).parse(status);
  await updateOrderStatus(session.user.organizationId, session.user.id, orderId, parsed);
  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${orderId}`);
}

export async function deleteOrderAction(orderId: string) {
  const session = await assertPermission("orders.delete");
  await deleteOrder(session.user.organizationId, session.user.id, orderId);
  revalidatePath("/sales/orders");
}
