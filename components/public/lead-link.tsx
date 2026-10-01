"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackLeadEvent, type LeadEventContext } from "./lead-tracking";

type LeadLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & LeadEventContext;

/** Thẻ <a> thường, chỉ gắn thêm sự kiện "Lead" (Meta/TikTok/GA4, xem lead-tracking.ts)
 * trước khi điều hướng — dùng cho MỌI CTA gọi điện (tel:)/Zalo trên site công khai nằm
 * trong các Server Component (topbar, footer, trang liên hệ...) để không phải chuyển
 * cả component cha sang Client Component chỉ vì 1 onClick. */
export function LeadLink({ contentName, contentIds, onClick, ...props }: LeadLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackLeadEvent({ contentName, contentIds });
        onClick?.(event);
      }}
    />
  );
}
