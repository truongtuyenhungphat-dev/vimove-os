// Lưu tạm "sản phẩm đang xem" vào sessionStorage khi khách ở trang chi tiết sản phẩm
// (app/(public)/san-pham/[slug]/page.tsx qua product-cta-buttons.tsx), để nút Zalo nổi
// sitewide (floating-contact.tsx — render trong layout dùng chung, không có sẵn dữ liệu
// sản phẩm) biết ngữ cảnh mà gắn vào link Zalo + sự kiện Lead. Dùng sessionStorage
// (thay vì Context/props) vì floating-contact.tsx và product-cta-buttons.tsx không có
// quan hệ cha-con — đây là cách đơn giản nhất không phải đổi kiến trúc layout công khai.
//
// Kèm 1 pub/sub nội bộ (listeners) để floating-contact.tsx dùng useSyncExternalStore —
// đây là nguồn dữ liệu NGOÀI React (sessionStorage) nên phải subscribe đúng cách, thay
// vì setState trong useEffect (bị react-hooks/set-state-in-effect chặn ở ESLint).

const STORAGE_KEY = "vimove:active-product";
const listeners = new Set<() => void>();

export type ActiveProductContext = { slug: string; name: string };

function notifyListeners() {
  for (const listener of listeners) listener();
}

export function setActiveProductContext(product: ActiveProductContext) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(product));
  } catch {
    // Bỏ qua — sessionStorage có thể bị chặn (chế độ ẩn danh nghiêm ngặt...), không
    // chặn trải nghiệm xem sản phẩm vì 1 tính năng tracking phụ.
  }
  notifyListeners();
}

export function clearActiveProductContext() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Bỏ qua, xem lý do ở trên.
  }
  notifyListeners();
}

export function getActiveProductContext(): ActiveProductContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActiveProductContext) : null;
  } catch {
    return null;
  }
}

export function subscribeActiveProductContext(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
