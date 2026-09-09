import { redirect } from "next/navigation";

// "/work" chỉ là breadcrumb segment cha (Phase 2) — cùng lý do với
// app/(protected)/crm/page.tsx, redirect về Việc của tôi thay vì 404. Phát hiện và vá
// khi thêm CRM/Sales (Phase 4) dùng chung app-breadcrumb.tsx.
export default function WorkIndexPage() {
  redirect("/work/my-tasks");
}
