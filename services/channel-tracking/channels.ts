import "server-only";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { normalizeChannel, todayVN, addDaysStr, type Platform, type TrackedChannelStatus } from "@/lib/channel-tracking/types";

export type Snapshot = {
  date: string;
  followers: number | null;
  totalViews: number | null;
  videosCount: number | null;
  engagement: number | null;
  scrapeStatus: string;
};

export type ChannelDelta = {
  latest: Snapshot | null;
  followersDelta: number | null;
  viewsDelta: number | null;
  engagementDelta: number | null;
  scannedToday: boolean;
  spanDays: number | null;
};

/** Từ danh sách snapshot của 1 kênh, lấy snapshot mới nhất và mức tăng follower/view/
 * tương tác so với `days` ngày trước. Kênh mới theo dõi chưa đủ lịch sử thì tự lùi về
 * mốc cũ nhất đang có — `spanDays` cho biết khoảng cách thực tế đó. Lưu ý: engagement
 * mỗi snapshot chỉ là tương tác của các bài/video quét được HÔM ĐÓ (không phải lũy kế
 * toàn kênh — xem normalizeItems), nên delta này phản ánh xu hướng tương tác gần đây
 * tăng/giảm, không phải "tổng tương tác tăng thêm". */
export function computeDelta(snapshots: Snapshot[], today: string, days: number): ChannelDelta {
  const byDate = new Map(snapshots.map((s) => [s.date, s]));
  const sorted = [...snapshots].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = sorted[0] ?? null;

  const cutoff = addDaysStr(today, -days);
  let older = sorted.find((s) => s.date <= cutoff) ?? null;
  if (!older && sorted.length > 1) older = sorted[sorted.length - 1];

  let followersDelta: number | null = null;
  let viewsDelta: number | null = null;
  let engagementDelta: number | null = null;
  let spanDays: number | null = null;
  if (latest && older && latest.date !== older.date) {
    if (latest.followers != null && older.followers != null) followersDelta = latest.followers - older.followers;
    if (latest.totalViews != null && older.totalViews != null) viewsDelta = latest.totalViews - older.totalViews;
    if (latest.engagement != null && older.engagement != null) engagementDelta = latest.engagement - older.engagement;
    const a = new Date(`${older.date}T00:00:00Z`).getTime();
    const b = new Date(`${latest.date}T00:00:00Z`).getTime();
    spanDays = Math.round((b - a) / 86_400_000);
  }

  return { latest, followersDelta, viewsDelta, engagementDelta, scannedToday: byDate.get(today)?.scrapeStatus === "ok", spanDays };
}

/** Chuỗi follower theo ngày (tăng dần), bỏ ngày thiếu số liệu — dùng vẽ sparkline. */
export function followersSeries(snapshots: Snapshot[]): number[] {
  return [...snapshots]
    .filter((s) => s.followers != null)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => s.followers as number);
}

function toSnapshot(s: { date: string; followers: number | null; totalViews: number | null; videosCount: number | null; engagement: number | null; scrapeStatus: string }): Snapshot {
  return s;
}

export type ChannelRow = Awaited<ReturnType<typeof listTrackedChannels>>[number];

