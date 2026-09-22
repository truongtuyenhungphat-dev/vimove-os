import "server-only";
import { ApifyClient } from "apify-client";
import { prisma } from "@/lib/db/client";
import { writeAuditLog } from "@/services/core/audit";
import { todayVN } from "@/lib/channel-tracking/types";
import type { ConfigPlatform, Platform } from "@/lib/channel-tracking/types";
import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Pipeline quét dữ liệu qua Apify:
 *  - startDailyScrape(): gom kênh đang theo dõi (ACTIVE), start Actor theo nền tảng (async + webhook)
 *  - handleApifyCallback(): webhook nhận dataset, chuẩn hóa về schema chung, ghi ChannelSnapshot.
 * Chỉ quét dữ liệu công khai, không dùng Actor yêu cầu cookie đăng nhập.
 */
const channelPlatformOf = (cfg: ConfigPlatform): Platform => (cfg === "FACEBOOK_PROFILE" ? "FACEBOOK" : cfg);

export type NormalizedProfile = {
  ref: string;
  followers: number | null;
  totalViews: number | null;
  videosCount: number | null;
  engagement: number | null;
  avatarUrl: string | null;
  postIds?: string[];
  bio: string;
  raw: unknown;
};

function apify(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("Thiếu APIFY_TOKEN");
  return new ApifyClient({ token });
}

export async function startDailyScrape(organizationId: string): Promise<{ started: { platform: string; runId: string; channels: number }[] }> {
  const client = apify();
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const secret = process.env.APIFY_WEBHOOK_SECRET || "";

  const channels = await prisma.trackedChannel.findMany({ where: { organizationId, status: "ACTIVE" } });
  const configs = await prisma.channelPlatformConfig.findMany({ where: { organizationId, isActive: true } });

  const started: { platform: string; runId: string; channels: number }[] = [];
  for (const cfg of configs) {
    const chPlatform = channelPlatformOf(cfg.platform as ConfigPlatform);
    const list = channels.filter((c) => c.platform === chPlatform);
    if (!list.length) continue;

    const tpl = (cfg.inputTemplate ?? {}) as {
      channel_key?: string;
      channel_value?: "username" | "url";
      wrap_url?: boolean;
      extra?: Record<string, unknown>;
    };
    const key = tpl.channel_key || "startUrls";
    const values = list.map((c) => (tpl.channel_value === "username" ? c.username : c.url));
    const input: Record<string, unknown> = {
      ...(tpl.extra ?? {}),
      [key]: tpl.wrap_url ? values.map((url) => ({ url })) : values,
    };

    const run = await client.actor(cfg.apifyActor).start(input, {
      webhooks: [
        {
          eventTypes: ["ACTOR.RUN.SUCCEEDED", "ACTOR.RUN.FAILED", "ACTOR.RUN.TIMED_OUT", "ACTOR.RUN.ABORTED"],
          requestUrl: `${appUrl}/api/channel-tracking/apify-callback?secret=${encodeURIComponent(secret)}&platform=${cfg.platform}&org=${organizationId}`,
        },
      ],
    });
    await prisma.channelScrapeRun.create({
      data: { organizationId, runId: run.id, platform: cfg.platform, actor: cfg.apifyActor, status: "started", channelsCount: list.length },
    });
    started.push({ platform: cfg.platform, runId: run.id, channels: list.length });
  }
  return { started };
}

