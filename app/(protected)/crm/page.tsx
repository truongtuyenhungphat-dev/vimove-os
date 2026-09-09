import { redirect } from "next/navigation";

// "/crm" tự nó không phải trang thật (breadcrumb segment cha của /crm/leads,
// /crm/customers, /crm/pipelines) — redirect về Lead thay vì để breadcrumb dẫn tới
// trang 404 (đúng §34 rule 6: không có link trỏ tới trang không tồn tại).
export default function CrmIndexPage() {
  redirect("/crm/leads");
}