/** Danh sách kênh theo dõi kèm chỉ số mới nhất + delta 7/30 ngày. */
export async function listTrackedChannels(organizationId: string, opts: { showRemoved?: boolean } = {}) {
  const channels = await prisma.trackedChannel.findMany({
    where: { organizationId, ...(opts.showRemoved ? {} : { status: { not: "REMOVED" } }) },
    orderBy: { createdAt: "desc" },
  });

  const today = todayVN();
  const ids = channels.map((c) => c.id);
  const snapByChannel = new Map<string, Snapshot[]>();
  if (ids.length) {
    const snaps = await prisma.channelSnapshot.findMany({
      where: { channelId: { in: ids }, date: { gte: addDaysStr(today, -30) } },
      select: { channelId: true, date: true, followers: true, totalViews: true, videosCount: true, engagement: true, scrapeStatus: true },
    });
    for (const s of snaps) {
      if (!snapByChannel.has(s.channelId)) snapByChannel.set(s.channelId, []);
      snapByChannel.get(s.channelId)!.push(toSnapshot(s));
    }
  }

  return channels.map((c) => {
    const snaps = snapByChannel.get(c.id) ?? [];
    const d7 = computeDelta(snaps, today, 7);
    const d30 = computeDelta(snaps, today, 30);
    return {
      id: c.id,
      platform: c.platform,
      url: c.url,
      username: c.username,
      label: c.label,
      status: c.status,
      avatarUrl: c.avatarUrl,
      baselineFollowers: c.baselineFollowers,
      baselineViews: c.baselineViews,
      createdAt: c.createdAt,
      followers: d7.latest?.followers ?? null,
      totalViews: d7.latest?.totalViews ?? null,
      videosCount: d7.latest?.videosCount ?? null,
      engagement: d7.latest?.engagement ?? null,
      lastSnapshotDate: d7.latest?.date ?? null,
      scannedToday: d7.scannedToday,
      followersDelta7d: d7.followersDelta,
      viewsDelta7d: d7.viewsDelta,
      engagementDelta7d: d7.engagementDelta,
      followersDelta7dSpan: d7.spanDays,
      followersDelta30d: d30.followersDelta,
      viewsDelta30d: d30.viewsDelta,
      engagementDelta30d: d30.engagementDelta,
      followersDelta30dSpan: d30.spanDays,
      followersSeries: followersSeries(snaps).slice(-14),
    };
  });
}

export async function getChannelHistory(organizationId: string, id: string, days: number) {
  const channel = await prisma.trackedChannel.findFirst({ where: { id, organizationId } });
  if (!channel) throw new Error("Không tìm thấy kênh");

  const snapshots = await prisma.channelSnapshot.findMany({
    where: { channelId: id, date: { gte: addDaysStr(todayVN(), -days) } },
    select: { date: true, followers: true, totalViews: true, videosCount: true, engagement: true, scrapeStatus: true },
    orderBy: { date: "desc" },
  });
  return { channel, snapshots };
}

export async function createTrackedChannel(organizationId: string, actorId: string, data: { platform: string; url: string; label?: string | null }) {
  const normalized = normalizeChannel(data.platform, data.url);
  const label = data.label?.trim().slice(0, 200) || null;

  const existing = await prisma.trackedChannel.findUnique({
    where: { organizationId_platform_username: { organizationId, platform: normalized.platform, username: normalized.username } },
  });
  if (existing) throw new Error("Kênh này đã có trong danh sách theo dõi");

  const channel = await prisma.trackedChannel.create({
    data: { organizationId, platform: normalized.platform, url: normalized.url, username: normalized.username, label },
  });
  await writeAuditLog({ organizationId, actorId, action: "tracked_channel.create", entityType: "TrackedChannel", entityId: channel.id, after: { username: channel.username } });
  return channel;
}

export async function updateTrackedChannel(
  organizationId: string,
  actorId: string,
  id: string,
  data: { label?: string | null; status?: TrackedChannelStatus; url?: string }
) {
  const before = await prisma.trackedChannel.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy kênh");

  const patch: { label?: string | null; status?: TrackedChannelStatus; url?: string; username?: string } = {};
  if (data.label !== undefined) patch.label = data.label?.trim().slice(0, 200) || null;
  if (data.status !== undefined) patch.status = data.status;
  if (data.url !== undefined) {
    const normalized = normalizeChannel(before.platform as Platform, data.url);
    patch.url = normalized.url;
    patch.username = normalized.username;
  }

  const updated = await prisma.trackedChannel.update({ where: { id }, data: patch });
  await writeAuditLog({
    organizationId,
    actorId,
    action: "tracked_channel.update",
    entityType: "TrackedChannel",
    entityId: id,
    before: { status: before.status, label: before.label },
    after: { status: updated.status, label: updated.label },
  });
  return updated;
}

/** Gỡ khỏi danh sách theo dõi (soft-remove, giữ lại lịch sử snapshot). */
export async function removeTrackedChannel(organizationId: string, actorId: string, id: string) {
  const before = await prisma.trackedChannel.findFirst({ where: { id, organizationId } });
  if (!before) throw new Error("Không tìm thấy kênh");
  await prisma.trackedChannel.update({ where: { id }, data: { status: "REMOVED" } });
  await writeAuditLog({ organizationId, actorId, action: "tracked_channel.remove", entityType: "TrackedChannel", entityId: id, before: { username: before.username } });
}
