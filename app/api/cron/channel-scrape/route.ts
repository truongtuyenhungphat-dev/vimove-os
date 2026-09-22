import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { startDailyScrape } from "@/services/channel-tracking/apify";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Xác thực request cron bằng CRON_SECRET (header Bearer của Vercel Cron hoặc ?secret=). */
function checkCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return req.nextUrl.searchParams.get("secret") === secret;
}

/** Cron 05:30 giờ VN (22:30 UTC, xem vercel.json) — khởi chạy các Apify run quét kênh. */
async function handle(req: NextRequest) {
  if (!checkCronSecret(req)) return NextResponse.json({ error: "Sai CRON_SECRET" }, { status: 401 });

  const organization = await prisma.organization.findUnique({ where: { slug: "vimove" } });
  if (!organization) return NextResponse.json({ error: "Không tìm thấy tổ chức" }, { status: 500 });

  try {
    const result = await startDailyScrape(organization.id);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/channel-scrape]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Lỗi khởi chạy quét" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
