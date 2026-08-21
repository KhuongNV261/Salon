import React, { useState, useEffect } from 'react'

const FEATURES = [
  { icon: '💈', title: 'POS Bán hàng', desc: 'Tính tiền nhanh, giỏ hàng thông minh, đa hình thức thanh toán' },
  { icon: '📅', title: 'Đặt lịch thông minh', desc: 'Calendar trực quan, tự động phân công thợ, nhắc lịch khách' },
  { icon: '👥', title: 'CRM Khách hàng', desc: 'Lịch sử mua hàng, quản lý công nợ, thu nợ một click' },
  { icon: '📊', title: 'Báo cáo chi tiết', desc: 'Biểu đồ doanh thu, thống kê nhân viên, hoa hồng tự động' },
  { icon: '📦', title: 'Quản lý kho', desc: 'Nhập kho, kiểm kê, cảnh báo hàng sắp hết tự động' },
  { icon: '🖨️', title: 'In hóa đơn', desc: 'In nhiệt 80mm, mẫu đẹp, có QR code tiền tip' },
  { icon: '👨‍💼', title: 'Quản lý nhân viên', desc: 'Ca làm việc, hoa hồng, phân quyền owner/staff' },
  { icon: '📱', title: 'Mobile-first', desc: 'Chạy mượt trên điện thoại, không cần cài app' },
]

const PRICING = [
  {
    name: 'Dùng thử',
    price: 'Miễn phí',
    period: '7 ngày',
    color: '#52c41a',
    features: ['Tất cả tính năng', '1 tài khoản', 'Hỗ trợ qua Zalo'],
    cta: 'Dùng thử ngay'
  },
  {
    name: 'Cơ bản',
    price: '149k',
    period: '/tháng',
    color: '#667eea',
    highlight: true,
    features: ['Tất cả tính năng', '5 tài khoản nhân viên', 'Tên miền riêng', 'Hỗ trợ ưu tiên 24/7'],
    cta: 'Đăng ký ngay'
  },
  {
    name: 'Nâng cao',
    price: '299k',
    period: '/tháng',
    color: '#fa8c16',
    features: ['Tất cả tính năng', 'Nhân viên không giới hạn', 'Báo cáo xuất Excel', 'API kết nối Zalo OA', 'Onboarding 1-1'],
    cta: 'Liên hệ tư vấn'
  }
]

