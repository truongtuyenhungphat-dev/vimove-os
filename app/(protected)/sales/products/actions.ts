"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createProduct, updateProduct, deleteProduct } from "@/services/sales/products";

const productSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên sản phẩm"),
  sku: z.string().trim().optional(),
  unit: z.string().trim().optional(),
  price: z.coerce.number().min(0, "Giá phải >= 0"),
});

export async function createProductAction(formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const parsed = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    unit: formData.get("unit") || undefined,
    price: formData.get("price"),
  });
  await createProduct(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/sales/products");
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await assertPermission("sales_catalog.manage");
  const parsed = productSchema.parse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    unit: formData.get("unit") || undefined,
    price: formData.get("price"),
  });
  await updateProduct(session.user.organizationId, session.user.id, productId, {
    ...parsed,
    isActive: formData.get("isActive") === "true",
  });
  revalidatePath("/sales/products");
}

export async function deleteProductAction(productId: string) {
  const session = await assertPermission("sales_catalog.manage");
  await deleteProduct(session.user.organizationId, session.user.id, productId);
  revalidatePath("/sales/products");
}
