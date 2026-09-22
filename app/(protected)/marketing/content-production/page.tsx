import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Film, Edit3, Send, PenLine } from "lucide-react";
import { requirePermission, hasPermission } from "@/lib/auth/rbac";
import {
  listProductionChannels,
  listProductionCreators,
  listProductionEntries,
  getProductionBoard,
} from "@/services/production/production";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrackerTable } from "@/components/production/tracker-table";
import { KanbanBoard } from "@/components/production/kanban-board";
import { ChannelManageSheet } from "@/components/production/channel-manage-sheet";
import { CreatorManageSheet } from "@/components/production/creator-manage-sheet";
import { PieceDialog } from "@/components/production/piece-dialog";
import { PRODUCTION_TASK_TYPES, mondayOf, addDays, dateKey, parseDateKey } from "@/lib/production/types";
import { listUsers } from "@/services/core/users";
import {
  createChannelAction,
  updateChannelAction,
  deleteChannelAction,
  addCreatorAction,
  removeCreatorAction,
  updateEntryCountAction,
  createPieceAction,
  deletePieceAction,
  movePieceAction,
} from "./actions";

export const metadata: Metadata = { title: "Sản xuất Content — VIMOVE OS" };

const TASK_ICONS = { "Viết KB": PenLine, Quay: Film, Edit: Edit3, Post: Send } as const;

export default async function ContentProductionPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const session = await requirePermission("production.read");
  const canCreate = hasPermission(session, "production.create");
  const canUpdate = hasPermission(session, "production.update");
  const canDelete = hasPermission(session, "production.delete");
  const orgId = session.user.organizationId;

  const { week } = await searchParams;
  const today = new Date();
  const weekStart = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? mondayOf(parseDateKey(week)) : mondayOf(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => dateKey(addDays(weekStart, i)));
  const todayKey = dateKey(today);
  const prevWeekKey = dateKey(addDays(weekStart, -7));
  const nextWeekKey = dateKey(addDays(weekStart, 7));
  const thisWeekKey = dateKey(mondayOf(today));

  const [channels, creators, entries, board, users] = await Promise.all([
    listProductionChannels(orgId),
    listProductionCreators(orgId),
    listProductionEntries(orgId, weekDates[0], weekDates[6]),
    getProductionBoard(orgId),
    listUsers(orgId),
  ]);

  const channelOptions = channels.map((c) => ({ id: c.id, name: c.name }));
  const creatorOptions = creators.map((c) => ({ id: c.user.id, name: c.user.name }));
  const userOptions = users.filter((u) => u.status === "ACTIVE").map((u) => ({ id: u.id, name: u.name }));

  const totalPieces = Object.values(board).reduce((sum, items) => sum + items.length, 0);
  const rangeTotals = Object.fromEntries(
    PRODUCTION_TASK_TYPES.map((t) => [
      t,
      weekDates.reduce((sum, date) => {
        const dayTotal = channels.reduce((chSum, c) => {
          if (!c.taskTypes.includes(t)) return chSum;
          const chTotal = creators.reduce((cSum, creator) => {
            const e = entries.find((en) => en.date === date && en.userId === creator.user.id && en.channelId === c.id);
            return cSum + ((e?.counts as Record<string, number> | undefined)?.[t] ?? 0);
          }, 0);
          return chSum + chTotal;
        }, 0);
        return sum + dayTotal;
      }, 0),
    ])
  ) as Record<string, number>;

  return (
    <>
      <PageHeader
        title="Sản xuất Content"
        description="Bảng đếm tiến độ hằng ngày + kanban cho đội video ngắn — kéo thẻ kanban tự cộng vào bảng đếm"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ChannelManageSheet channels={channels} canManage={canCreate} onCreate={createChannelAction} onUpdate={updateChannelAction} onDelete={deleteChannelAction} />
            <CreatorManageSheet creators={creators} availableUsers={userOptions} canManage={canCreate} onAdd={addCreatorAction} onRemove={removeCreatorAction} />
            {canCreate && <PieceDialog channels={channelOptions} creators={creatorOptions} action={createPieceAction} />}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {PRODUCTION_TASK_TYPES.map((t) => (
          <KpiCard key={t} label={`${t} · tuần này`} value={rangeTotals[t]} icon={TASK_ICONS[t]} tone={rangeTotals[t] > 0 ? "primary" : "muted"} />
        ))}
      </div>

      <Tabs defaultValue="tracker">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="tracker">Theo dõi tiến độ</TabsTrigger>
            <TabsTrigger value="kanban">Kanban ({totalPieces})</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" nativeButton={false} render={<Link href={`?week=${prevWeekKey}`} aria-label="Tuần trước" />}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`?week=${thisWeekKey}`} />}>
              Hôm nay
            </Button>
            <Button variant="outline" size="icon-sm" nativeButton={false} render={<Link href={`?week=${nextWeekKey}`} aria-label="Tuần sau" />}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="tracker" className="mt-4">
          <TrackerTable
            channels={channels.map((c) => ({ id: c.id, name: c.name, taskTypes: c.taskTypes }))}
            creators={creators.map((c) => ({ id: c.id, user: c.user }))}
            entries={entries.map((e) => ({ date: e.date, userId: e.userId, channelId: e.channelId, counts: e.counts as Record<string, number> }))}
            weekDates={weekDates}
            todayKey={todayKey}
            canUpdate={canUpdate}
            canManage={canCreate}
            updateCountAction={updateEntryCountAction}
          />
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard board={board} onMove={movePieceAction} onDelete={deletePieceAction} canDelete={canDelete} />
        </TabsContent>
      </Tabs>
    </>
  );
}
