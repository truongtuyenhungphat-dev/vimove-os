import type { Metadata } from "next";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listDataQualityIssues } from "@/services/analytics/data-quality";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScanButton } from "@/components/analytics/scan-button";
import { IssueList } from "@/components/analytics/issue-list";
import { runDataQualityScanAction, resolveIssueAction } from "../actions";

export const metadata: Metadata = { title: "Data Quality Hub — VIMOVE OS" };

export default async function DataQualityPage() {
  const session = await requirePermission("analytics.read");
  const canManage = hasPermission(session, "analytics.manage");
  const issues = await listDataQualityIssues(session.user.organizationId);

  const open = issues.filter((i) => i.status === "OPEN").map((i) => ({ ...i, detectedAt: i.detectedAt.toISOString() }));
  const resolved = issues.filter((i) => i.status !== "OPEN").map((i) => ({ ...i, detectedAt: i.detectedAt.toISOString() }));

  return (
    <>
      <PageHeader
        title="Data Quality Hub"
        description="Tự động phát hiện: đồng bộ thất bại, thiếu UTM, trùng lặp, tài khoản không cập nhật, số liệu không khớp"
        actions={canManage ? <ScanButton action={runDataQualityScanAction} /> : undefined}
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Đang mở ({open.length})</TabsTrigger>
              <TabsTrigger value="resolved">Đã xử lý ({resolved.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="open" className="pt-3">
              <IssueList items={open} canManage={canManage} onResolve={resolveIssueAction} />
            </TabsContent>
            <TabsContent value="resolved" className="pt-3">
              <IssueList items={resolved} canManage={canManage} onResolve={resolveIssueAction} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
