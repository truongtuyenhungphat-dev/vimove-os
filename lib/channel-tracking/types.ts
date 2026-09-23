// Theo dõi kênh (Phase 18) — di trú từ app Supabase riêng "vimove-channels".

export const PLATFORMS = ["TIKTOK", "YOUTUBE", "FACEBOOK", "INSTAGRAM"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** "FACEBOOK_PROFILE" là platform ảo trong ChannelPlatformConfig (không phải giá trị
 * TrackedChannel.platform nào) — Actor quét bài Facebook không trả follower, nên chạy
 * thêm 1 Actor thứ 2 chuyên lấy thông tin trang, kết quả gộp bổ sung vào snapshot chung. */
export type ConfigPlatform = Platform | "FACEBOOK_PROFILE";
export const CONFIG_PLATFORMS: ConfigPlatform[] = [...PLATFORMS, "FACEBOOK_PROFILE"];

export const PLATFORM_LABEL: Record<ConfigPlatform, string> = {
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  FACEBOOK_PROFILE: "Facebook (trang)",
};

/** TikTok không công khai API trả tổng view trọn đời của kênh — cột `totalViews`
 * cho TikTok thực chất chứa tổng lượt thích cộng dồn (field `heart` của Apify),
 * KHÔNG phải view thật. Nhãn hiển thị phải phản ánh đúng bản chất này để không gây
 * hiểu nhầm (khác Facebook/YouTube, nơi field này đúng là view thật). */
export function isLikesProxyMetric(platform: Platform): boolean {
  return platform === "TIKTOK";
}
export function viewsMetricLabel(platform: Platform): string {
  return isLikesProxyMetric(platform) ? "Tổng lượt thích" : "Tổng view";
}
export function viewsMetricShortLabel(platform: Platform): string {
  return isLikesProxyMetric(platform) ? "Lượt thích" : "View";
}

/** Facebook không có API công khai trả "tổng số video trọn đời" của trang — cột
 * `videosCount` cho Facebook là số VIDEO (đã lọc khỏi ảnh/status/link) cộng dồn từ
 * các lần quét (Actor chỉ trả resultsLimit bài mới nhất/lần), nên là mức SÀN, có
 * thể thấp hơn tổng thật nếu trang có video cũ hơn phạm vi đã quét được. */
export function isPartialVideoMetric(platform: Platform): boolean {
  return platform === "FACEBOOK";
}

export const TRACKED_CHANNEL_STATUSES = ["ACTIVE", "PAUSED", "REMOVED"] as const;
export type TrackedChannelStatus = (typeof TRACKED_CHANNEL_STATUSES)[number];
export const TRACKED_CHANNEL_STATUS_LABELS: Record<TrackedChannelStatus, string> = {
  ACTIVE: "Đang theo dõi",
  PAUSED: "Tạm dừng",
  REMOVED: "Đã gỡ",
};

const HOST_WHITELIST: Record<Platform, string[]> = {
  TIKTOK: ["tiktok.com", "www.tiktok.com", "vt.tiktok.com"],
  YOUTUBE: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  FACEBOOK: ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"],
  INSTAGRAM: ["instagram.com", "www.instagram.com"],
};

export type NormalizedChannel = { platform: Platform; url: string; username: string };

export function canonicalUrl(platform: Platform, username: string): string {
  switch (platform) {
    case "TIKTOK":
      return `https://www.tiktok.com/@${username}`;
    case "YOUTUBE":
      return `https://www.youtube.com/@${username}`;
    case "FACEBOOK":
      return `https://www.facebook.com/${username}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/${username}`;
  }
}

/** Chuẩn hóa link kênh, ném Error với thông báo tiếng Việt nếu không hợp lệ. Chấp
 * nhận cả dạng thiếu protocol (tiktok.com/@abc) và dạng chỉ gõ @username. */
export function normalizeChannel(platformInput: string, rawUrl: string): NormalizedChannel {
  const p = platformInput.toUpperCase() as Platform;
  if (!PLATFORMS.includes(p)) throw new Error(`Nền tảng không hỗ trợ: ${platformInput}`);

  let input = rawUrl.trim();
  if (!input) throw new Error("Link kênh trống");

  if (/^@[\w.-]+$/.test(input)) {
    const uname = input.slice(1).toLowerCase();
    return { platform: p, username: uname, url: canonicalUrl(p, uname) };
  }

  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    throw new Error(`Link kênh không hợp lệ: ${rawUrl}`);
  }
  if (!HOST_WHITELIST[p].includes(u.hostname.toLowerCase())) {
    throw new Error(`Link không phải kênh ${PLATFORM_LABEL[p]}: ${rawUrl}`);
  }

  const segs = u.pathname.split("/").filter(Boolean);
  let username = "";
  if (p === "TIKTOK") {
    const seg = segs.find((s) => s.startsWith("@"));
    username = (seg || segs[0] || "").replace(/^@/, "");
  } else if (p === "YOUTUBE") {
    if (segs[0]?.startsWith("@")) username = segs[0].slice(1);
    else if (["c", "channel", "user"].includes(segs[0] || "")) username = segs[1] || "";
    else username = segs[0] || "";
  } else {
    username = (segs[0] || "").replace(/^@/, "");
    if (p === "FACEBOOK" && username === "profile.php") {
      username = u.searchParams.get("id") || "";
    }
  }
  username = username.toLowerCase().replace(/[?#].*$/, "");
  if (!username) throw new Error(`Không bóc được username từ link: ${rawUrl}`);
  return { platform: p, username, url: canonicalUrl(p, username) };
}

/** Ngày hiện tại theo giờ VN, dạng "YYYY-MM-DD" — khớp cột `date`/`snapshotDate`. */
export function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
}

export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Math.round(n).toLocaleString("vi-VN");
}
