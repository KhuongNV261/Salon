/**
 * Đọc slug tiệm từ subdomain hoặc URL path
 *
 * Production:  tiemthanhthanh.aureliasalon.online  → slug = "tiemthanhthanh"
 * Localhost:   localhost:5173/tiemthanhthanh/... → slug = "tiemthanhthanh" (giữ nguyên)
 */

const BASE_DOMAINS = ['aureliasalon.online', 'localhost', '127.0.0.1']

/**
 * Trả về slug tiệm từ subdomain.
 * Ví dụ: tiemthanhthanh.aureliasalon.online → "tiemthanhthanh"
 * Nếu không có subdomain (domain gốc) → trả về null
 */
export function getSlugFromSubdomain() {
  const hostname = window.location.hostname

  // Localhost / IP → không có subdomain, dùng path như cũ
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  // Kiểm tra nếu hostname là subdomain của base domain
  const baseDomain = 'aureliasalon.online'
  if (hostname.endsWith('.' + baseDomain)) {
    const subdomain = hostname.slice(0, hostname.length - baseDomain.length - 1)
    // Bỏ qua www
    if (subdomain && subdomain !== 'www') {
      return subdomain
    }
  }

  return null
}

/**
 * Trả về true nếu đang chạy ở chế độ subdomain (production với subdomain tiệm)
 */
export function isSubdomainMode() {
  return getSlugFromSubdomain() !== null
}
