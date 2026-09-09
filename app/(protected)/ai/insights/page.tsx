import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listInsights } from "@/services/ai/insights";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GenerateInsightsButton } from "@/components/ai/generate-insights-button";
import { AI_INSIGHT_TYPE_LABELS, AI_INSIGHT_SEVERITY_LABELS } from "@/lib/ai/types";
import { generateInsightsAction } from "./actions";

export const metadata: Metadata = { title: "AI Insights — VIMOVE OS" };

const SEVERITY_STYLE: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HIGH: "bg-destructive/10 text-destructive",
};

export default async function AiInsightsPage() {
  const session = await requirePermission("ai.read");
  const canManage = hasPermission(session, "ai.manage");
  const insights = await listInsights(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="AI Insights"
        description="AI Manager (điểm nghẽn, sức khoẻ dự án) + AI Marketing Analyst (bất thường) — tính bằng heuristic thật trên dữ liệu tổ chức"
        actions={canManage ? <GenerateInsightsButton action={generateInsightsAction} /> : undefined}
      />

      {insights.length === 0 ? (
        <EmptyState icon={Lightbulb} title="Chưa có insight nào" description='Bấm "Tạo insight mới" để quét dữ liệu tổ chức.' />
      ) : (
        <div className="flex flex-col gap-2">
          {insights.map((insight) => (
            <Card key={insight.id}>
              <CardContent className="flex flex-col gap-1.5 pt-6 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-transparent bg-muted font-normal">
                    {AI_INSIGHT_TYPE_LABELS[insight.type]}
                  </Badge>
                  <Badge variant="outline" className={`border-transparent font-normal ${SEVERITY_STYLE[insight.severity]}`}>
                    {AI_INSIGHT_SEVERITY_LABELS[insight.severity]}
                  </Badge>
                </div>
                <p className="font-medium">{insight.title}</p>
                <p className="text-muted-foreground">{insight.description}</p>
                <p className="text-xs text-muted-foreground">Phát hiện: {new Date(insight.detectedAt).toLocaleString("vi-VN")}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
