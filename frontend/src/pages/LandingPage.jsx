import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

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

const STEPS = [
  { num: '01', icon: '🔗', title: 'Đăng ký & nhận link', desc: 'Tạo tài khoản trong 30 giây. Nhận ngay link riêng: aureliasalon.online/tiem-cua-ban' },
  { num: '02', icon: '⚙️', title: 'Cài đặt dịch vụ & nhân viên', desc: 'Thêm danh sách dịch vụ, giá tiền, nhân viên và ca làm việc. Mất 5 phút.' },
  { num: '03', icon: '🚀', title: 'Bắt đầu bán hàng', desc: 'Chia sẻ link đặt lịch cho khách. Mở POS, bấm bán, in hóa đơn. Xong!' },
]

const PRICING = [
  {
    name: 'Dùng thử',
    price: 'Miễn phí',
    period: '7 ngày',
    color: '#10b981',
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
    color: '#f59e0b',
    features: ['Tất cả tính năng', 'Nhân viên không giới hạn', 'Báo cáo xuất Excel', 'API kết nối Zalo OA', 'Onboarding 1-1'],
    cta: 'Liên hệ tư vấn'
  }
]

const TESTIMONIALS = [
  { name: 'Chị Lan', shop: 'Tiệm tóc Lan Beauty', text: 'Trước dùng sổ tay giờ chuyển Aurelia Salon, cắt giảm 30 phút/ngày ghi chép. Khách đặt lịch online nhiều hơn hẳn!', initials: 'LA', color: '#c9956c' },
  { name: 'Anh Tuấn', shop: 'Barber Shop T&T', text: 'Tính hoa hồng cho thợ mất 2 tiếng giờ chỉ cần 1 click. Thợ cũng vui vì thấy minh bạch hơn.', initials: 'TN', color: '#764ba2' },
  { name: 'Chị Mai', shop: 'Nail & Hair Studio', text: 'Khách công nợ mà không nhớ ai nợ bao nhiêu. Giờ mở tab Khách hàng là thấy liền. Xuất sắc!', initials: 'TM', color: '#f59e0b' },
]

const STATS = [
  { val: 500, suffix: '+', label: 'Tiệm đang dùng' },
  { val: 99.9, suffix: '%', label: 'Uptime SLA' },
  { val: 5, suffix: ' phút', label: 'Cài đặt xong' },
]

// Hook: counter animation
function useCounter(target, duration = 1500, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start * 10) / 10)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, active])
  return count
}

