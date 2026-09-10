/**
 * Khoảng cách thật giữa 2 toạ độ (mét) — công thức Haversine, đủ chính xác cho kiểm
 * tra bán kính văn phòng (sai số dưới 0.5% ở khoảng cách vài km, thừa đủ cho GPS
 * chấm công). Không cần thư viện ngoài — đây là công thức toán thuần.
 */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // bán kính Trái Đất, mét
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Tìm địa điểm gần nhất trong danh sách + khoảng cách thật tới đó (mét). */
export function findNearestLocation<T extends { latitude: number; longitude: number }>(
  lat: number,
  lon: number,
  locations: T[]
): { location: T; distance: number } | null {
  if (locations.length === 0) return null;
  let best: { location: T; distance: number } | null = null;
  for (const loc of locations) {
    const d = distanceMeters(lat, lon, loc.latitude, loc.longitude);
    if (!best || d < best.distance) best = { location: loc, distance: d };
  }
  return best;
}
