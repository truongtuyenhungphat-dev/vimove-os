import { redirect } from "next/navigation";

// "/process" chỉ là breadcrumb segment cha (Phase 3) — cùng lý do với
// app/(protected)/crm/page.tsx.
export default function ProcessIndexPage() {
  redirect("/process/workflows");
}
