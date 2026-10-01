import Script from "next/script";

/** Cài đặt nền (base) Meta Pixel / TikTok Pixel / GA4 gtag.js cho toàn bộ site công
 * khai — PageView tự bắn khi tải trang, sự kiện "Lead" riêng cho từng CTA xem ở
 * lead-tracking.ts. ID đo lường đọc từ env NEXT_PUBLIC_* để điền sau không cần sửa
 * code; script nào thiếu ID thì KHÔNG render (không để lại tag rỗng/gãy).
 *
 * Bối cảnh: trước bản này site không cài pixel nào (xác minh qua grep "fbq\|facebook.
 * com/tr\|gtag\|TikTokPixel" app/ → không có kết quả), nên Facebook/TikTok/Google
 * không đo được gì sau khi khách bấm quảng cáo vào site, không thể tối ưu phân phối —
 * ước tính góp phần vào chi phí/lead Facebook Ads cao bất thường (~781.000đ).
 *
 * strategy="afterInteractive" (next/script) — tải sau khi trang đã tương tác được,
 * không chặn render nội dung chính, đúng khuyến nghị Next.js cho script bên thứ 3
 * không bắt buộc cho above-the-fold. */
export function AnalyticsPixels() {
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const tiktokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      {metaPixelId && (
        <Script id="meta-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {tiktokPixelId && (
        <Script id="tiktok-pixel-base" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject = t;
              var ttq = w[t] = w[t] || [];
              ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
              ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
              for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
              ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < e.length; n++) ttq.setAndDefer(e, e[n]); return e };
              ttq.load = function (e, n) {
                var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = i; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {};
                var o = document.createElement("script"); o.type = "text/javascript"; o.async = !0; o.src = i + "?sdkid=" + e + "&lib=" + t;
                var a = document.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
              };
              ttq.load('${tiktokPixelId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

      {gaMeasurementId && (
        <>
          <Script
            id="ga4-lib"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