// Hook: intersection observer for scroll reveal
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold: 0.15, ...options })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function StatItem({ val, suffix, label, active }) {
  const isDecimal = !Number.isInteger(val)
  const count = useCounter(val, 1800, active)
  const display = isDecimal ? count.toFixed(1) : Math.floor(count)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(28px,5vw,38px)', fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [slugInput, setSlugInput] = useState('')
  const [slugLoading, setSlugLoading] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [foundShop, setFoundShop] = useState(null)

  const handleSlugLookup = async () => {
    const slug = slugInput.trim().toLowerCase()
    if (!slug) return setSlugError('Vui lòng nhập tên tiệm')
    setSlugLoading(true)
    setSlugError('')
    setFoundShop(null)
    try {
      const res = await api.get(`/api/public/shop/${slug}`)
      setFoundShop(res.data)
    } catch {
      setSlugError('Không tìm thấy tiệm. Kiểm tra lại tên đường dẫn.')
    } finally {
      setSlugLoading(false)
    }
  }

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const [statsRef, statsInView] = useInView()
  const [featRef, featInView] = useInView()
  const [stepsRef, stepsInView] = useInView()
  const [testRef, testInView] = useInView()
  const [priceRef, priceInView] = useInView()

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#1a1a2e', overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <img src="/icon.png" alt="Aurelia Salon" style={{ height: 34, width: 34, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5, color: '#c9956c', fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, whiteSpace: 'nowrap' }}>AURELIA SALON</div>
            <div style={{ fontSize: 8, letterSpacing: 1.5, color: scrolled ? '#888' : 'rgba(255,255,255,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>BEAUTY & WELLNESS</div>
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Ẩn Bảng giá trên mobile nhỏ, hiện khi màn >= 480px */}
          <a href="#pricing" className="nav-banggia" style={{ fontSize: 13, fontWeight: 600, color: scrolled ? '#555' : 'rgba(255,255,255,0.8)', textDecoration: 'none', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Bảng giá
          </a>
          <button onClick={() => { setShowLoginModal(true); setFoundShop(null); setSlugInput(''); setSlugError('') }} style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', border: 'none',
            padding: '8px 16px', borderRadius: 50, fontSize: 13,
            fontWeight: 700, boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
            transition: 'all 0.2s', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >
            Đăng nhập ↗
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 55%, #1a0533 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Blobs */}
        <div style={{ position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(102,126,234,0.18),transparent)',top:'-20%',left:'-15%',animation:'blobPulse 6s ease-in-out infinite',pointerEvents:'none' }} />
        <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(118,75,162,0.2),transparent)',bottom:'-15%',right:'-10%',animation:'blobPulse 8s ease-in-out infinite 2s',pointerEvents:'none' }} />
        <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,rgba(167,139,250,0.12),transparent)',top:'40%',right:'5%',animation:'blobPulse 5s ease-in-out infinite 1s',pointerEvents:'none' }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(167,139,250,0.12)', borderRadius: 50,
          padding: '8px 18px', fontSize: 13, color: '#c4b5fd',
          marginBottom: 28, border: '1px solid rgba(167,139,250,0.25)',
          animation: 'fadeSlideDown 0.6s ease'
        }}>
          ✨ Phần mềm quản lý tiệm tóc #1 Việt Nam
        </div>

        <h1 style={{
          fontSize: 'clamp(38px, 8vw, 68px)', fontWeight: 900,
          color: '#fff', marginBottom: 22, lineHeight: 1.1,
          letterSpacing: '-1px',
          animation: 'fadeSlideDown 0.6s ease 0.1s both'
        }}>
          Quản lý tiệm tóc<br />
          <span style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>thông minh hơn</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.65)',
          maxWidth: 560, lineHeight: 1.75, marginBottom: 44,
          animation: 'fadeSlideDown 0.6s ease 0.2s both'
        }}>
          Từ bán hàng, đặt lịch, quản lý nhân viên đến báo cáo doanh thu — tất cả trong một app chạy ngay trên điện thoại của bạn.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', animation: 'fadeSlideDown 0.6s ease 0.3s both' }}>
          <button onClick={() => navigate('/dang-ky')} style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', border: 'none',
            padding: '16px 34px', borderRadius: 50, fontSize: 16, fontWeight: 800,
            boxShadow: '0 8px 32px rgba(102,126,234,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'all 0.25s', letterSpacing: '-0.3px', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(102,126,234,0.6)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(102,126,234,0.5)' }}
          >
            🚀 Dùng thử miễn phí
          </button>
          <a href="#features" style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none',
            padding: '16px 30px', borderRadius: 50, fontSize: 16, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.18)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            transition: 'all 0.25s', backdropFilter: 'blur(10px)'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          >
            Xem tính năng ↓
          </a>
        </div>

        {/* Stats counter */}
        <div ref={statsRef} style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32, marginTop: 72, maxWidth: 520, width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 40,
          animation: 'fadeSlideDown 0.6s ease 0.4s both'
        }}>
          {STATS.map(s => <StatItem key={s.label} {...s} active={statsInView} />)}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ background: '#f8f9ff', padding: '100px 24px' }}>
        <div ref={featRef} style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64, opacity: featInView ? 1 : 0, transform: featInView ? 'none' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #667eea22, #764ba222)', borderRadius: 50, padding: '6px 18px', fontSize: 13, color: '#667eea', fontWeight: 700, marginBottom: 16, border: '1px solid #667eea22' }}>
              🎯 Tính năng
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px', color: '#1a1a2e' }}>
              Mọi thứ bạn cần,<br />trong một app
            </h2>
            <p style={{ color: '#888', fontSize: 17, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              Không cần cài đặt phức tạp. Chỉ cần link, bán hàng ngay.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 22, padding: '30px 26px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                opacity: featInView ? 1 : 0,
                transform: featInView ? 'none' : 'translateY(20px)',
                transitionDelay: `${i * 0.06}s`
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(102,126,234,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.05)' }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'linear-gradient(135deg, #f0f5ff, #f8f0ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 16
                }}>{f.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: '#1a1a2e', letterSpacing: '-0.2px' }}>{f.title}</div>
                <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ background: '#fff', padding: '100px 24px' }}>
        <div ref={stepsRef} style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64, opacity: stepsInView ? 1 : 0, transform: stepsInView ? 'none' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
            <div style={{ display: 'inline-block', background: '#fff7ed', borderRadius: 50, padding: '6px 18px', fontSize: 13, color: '#f59e0b', fontWeight: 700, marginBottom: 16, border: '1px solid #fed7aa' }}>
              ⚡ Cách hoạt động
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px' }}>
              Bắt đầu trong 3 bước đơn giản
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                position: 'relative', textAlign: 'center', padding: '40px 28px 36px',
                background: 'linear-gradient(135deg, #f8f9ff, #fff)',
                borderRadius: 24, border: '1px solid #eef0f8',
                opacity: stepsInView ? 1 : 0, transform: stepsInView ? 'none' : 'translateY(20px)',
                transition: `all 0.5s ease ${i * 0.15}s`
              }}>
                <div style={{
                  position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', fontSize: 12, fontWeight: 900,
                  width: 32, height: 32, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(102,126,234,0.4)'
                }}>{s.num}</div>
                <div style={{ fontSize: 44, marginBottom: 16, lineHeight: 1 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, color: '#1a1a2e' }}>{s.title}</div>
                <div style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ background: 'linear-gradient(135deg, #f8f9ff, #fdf4ff)', padding: '100px 24px' }}>
        <div ref={testRef} style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60, opacity: testInView ? 1 : 0, transform: testInView ? 'none' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
            <div style={{ display: 'inline-block', background: '#f0fdf4', borderRadius: 50, padding: '6px 18px', fontSize: 13, color: '#10b981', fontWeight: 700, marginBottom: 16, border: '1px solid #bbf7d0' }}>
              💬 Đánh giá thực tế
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.5px' }}>
              Chủ tiệm nói gì về Aurelia Salon?
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 22 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 24, padding: '32px 28px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                opacity: testInView ? 1 : 0, transform: testInView ? 'none' : 'translateY(20px)',
                transitionDelay: `${i * 0.12}s`
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)' }}
              >
                <div style={{ color: '#fbbf24', fontSize: 18, marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
                <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.75, marginBottom: 22, fontStyle: 'italic', fontWeight: 400 }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: `linear-gradient(135deg, ${t.color}22, ${t.color}44)`,
                    border: `2px solid ${t.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, color: t.color
                  }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1a1a2e' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.shop}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ background: '#f8f9ff', padding: '100px 24px' }}>
        <div ref={priceRef} style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56, opacity: priceInView ? 1 : 0, transform: priceInView ? 'none' : 'translateY(30px)', transition: 'all 0.6s ease' }}>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #667eea22, #764ba222)', borderRadius: 50, padding: '6px 18px', fontSize: 13, color: '#667eea', fontWeight: 700, marginBottom: 16, border: '1px solid #667eea22' }}>
              💎 Bảng giá
            </div>
            <h2 style={{ fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.5px' }}>
              Giá minh bạch, không phí ẩn
            </h2>
            <p style={{ color: '#6b7280', fontSize: 17 }}>Hủy bất cứ lúc nào. Không cần thẻ tín dụng để dùng thử.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22, alignItems: 'center' }}>
            {PRICING.map((p, i) => (
              <div key={i} style={{
                background: p.highlight ? 'linear-gradient(145deg, #667eea, #764ba2)' : '#fff',
                borderRadius: 26,
                padding: p.highlight ? '44px 32px' : '36px 28px',
                boxShadow: p.highlight ? '0 24px 64px rgba(102,126,234,0.45)' : '0 4px 24px rgba(0,0,0,0.06)',
                transform: p.highlight ? 'scale(1.05)' : 'none',
                position: 'relative', overflow: 'hidden',
                border: p.highlight ? 'none' : '1px solid rgba(0,0,0,0.05)',
                opacity: priceInView ? 1 : 0, transition: `all 0.5s ease ${i * 0.1}s`
              }}>
                {p.highlight && (
                  <div style={{
                    position: 'absolute', top: 18, right: 18,
                    background: 'rgba(255,215,0,0.95)', color: '#7a3e00', fontSize: 11,
                    fontWeight: 900, padding: '4px 12px', borderRadius: 50,
                    boxShadow: '0 2px 12px rgba(255,215,0,0.4)'
                  }}>⭐ PHỔ BIẾN</div>
                )}
                <div style={{ color: p.highlight ? 'rgba(255,255,255,0.7)' : '#6b7280', fontSize: 13, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {p.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: p.highlight ? '#fff' : p.color, lineHeight: 1, letterSpacing: '-1px' }}>{p.price}</span>
                  <span style={{ color: p.highlight ? 'rgba(255,255,255,0.6)' : '#9ca3af', fontSize: 14 }}>{p.period}</span>
                </div>
                <div style={{ height: 1, background: p.highlight ? 'rgba(255,255,255,0.15)' : '#f3f4f6', margin: '20px 0' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: p.highlight ? 'rgba(255,255,255,0.9)' : '#374151' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: p.highlight ? 'rgba(255,255,255,0.2)' : `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: p.highlight ? '#a0f0a0' : p.color, fontWeight: 900, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="/super-admin" style={{
                  display: 'block', width: '100%', height: 48, lineHeight: '48px',
                  textAlign: 'center', textDecoration: 'none', borderRadius: 50,
                  background: p.highlight ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${p.color}, ${p.color}cc)`,
                  border: p.highlight ? '1px solid rgba(255,255,255,0.3)' : 'none',
                  color: '#fff', fontSize: 15, fontWeight: 800,
                  boxShadow: p.highlight ? 'none' : `0 4px 16px ${p.color}44`,
                  transition: 'all 0.2s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.background = p.highlight ? 'rgba(255,255,255,0.28)' : `${p.color}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = p.highlight ? 'rgba(255,255,255,0.2)' : `linear-gradient(135deg, ${p.color}, ${p.color}cc)` }}
                >
                  {p.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 60%, #24243e 100%)',
        padding: '100px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(167,139,250,0.12),transparent)',top:'-20%',left:'5%',pointerEvents:'none' }} />
        <div style={{ position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(96,165,250,0.1),transparent)',bottom:'-15%',right:'5%',pointerEvents:'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: 64, marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(102,126,234,0.4))' }}>💈</div>
          <h2 style={{ fontSize: 'clamp(30px, 6vw, 52px)', fontWeight: 900, color: '#fff', marginBottom: 18, letterSpacing: '-1px', lineHeight: 1.15 }}>
            Bắt đầu miễn phí<br />ngay hôm nay
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18, marginBottom: 40, lineHeight: 1.6 }}>
            Dùng thử 7 ngày, đầy đủ tính năng. Không cần thẻ tín dụng.
          </p>
          <a href="/super-admin" style={{
            background: 'linear-gradient(135deg, #a78bfa, #667eea)',
            color: '#fff', textDecoration: 'none',
            padding: '18px 44px', borderRadius: 50, fontSize: 18, fontWeight: 900,
            boxShadow: '0 12px 40px rgba(167,139,250,0.45)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            transition: 'all 0.25s', letterSpacing: '-0.3px'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(167,139,250,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(167,139,250,0.45)' }}
          >
            🚀 Tạo tài khoản miễn phí
          </a>
          <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
            ✓ Không ràng buộc &nbsp;·&nbsp; ✓ Hủy bất cứ lúc nào &nbsp;·&nbsp; ✓ Hỗ trợ Zalo 24/7
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0a0814', color: 'rgba(255,255,255,0.3)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icon.png" alt="Aurelia Salon" style={{ height: 32, width: 32, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: '#c9956c', fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1 }}>AURELIA SALON</span>
          </div>
          <div style={{ fontSize: 13 }}>
            © 2026 Aurelia Salon · Beauty & Wellness
          </div>
          <a href="mailto:hello@aureliasalon.online" style={{ color: '#c9956c', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            hello@aureliasalon.online
          </a>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        @keyframes blobPulse {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.6; }
          50% { transform: scale(1.08) translate(10px, -10px); opacity: 0.9; }
        }
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Ẩn Bảng giá trên màn hình nhỏ hơn 400px */
        @media (max-width: 400px) {
          .nav-banggia { display: none !important; }
        }
      `}</style>

      {/* ── Modal Tìm tiệm / Đăng nhập ── */}
      {showLoginModal && (
        <div onClick={() => setShowLoginModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, padding: '32px 28px',
            width: '100%', maxWidth: 420,
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            animation: 'fadeSlideDown 0.25s ease'
          }}>
            {!foundShop ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>Đăng nhập vào tiệm</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Nhập đường dẫn tiệm của bạn</div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Tên đường dẫn tiệm</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'#9ca3af', pointerEvents:'none' }}>
                        aureliasalon.online/
                      </span>
                      <input
                        autoFocus
                        value={slugInput}
                        onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')); setSlugError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleSlugLookup()}
                        placeholder="tiem-thanh-thanh"
                        style={{
                          width: '100%', height: 44, border: '1.5px solid #e5e7eb', borderRadius: 10,
                          padding: '0 12px 0 152px', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#667eea'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <button onClick={handleSlugLookup} disabled={slugLoading} style={{
                      height: 44, padding: '0 18px', border: 'none', borderRadius: 10,
                      background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff',
                      fontWeight: 700, fontSize: 14, cursor: slugLoading ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap', flexShrink: 0
                    }}>
                      {slugLoading ? '...' : 'Tìm →'}
                    </button>
                  </div>
                  {slugError && (
                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6 }}>⚠️ {slugError}</div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, marginTop: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Chưa có tiệm?</div>
                  <button onClick={() => { setShowLoginModal(false); window.location.href = '/dang-ky' }} style={{
                    background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
                    border: 'none', borderRadius: 50, padding: '10px 24px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
                  }}>
                    🚀 Tạo tiệm miễn phí
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  {foundShop.logo_url ? (
                    <img src={foundShop.logo_url} alt="logo" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>💈</div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>{foundShop.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>aureliasalon.online/{foundShop.slug}</div>
                </div>

                <button onClick={() => { setShowLoginModal(false); window.location.href = `/${foundShop.slug}/login` }} style={{
                  width: '100%', height: 50, border: 'none', borderRadius: 12,
                  background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(102,126,234,0.4)', marginBottom: 10
                }}>
                  Đăng nhập vào {foundShop.name} →
                </button>
                <button onClick={() => setFoundShop(null)} style={{
                  width: '100%', height: 38, border: '1.5px solid #e5e7eb', borderRadius: 10,
                  background: 'transparent', color: '#6b7280', fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}>
                  ← Tìm tiệm khác
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
