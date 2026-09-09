import { redirect } from "next/navigation";

// "/ai" chỉ là breadcrumb segment cha (Phase 8) — cùng lý do với app/(protected)/crm/page.tsx.
export default function AiIndexPage() {
  redirect("/ai/assistant");
}
