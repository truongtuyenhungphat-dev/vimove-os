import { NextRequest, NextResponse } from "next/server";
import { handleApifyCallback } from "@/services/channel-tracking/apify";
import { CONFIG_PLATFORMS, type ConfigPlatform } from "@/lib/channel-tracking/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Webhook Apify gọi khi run xong — xác thực bằng secret token + org id trên query string
 * (gắn sẵn vào requestUrl lúc start run, xem startDailyScrape trong services/channel-tracking/apify.ts). */
export async function POST(req: NextRequest) {
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (!secret || req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Sai secret" }, { status: 401 });
  }
  const platform = req.nextUrl.searchParams.get("platform") as ConfigPlatform | null;
  const organizationId = req.nextUrl.searchParams.get("org");
  if (!platform || !CONFIG_PLATFORMS.includes(platform)) return NextResponse.json({ error: "platform không hợp lệ" }, { status: 400 });
  if (!organizationId) return NextResponse.json({ error: "Thiếu org" }, { status: 400 });

  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: "Payload không hợp lệ" }, { status: 400 });

  try {
    const result = await handleApifyCallback(organizationId, platform, payload);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[apify-callback]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi xử lý callback" }, { status: 500 });
  }
}
