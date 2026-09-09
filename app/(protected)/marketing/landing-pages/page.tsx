import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listLandingPages } from "@/services/marketing/landing-pages";
import { listCampaigns } from "@/services/marketing/campaigns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LandingPageDialog } from "@/components/marketing/landing-page-dialog";
import { LANDING_PAGE_STATUS_LABELS } from "@/lib/marketing/types";
import { createLandingPageAction } from "./actions";

export const metadata: Metadata = { title: "Landing Page — VIMOVE OS" };

export default async function LandingPagesPage() {
  const session = await requirePermission("marketing_channels.read");
  const canManage = hasPermission(session, "marketing_channels.manage");

  const [pages, campaigns] = await Promise.all([
    listLandingPages(session.user.organizationId),
    listCampaigns(session.user.organizationId),
  ]);

  return (
    <>
      <PageHeader
        title="Landing Page"
        description="Trang công khai thật tại /lp/[slug] — form thu lead hoạt động ngay"
        actions={canManage ? <LandingPageDialog mode="create" campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} action={createLandingPageAction} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {pages.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={FileText} title="Chưa có landing page nào" description="Tạo landing page đầu tiên để bắt đầu thu lead." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Chiến dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/marketing/landing-pages/${p.id}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">/lp/{p.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{p.campaign?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`border-transparent font-normal ${p.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
                      >
                        {LANDING_PAGE_STATUS_LABELS[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p._count.forms}</TableCell>
                    <TableCell>
                      {p.status === "PUBLISHED" && (
                        <a href={`/lp/${p.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Mở trang công khai">
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
