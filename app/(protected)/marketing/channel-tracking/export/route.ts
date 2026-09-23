import ExcelJS from "exceljs";
import { requirePermission } from "@/lib/auth/rbac";
import { listTrackedChannels } from "@/services/channel-tracking/channels";
import { PLATFORM_LABEL, todayVN, viewsMetricLabel, type Platform } from "@/lib/channel-tracking/types";

export const dynamic = "force-dynamic";

/** Xuất Excel danh sách kênh đang theo dõi kèm chỉ số mới nhất + tăng trưởng 7 ngày. */
export async function GET() {
  const session = await requirePermission("channel_tracking.read");
  const today = todayVN();
  const channels = await listTrackedChannels(session.user.organizationId);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Kênh theo dõi");
  ws.columns = [
    { header: "Nền tảng", key: "platform", width: 12 },
    { header: "Username", key: "username", width: 22 },
    { header: "Ghi chú", key: "label", width: 24 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Follower", key: "followers", width: 14 },
    { header: "View/Thích", key: "views", width: 14 },
    { header: "Loại chỉ số", key: "viewsType", width: 14 },
    { header: "Số video", key: "videos", width: 12 },
    { header: "Tương tác", key: "engagement", width: 14 },
    { header: "Follower tăng (7 ngày)", key: "f7", width: 20 },
    { header: "View/Thích tăng (7 ngày)", key: "v7", width: 20 },
    { header: "Tương tác tăng (7 ngày)", key: "e7", width: 20 },
    { header: "Cập nhật gần nhất", key: "date", width: 16 },
  ];
  ws.getRow(1).font = { bold: true };

  for (const c of channels) {
    ws.addRow({
      platform: PLATFORM_LABEL[c.platform as Platform],
      username: `@${c.username}`,
      label: c.label ?? "",
      status: c.status,
      followers: c.followers ?? "",
      views: c.totalViews ?? "",
      viewsType: viewsMetricLabel(c.platform as Platform),
      videos: c.videosCount ?? "",
      engagement: c.engagement ?? "",
      f7: c.followersDelta7d ?? "",
      v7: c.viewsDelta7d ?? "",
      e7: c.engagementDelta7d ?? "",
      date: c.lastSnapshotDate ?? "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="kenh-theo-doi-${today}.xlsx"`,
    },
  });
}
