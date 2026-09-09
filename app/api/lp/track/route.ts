import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { recordTouchpoint } from "@/services/analytics/attribution";

// Route Handler công khai (không kiểm tra RBAC) — beacon gọi từ trang landing page
// công khai để ghi touchpoint UTM thật. Route Handler (khác Server Component) được
// phép set cookie, nên visitorId ẩn danh được tạo/đọc ở đây, không phải ở page.tsx.
const VISITOR_COOKIE = "vimove_visitor_id";

const bodySchema = z.object({
  landingPageId: z.string().min(1),
  utmSource: z.string().trim().optional(),
  utmMedium: z.string().trim().optional(),
  utmCampaign: z.string().trim().optional(),
  utmContent: z.string().trim().optional(),
  utmTerm: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const body = bodySchema.parse(await request.json());

  const landingPage = await prisma.landingPage.findUnique({ where: { id: body.landingPageId }, select: { organizationId: true } });
  if (!landingPage) return NextResponse.json({ ok: false }, { status: 404 });

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  if (!visitorId) visitorId = randomUUID();

  await recordTouchpoint(landingPage.organizationId, visitorId, body.landingPageId, {
    utmSource: body.utmSource,
    utmMedium: body.utmMedium,
    utmCampaign: body.utmCampaign,
    utmContent: body.utmContent,
    utmTerm: body.utmTerm,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(VISITOR_COOKIE, visitorId, { maxAge: 60 * 60 * 24 * 90, httpOnly: false, sameSite: "lax" });
  return response;
}
