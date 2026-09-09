import { redirect } from "next/navigation";

// "/integrations" chỉ là breadcrumb segment cha (Phase 6) — cùng lý do với
// app/(protected)/crm/page.tsx (Phase 4).
export default function IntegrationsIndexPage() {
  redirect("/integrations/ads");
}
