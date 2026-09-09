import { redirect } from "next/navigation";

// "/marketing" chỉ là breadcrumb segment cha (Phase 5) — cùng lý do với
// app/(protected)/crm/page.tsx (Phase 4), redirect về Chiến dịch thay vì 404.
export default function MarketingIndexPage() {
  redirect("/marketing/campaigns");
}
