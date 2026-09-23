import type { Metadata } from "next";
import { requirePermission, hasPermission, buildVisibilityScope } from "@/lib/auth/rbac";
import {
  ensureTodayFixedItems,
  listDailyReport,
  listMonthlyRollup,
  listRecurringTemplates,
  listDistinctRoleTitles,
} from "@/services/work/daily-reports";
import { getUser } from "@/services/core/users";
import { todayVN, isWorkingDay, daysInMonth } from "@/lib/work/daily-report-types";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TodayReportPanel } from "@/components/work/daily-report/today-panel";
import { MonthlyRollupPanel } from "@/components/work/daily-report/monthly-rollup-panel";
import { TemplatesPanel } from "@/components/work/daily-report/templates-panel";
import { addAdhocItemAction, updateReportItemAction, createTemplateAction, updateTemplateAction, deleteTemplateAction } from "./actions";

export const metadata: Metadata = { title: "Báo cáo công việc — VIMOVE OS" };

export default async function DailyReportPage() {
  const session = await requirePermission("daily_reports.read");
  const canUpdate = hasPermission(session, "daily_reports.update");
  const canManageTemplates = hasPermission(session, "daily_reports.manage_templates");
  const orgId = session.user.organizationId;
  const userId = session.user.id;
  const today = todayVN();

  const me = await getUser(orgId, userId);
  if (canUpdate) {
    await ensureTodayFixedItems(orgId, userId, me?.title ?? null, today);
  }
  const { items, assignedTasks } = await listDailyReport(orgId, userId, today);

  const visibility = buildVisibilityScope(session, "daily_reports.read");
  const showRollup = visibility.scope !== "OWN";

  const [year, month] = today.split("-").map(Number);
  const monthWorkingDays = daysInMonth(year, month).filter(isWorkingDay);
  const rollup = showRollup ? await listMonthlyRollup(orgId, monthWorkingDays, visibility) : null;

  const templates = canManageTemplates ? await listRecurringTemplates(orgId) : [];
  const roleTitles = canManageTemplates ? await listDistinctRoleTitles(orgId) : [];

  return (
    <>
      <PageHeader
        title="Báo cáo công việc"
        description="Việc cố định theo vai trò, việc phát sinh, và việc được giao — cập nhật mỗi ngày làm việc"
      />
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Hôm nay</TabsTrigger>
          {showRollup && <TabsTrigger value="rollup">Tổng hợp</TabsTrigger>}
          {canManageTemplates && <TabsTrigger value="templates">Mẫu việc</TabsTrigger>}
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <TodayReportPanel
            date={today}
            items={items}
            assignedTasks={assignedTasks}
            canUpdate={canUpdate}
            addAction={addAdhocItemAction}
            updateAction={updateReportItemAction}
          />
        </TabsContent>

        {showRollup && rollup && (
          <TabsContent value="rollup" className="mt-4">
            <MonthlyRollupPanel workingDays={rollup.workingDays} rows={rollup.rows} />
          </TabsContent>
        )}

        {canManageTemplates && (
          <TabsContent value="templates" className="mt-4">
            <TemplatesPanel
              templates={templates}
              roleTitles={roleTitles}
              createAction={createTemplateAction}
              updateAction={updateTemplateAction}
              deleteAction={deleteTemplateAction}
            />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
