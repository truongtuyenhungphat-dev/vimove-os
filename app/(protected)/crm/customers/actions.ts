"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/rbac";
import { createCustomer, updateCustomer, deleteCustomer } from "@/services/crm/customers";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Cần nhập tên khách hàng"),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
  ownerId: z.string().trim().optional(),
});

export async function createCustomerAction(formData: FormData) {
  const session = await assertPermission("customers.create");
  const parsed = customerSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    address: formData.get("address") || undefined,
    ownerId: formData.get("ownerId") || undefined,
  });
  await createCustomer(session.user.organizationId, session.user.id, parsed);
  revalidatePath("/crm/customers");
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const session = await assertPermission("customers.update");
  const parsed = customerSchema.parse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    address: formData.get("address") || undefined,
    ownerId: formData.get("ownerId") || undefined,
  });
  await updateCustomer(session.user.organizationId, session.user.id, customerId, parsed);
  revalidatePath("/crm/customers");
  revalidatePath(`/crm/customers/${customerId}`);
}

export async function deleteCustomerAction(customerId: string) {
  const session = await assertPermission("customers.delete");
  await deleteCustomer(session.user.organizationId, session.user.id, customerId);
  revalidatePath("/crm/customers");
}