export async function handleApifyCallback(organizationId: string, platform: ConfigPlatform, payload: Record<string, unknown>): Promise<{ snapshots: number }> {
  const resource = (payload?.resource ?? {}) as Record<string, unknown>;
  const runId = typeof resource.id === "string" ? resource.id : undefined;
  const status = String(resource.status || payload?.eventType || "");
  const datasetId = typeof resource.defaultDatasetId === "string" ? resource.defaultDatasetId : undefined;
  const costUsd = typeof resource.usageTotalUsd === "number" ? resource.usageTotalUsd : null;

  if (runId) {
    await prisma.channelScrapeRun.updateMany({
      where: { organizationId, runId },
      data: { status: status.includes("SUCCEEDED") ? "succeeded" : "failed", costUsd: costUsd ?? undefined, finishedAt: new Date() },
    });
  }
  if (!datasetId || !status.includes("SUCCEEDED")) return { snapshots: 0 };

  const client = apify();
  const { items } = await client.dataset(datasetId).listItems({ limit: 5000 });
  const profiles = normalizeItems(platform, items as Record<string, unknown>[]);

  const chPlatform = channelPlatformOf(platform);
  const channels = await prisma.trackedChannel.findMany({ where: { organizationId, platform: chPlatform, status: "ACTIVE" } });

  const date = todayVN();
  let snapCount = 0;

  for (const ch of channels) {
    const uname = ch.username.toLowerCase();
    const prof = profiles.find((p) => {
      const r = p.ref.toLowerCase();
      return r === uname || r === `@${uname}` || r.includes(uname);
    });
    if (!prof) continue;

    if (ch.baselineFollowers == null && prof.followers != null) {
      await prisma.trackedChannel.update({ where: { id: ch.id }, data: { baselineFollowers: prof.followers, baselineViews: prof.totalViews } });
    }
    if (prof.avatarUrl) {
      await prisma.trackedChannel.update({ where: { id: ch.id }, data: { avatarUrl: prof.avatarUrl } });
    }

    // Facebook: Actor chỉ trả resultsLimit bài mới nhất mỗi lần -> cộng dồn id bài viết
    // qua từng ngày (không đếm trùng) để ra tổng lũy kế thật.
    let videosCount = prof.videosCount;
    if (platform === "FACEBOOK" && prof.postIds?.length) {
      const existingIds = ch.postIds ?? [];
      const merged = Array.from(new Set([...existingIds, ...prof.postIds]));
      if (merged.length !== existingIds.length) {
        await prisma.trackedChannel.update({ where: { id: ch.id }, data: { postIds: merged } });
      }
      videosCount = merged.length;
    }

    // Chỉ đưa vào patch những field Actor này THỰC SỰ trả về — field không có mặt thì
    // giữ nguyên giá trị cũ (Prisma update() chỉ ghi đúng field được liệt kê). Bắt buộc
    // làm vậy (không đọc-rồi-ghi) vì facebook + facebook_profile có thể trả webhook gần
    // như đồng thời — đọc-rồi-ghi sẽ dính race condition, callback chạy sau ghi đè mất
    // dữ liệu callback kia vừa lưu.
    const patch: Prisma.ChannelSnapshotUpdateInput = { scrapeStatus: "ok", raw: { [platform]: prof.raw } as Prisma.InputJsonValue };
    if (prof.followers != null) patch.followers = prof.followers;
    if (prof.totalViews != null) patch.totalViews = prof.totalViews;
    if (videosCount != null) patch.videosCount = videosCount;
    if (prof.engagement != null) patch.engagement = prof.engagement;

    await prisma.channelSnapshot.upsert({
      where: { channelId_date: { channelId: ch.id, date } },
      create: {
        organizationId,
        channelId: ch.id,
        date,
        scrapeStatus: "ok",
        raw: { [platform]: prof.raw } as Prisma.InputJsonValue,
        followers: prof.followers ?? undefined,
        totalViews: prof.totalViews ?? undefined,
        videosCount: videosCount ?? undefined,
        engagement: prof.engagement ?? undefined,
      },
      update: patch,
    });
    snapCount++;
  }
  return { snapshots: snapCount };
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Chuẩn hóa dataset Apify (mỗi Actor một cấu trúc) về schema chung. Best-effort với nhiều fallback. */
export function normalizeItems(platform: ConfigPlatform, items: Record<string, unknown>[]): NormalizedProfile[] {
  if (platform === "FACEBOOK_PROFILE") {
    // apify/facebook-pages-scraper: item = 1 trang, có sẵn "followers" — không có dữ liệu bài viết.
    return items
      .map((it) => {
        const aliasParts = [it.pageName, it.pageId, it.facebookId, it.facebookUrl, it.pageUrl]
          .filter(Boolean)
          .map((v) => {
            try {
              return decodeURIComponent(String(v)).toLowerCase();
            } catch {
              return String(v).toLowerCase();
            }
          });
        if (!aliasParts.length) return null;
        const profile: NormalizedProfile = {
          ref: aliasParts.join(" | "),
          followers: num(it.followers),
          totalViews: null,
          videosCount: null,
          engagement: null,
          avatarUrl: it.profilePictureUrl ? String(it.profilePictureUrl) : null,
          bio: String(it.intro ?? ""),
          raw: { pageId: it.pageId, followers: it.followers, likes: it.likes },
        };
        return profile;
      })
      .filter((p): p is NormalizedProfile => p !== null);
  }

  if (platform === "TIKTOK") {
    // clockworks/tiktok-scraper: item = video, kèm authorMeta {name, fans, heart, video, signature}
    const byAuthor = new Map<string, { meta: Record<string, unknown>; videos: Record<string, unknown>[] }>();
    for (const it of items) {
      const meta = (it.authorMeta ?? it.author ?? null) as Record<string, unknown> | null;
      const name = String(meta?.name ?? meta?.uniqueId ?? it.input ?? "").toLowerCase();
      if (!name) continue;
      if (!byAuthor.has(name)) byAuthor.set(name, { meta: meta ?? {}, videos: [] });
      byAuthor.get(name)!.videos.push(it);
    }
    return Array.from(byAuthor.entries()).map(([name, g]) => {
      const m = g.meta;
      const engagement = g.videos.reduce((s, v) => s + (num(v.diggCount) ?? 0) + (num(v.shareCount) ?? 0) + (num(v.commentCount) ?? 0), 0);
      const views = g.videos.reduce((s, v) => s + (num(v.playCount) ?? 0), 0);
      return {
        ref: name,
        followers: num(m.fans) ?? num(m.followers),
        totalViews: num(m.heart) != null ? num(m.heart) : views,
        videosCount: num(m.video) ?? g.videos.length,
        engagement,
        avatarUrl: String(m.avatar ?? m.avatarLarger ?? m.avatarMedium ?? m.avatarThumb ?? "") || null,
        bio: String(m.signature ?? ""),
        raw: { authorMeta: m, sampleVideos: g.videos.slice(0, 3) },
      };
    });
  }

  if (platform === "YOUTUBE") {
    // streamers/youtube-scraper: item theo video/kênh với channel* fields
    const byChannel = new Map<string, Record<string, unknown>[]>();
    for (const it of items) {
      const about = (it.aboutChannelInfo ?? {}) as Record<string, unknown>;
      const ref = String(it.channelUsername ?? it.channelName ?? it.channelUrl ?? about.channelName ?? "")
        .toLowerCase()
        .replace(/^@/, "");
      if (!ref) continue;
      if (!byChannel.has(ref)) byChannel.set(ref, []);
      byChannel.get(ref)!.push(it);
    }
    return Array.from(byChannel.entries()).map(([ref, list]) => {
      const first = list[0] ?? {};
      const about = (first.aboutChannelInfo ?? first) as Record<string, unknown>;
      return {
        ref,
        followers: num(about.numberOfSubscribers) ?? num(first.numberOfSubscribers) ?? num(first.subscriberCount),
        totalViews: num(about.channelTotalViews) ?? list.reduce((s, v) => s + (num(v.viewCount) ?? 0), 0),
        videosCount: num(about.channelTotalVideos) ?? list.length,
        engagement: list.reduce((s, v) => s + (num(v.likes) ?? 0) + (num(v.commentsCount) ?? 0), 0),
        avatarUrl: String(about.channelAvatar ?? about.avatar ?? first.channelAvatar ?? "") || null,
        bio: String(about.channelDescription ?? first.channelDescription ?? ""),
        raw: { about, sample: list.slice(0, 3) },
      };
    });
  }

  if (platform === "INSTAGRAM") {
    // apify/instagram-scraper (resultsType: details): item = profile
    return items
      .filter((it) => it.username)
      .map((it) => ({
        ref: String(it.username).toLowerCase(),
        followers: num(it.followersCount),
        totalViews: null,
        videosCount: num(it.postsCount),
        engagement: ((it.latestPosts ?? []) as Record<string, unknown>[]).reduce((s, p) => s + (num(p.likesCount) ?? 0) + (num(p.commentsCount) ?? 0), 0),
        avatarUrl: String(it.profilePicUrlHD ?? it.profilePicUrl ?? "") || null,
        bio: String(it.biography ?? ""),
        raw: { profile: { ...it, latestPosts: undefined } },
      }));
  }

  // FACEBOOK: apify/facebook-posts-scraper — item = post kèm thông tin trang.
  // pageName trả về đã encode, không phải ID số trong URL khi kênh thêm bằng link
  // dạng facebook.com/<số-id> — nên nhóm theo inputUrl (URL đã gửi lên Actor, luôn
  // trùng TrackedChannel.url) để nhận diện đúng trang, rồi ghép thêm alias khác.
  const byPage = new Map<string, Record<string, unknown>[]>();
  for (const it of items) {
    const groupKey = String(it.inputUrl ?? it.facebookUrl ?? it.pageName ?? "").toLowerCase();
    if (!groupKey) continue;
    if (!byPage.has(groupKey)) byPage.set(groupKey, []);
    byPage.get(groupKey)!.push(it);
  }
  return Array.from(byPage.entries()).map(([groupKey, list]) => {
    const first = (list[0] ?? {}) as Record<string, unknown>;
    const user = (first.user ?? {}) as Record<string, unknown>;
    const aliasParts = [first.pageName, user.id, first.facebookUrl, first.inputUrl, groupKey]
      .filter(Boolean)
      .map((v) => {
        try {
          return decodeURIComponent(String(v)).toLowerCase();
        } catch {
          return String(v).toLowerCase();
        }
      });
    return {
      ref: aliasParts.join(" | "),
      followers: num(first.pageFollowers) ?? num(first.followers), // Actor này không trả follower — luôn null
      totalViews: list.reduce((s, p) => s + (num(p.viewsCount) ?? num(p.videoPostViewCount) ?? 0), 0) || null,
      // Actor chỉ trả về resultsLimit bài mới nhất mỗi lần — videosCount ở đây CHỈ là số
      // bài quét được lần này; handleApifyCallback() cộng dồn postIds qua từng ngày.
      videosCount: list.length,
      postIds: list.map((p) => String(p.postId ?? p.facebookId ?? "")).filter(Boolean),
      engagement: list.reduce((s, p) => s + (num(p.likes) ?? 0) + (num(p.shares) ?? 0) + (num(p.comments) ?? 0), 0),
      avatarUrl: null, // Actor bài viết không đáng tin cho ảnh trang — dùng FACEBOOK_PROFILE
      bio: String(first.pageIntro ?? first.pageAbout ?? ""),
      raw: { sample: list.slice(0, 3) },
    };
  });
}

/** Trạng thái kết nối Apify + cấu hình Actor + nhật ký run + chi phí + cảnh báo kênh
 * chưa quét được hôm nay — dùng cho tab "Quét & Apify". */
export async function getScrapeStatus(organizationId: string) {
  const today = todayVN();

  const configs = await prisma.channelPlatformConfig.findMany({ where: { organizationId }, orderBy: { platform: "asc" } });
  const runs = await prisma.channelScrapeRun.findMany({ where: { organizationId }, orderBy: { startedAt: "desc" }, take: 20 });

  const costRows = await prisma.channelScrapeRun.findMany({
    where: { organizationId, startedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
    select: { costUsd: true, startedAt: true },
  });
  let costToday = 0;
  let cost30d = 0;
  for (const r of costRows) {
    const c = r.costUsd ?? 0;
    cost30d += c;
    if (r.startedAt.toISOString().slice(0, 10) === today) costToday += c;
  }

  const channels = await prisma.trackedChannel.findMany({
    where: { organizationId, status: "ACTIVE" },
    select: { id: true, platform: true, username: true, label: true },
  });
  const todaySnaps = await prisma.channelSnapshot.findMany({ where: { organizationId, date: today }, select: { channelId: true } });
  const scanned = new Set(todaySnaps.map((s) => s.channelId));
  const notScanned = channels.filter((c) => !scanned.has(c.id)).slice(0, 50);

  return {
    tokenSet: Boolean(process.env.APIFY_TOKEN),
    webhookSecretSet: Boolean(process.env.APIFY_WEBHOOK_SECRET),
    appUrl: process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000",
    today,
    configs,
    runs,
    cost: { today: costToday, last30d: cost30d },
    channelsTotal: channels.length,
    channelsScannedToday: scanned.size,
    notScanned,
  };
}

export async function updatePlatformConfig(organizationId: string, actorId: string, data: { platform: ConfigPlatform; apifyActor?: string; isActive?: boolean }) {
  const existing = await prisma.channelPlatformConfig.findUnique({ where: { organizationId_platform: { organizationId, platform: data.platform } } });
  const patch: { apifyActor?: string; isActive?: boolean } = {};
  if (data.apifyActor !== undefined) patch.apifyActor = data.apifyActor;
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  if (existing) {
    await prisma.channelPlatformConfig.update({ where: { id: existing.id }, data: patch });
  } else {
    if (!patch.apifyActor) throw new Error("Nền tảng chưa có cấu hình — cần nhập Actor");
    await prisma.channelPlatformConfig.create({ data: { organizationId, platform: data.platform, apifyActor: patch.apifyActor, isActive: patch.isActive ?? true } });
  }
  await writeAuditLog({ organizationId, actorId, action: "channel_platform_config.update", entityType: "ChannelPlatformConfig", entityId: data.platform });
}
