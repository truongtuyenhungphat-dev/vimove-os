import { redirect } from "next/navigation";

// Cùng lý do với app/(protected)/crm/page.tsx — "/sales" chỉ là breadcrumb segment
// cha, redirect về Đơn hàng thay vì 404.
export default function SalesIndexPage() {
  redirect("/sales/orders");
}
