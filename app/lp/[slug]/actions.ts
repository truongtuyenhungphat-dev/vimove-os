"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { submitForm } from "@/services/marketing/landing-pages";
import { recordConversionEvent } from "@/services/analytics/attribution";

// Server Action công khai — KHÔNG gọi assertPermission/requireSession (route /lp là
// public, khách vãng lai chưa đăng nhập vẫn submit được, đúng bản chất form thu lead).
const submitSchema = z.object({
  landingFormId: z.string().min(1),
  data: z.record(z.string(), z.string()),
});

const VISITOR_COOKIE = "vimove_visitor_id";

export async function submitLandingFormAction(landingFormId: string, data: Record<string, string>) {
  const parsed = submitSchema.parse({ landingFormId, data });
  const { submission, organizationId } = await submitForm(parsed.landingFormId, parsed.data);

  // Gán first-touch/last-touch cho submission này dựa trên lịch sử touchpoint thật
  // của visitorId (cookie ghi bởi /api/lp/track khi khách mở trang) — idempotencyKey
  // = id submission nên gọi lại (double-submit) không tính trùng conversion.
  const visitorId = (await cookies()).get(VISITOR_COOKIE)?.value;
  if (visitorId) {
    await recordConversionEvent({
      organizationId,
      visitorId,
      type: "FORM_SUBMISSION",
      entityType: "FormSubmission",
      entityId: submission.id,
      idempotencyKey: submission.id,
    });
  }
}