const TESTIMONIALS = [
  { name: 'Chị Lan', shop: 'Tiệm tóc Lan Beauty', text: 'Trước dùng sổ tay giờ chuyển LocalPOS, cắt giảm 30 phút/ngày ghi chép. Khách đặt lịch online nhiều hơn hẳn!', avatar: '👩' },
  { name: 'Anh Tuấn', shop: 'Barber Shop T&T', text: 'Tính hoa hồng cho thợ mất 2 tiếng giờ chỉ cần 1 click. Thợ cũng vui vì thấy minh bạch.', avatar: '👨' },
  { name: 'Chị Mai', shop: 'Nail & Hair Studio', text: 'Khách công nợ mà không nhớ ai nợ bao nhiêu. Giờ mở tab Khách hàng là thấy liền. Xuất sắc!', avatar: '💅' },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>💈</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: scrolled ? '#1a1a2e' : '#fff' }}>LocalPOS</span>
        </div>
        <a
          href="/super-admin"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', textDecoration: 'none',
            padding: '10px 20px', borderRadius: 50, fontSize: 14,
            fontWeight: 700, boxShadow: '0 4px 16px rgba(102,126,234,0.4)'
          }}
        >
          Đăng nhập ↗
        </a>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Animated blobs */}
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,126,234,0.3), transparent)',
          top: '10%', left: '-10%', animation: 'pulse 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118,75,162,0.3), transparent)',
          bottom: '10%', right: '-5%', animation: 'pulse 6s ease-in-out infinite'
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.1)', borderRadius: 50,
          padding: '8px 16px', fontSize: 13, color: '#a78bfa',
          marginBottom: 24, border: '1px solid rgba(167,139,250,0.3)'
        }}>
          ✨ Phần mềm quản lý tiệm tóc #1 Việt Nam
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 900,
          color: '#fff', marginBottom: 20, lineHeight: 1.15,
          textShadow: '0 2px 20px rgba(0,0,0,0.3)'
        }}>
          Quản lý tiệm tóc<br />
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>thông minh hơn</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)', color: 'rgba(255,255,255,0.7)',
          maxWidth: 560, lineHeight: 1.7, marginBottom: 40
        }}>
          Từ bán hàng, đặt lịch, quản lý nhân viên đến báo cáo doanh thu — tất cả trong một app chạy ngay trên điện thoại của bạn.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/super-admin" style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', textDecoration: 'none',
            padding: '16px 32px', borderRadius: 50, fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 32px rgba(102,126,234,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'transform 0.2s'
          }}>
            🚀 Dùng thử miễn phí
          </a>
          <a href="#features" style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none',
            padding: '16px 28px', borderRadius: 50, fontSize: 16, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            Xem tính năng ↓
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24, marginTop: 64, maxWidth: 480, width: '100%'
        }}>
          {[
            { val: '500+', label: 'Tiệm đang dùng' },
            { val: '99.9%', label: 'Uptime' },
            { val: '5 phút', label: 'Cài đặt xong' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#a78bfa' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        background: '#f8f9ff', padding: '80px 24px'
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, marginBottom: 12 }}>
              Mọi thứ bạn cần, trong một app
            </h2>
            <p style={{ color: '#888', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
              Không cần cài đặt phức tạp. Chỉ cần truy cập link, bán hàng ngay.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: '28px 24px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(102,126,234,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: '#888', fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, marginBottom: 48 }}>
            Chủ tiệm nói gì về LocalPOS?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: 'linear-gradient(135deg, #f0f5ff, #f9f0ff)',
                borderRadius: 20, padding: '28px 24px',
                border: '1px solid rgba(102,126,234,0.1)'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⭐⭐⭐⭐⭐</div>
                <p style={{ color: '#444', fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 32 }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{t.shop}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: '#f8f9ff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(26px, 5vw, 38px)', fontWeight: 800, marginBottom: 16 }}>
            Bảng giá minh bạch
          </h2>
          <p style={{ textAlign: 'center', color: '#888', fontSize: 16, marginBottom: 48 }}>
            Không phí ẩn. Hủy bất cứ lúc nào.
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 20, alignItems: 'stretch'
          }}>
            {PRICING.map((p, i) => (
              <div key={i} style={{
                background: p.highlight ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#fff',
                borderRadius: 24, padding: '36px 28px',
                boxShadow: p.highlight ? '0 20px 60px rgba(102,126,234,0.4)' : '0 2px 16px rgba(0,0,0,0.06)',
                transform: p.highlight ? 'scale(1.04)' : 'none',
                position: 'relative', overflow: 'hidden'
              }}>
                {p.highlight && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#ffd700', color: '#000', fontSize: 11,
                    fontWeight: 800, padding: '4px 10px', borderRadius: 50
                  }}>⭐ PHỔ BIẾN</div>
                )}
                <div style={{ color: p.highlight ? 'rgba(255,255,255,0.8)' : '#888', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 40, fontWeight: 900, color: p.highlight ? '#fff' : p.color }}>
                  {p.price}
                </div>
                <div style={{ color: p.highlight ? 'rgba(255,255,255,0.7)' : '#aaa', fontSize: 14, marginBottom: 24 }}>
                  {p.period}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: p.highlight ? '#fff' : '#555' }}>
                      <span style={{ color: p.highlight ? '#a0f0a0' : '#52c41a', fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{
                  width: '100%', height: 46,
                  background: p.highlight ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${p.color}, ${p.color}dd)`,
                  border: p.highlight ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  borderRadius: 50, color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  {p.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0c29, #302b63)',
        padding: '80px 24px', textAlign: 'center'
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>💈</div>
        <h2 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>
          Bắt đầu ngay hôm nay
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 36, maxWidth: 480, margin: '0 auto 36px' }}>
          Dùng thử miễn phí 7 ngày. Không cần thẻ tín dụng.
        </p>
        <a href="/super-admin" style={{
          background: 'linear-gradient(135deg, #a78bfa, #667eea)',
          color: '#fff', textDecoration: 'none',
          padding: '18px 40px', borderRadius: 50, fontSize: 18, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(167,139,250,0.4)',
          display: 'inline-block'
        }}>
          🚀 Tạo tài khoản miễn phí
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0f0c29', color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', padding: '24px 20px', fontSize: 13
      }}>
        © 2026 LocalPOS · Phần mềm quản lý tiệm tóc Việt Nam · 
        <span style={{ color: '#667eea' }}> hello@localpos.vn</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        html { scroll-behavior: smooth; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
      `}</style>
    </div>
  )
}
