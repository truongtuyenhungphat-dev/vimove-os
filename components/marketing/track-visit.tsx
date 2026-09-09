"use client";

import { useEffect } from "react";

/** Bắn 1 lần khi trang landing page công khai được mở — ghi touchpoint UTM thật qua
 * Route Handler (route mới ghi cookie visitorId được, Server Component thì không). */
export function TrackVisit({ landingPageId }: { landingPageId: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    fetch("/api/lp/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landingPageId,
        utmSource: params.get("utm_source") ?? undefined,
        utmMedium: params.get("utm_medium") ?? undefined,
        utmCampaign: params.get("utm_campaign") ?? undefined,
        utmContent: params.get("utm_content") ?? undefined,
        utmTerm: params.get("utm_term") ?? undefined,
      }),
    }).catch(() => {
      // Bỏ qua lỗi mạng — không chặn trải nghiệm khách truy cập vì 1 request tracking.
    });
  }, [landingPageId]);

  return null;
}
