/**
 * Đọc slug tiệm từ subdomain hoặc URL path
 *
 * Production:  tiemthanhthanh.khuong2601.io.vn  → slug = "tiemthanhthanh"
 * Localhost:   localhost:5173/tiemthanhthanh/... → slug = "tiemthanhthanh" (giữ nguyên)
 */

const BASE_DOMAINS = ['khuong2601.io.vn', 'localhost', '127.0.0.1']

/**
 * Trả về slug tiệm từ subdomain.
 * Ví dụ: tiemthanhthanh.khuong2601.io.vn → "tiemthanhthanh"
 * Nếu không có subdomain (domain gốc) → trả về null
 */
export function getSlugFromSubdomain() {
  const hostname = window.location.hostname

  // Localhost / IP → không có subdomain, dùng path như cũ
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null
  }

  // Kiểm tra nếu hostname là subdomain của base domain
  const baseDomain = 'khuong2601.io.vn'
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
