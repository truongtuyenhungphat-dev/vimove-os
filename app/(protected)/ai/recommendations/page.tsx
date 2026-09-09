import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import { listRecommendations } from "@/services/ai/recommendations";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import { approveRecommendationAction, rejectRecommendationAction } from "./actions";

export const metadata: Metadata = { title: "Approval Queue — VIMOVE OS" };

export default async function AiRecommendationsPage() {
  const session = await requirePermission("ai.read");
  const canManage = hasPermission(session, "ai.manage");
  const recommendations = await listRecommendations(session.user.organizationId);

  return (
    <>
      <PageHeader
        title="Approval Queue"
        description="Đề xuất hành động của AI — chỉ thực thi sau khi bạn duyệt (không tự động chi tiền/đổi trạng thái)"
      />

      {recommendations.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Chưa có đề xuất nào" description='Đề xuất xuất hiện khi AI Insights phát hiện vấn đề cần hành động — xem trang "AI Insights".' />
      ) : (
        <div className="flex flex-col gap-2">
          {recommendations.map((r) => (
            <RecommendationCard
              key={r.id}
              item={{
                id: r.id,
                title: r.title,
                description: r.description,
                status: r.status,
                createdAt: r.createdAt.toISOString(),
                action: r.action
                  ? {
                      status: r.action.status,
                      resultMessage: r.action.resultMessage,
                      approvedBy: r.action.approvedBy,
                      logs: r.action.logs.map((l) => ({ id: l.id, message: l.message, createdAt: l.createdAt.toISOString() })),
                    }
                  : null,
              }}
              canManage={canManage}
              onApprove={approveRecommendationAction}
              onReject={rejectRecommendationAction}
            />
          ))}
        </div>
      )}
    </>
  );
}
