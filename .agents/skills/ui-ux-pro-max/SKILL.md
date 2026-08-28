---
name: ui-ux-pro-max
description: "Kỹ năng thiết kế UI/UX toàn diện: brand identity, design tokens, UI styling (shadcn/ui + Tailwind), logo generation (55+ styles), corporate identity program (CIP, 50+ deliverables), HTML presentations (Chart.js), banner design (22+ styles), icon design (SVG), social media images. Actions: design logo, create CIP, generate mockups, build slides, design banner, generate icon, create social photos. Platforms: Facebook, Twitter, LinkedIn, YouTube, Instagram, Pinterest, TikTok, Threads, Google Ads. Use khi xây dựng UI premium, hệ thống thiết kế, tạo logo AI, thiết kế tài sản thương hiệu."
argument-hint: "[loại-thiết-kế] [ngữ-cảnh]"
license: MIT
metadata:
  author: nextlevelbuilder (adapted for Antigravity)
  source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
  version: "2.1.0"
---

# UI/UX Pro Max Skill

Kỹ năng thiết kế UI/UX cấp độ chuyên nghiệp: brand, tokens, UI, logo, CIP, slides, banners, social photos, icons.

## Khi nào sử dụng

- Xây dựng giao diện người dùng đẹp, premium, hiện đại
- Thiết lập hệ thống design tokens và CSS variables
- Tạo logo bằng AI (55+ styles, 30 color palettes)
- Thiết kế bộ nhận diện thương hiệu (CIP) hoàn chỉnh
- Tạo banner quảng cáo (social/ads/web/print)
- Thiết kế icon SVG (15+ styles)
- Tạo ảnh mạng xã hội (Instagram, Facebook, LinkedIn, v.v.)
- Xây dựng slide/presentation bằng HTML+Chart.js

---

## Routing theo Loại Task

| Task | Module | Tham chiếu |
|------|--------|-----------|
| Brand identity, voice, assets | Brand | `references/brand-guidelines.md` |
| Design tokens, CSS vars | Design System | `references/design-system.md` |
| shadcn/ui, Tailwind, components | UI Styling | `references/ui-styling.md` |
| Logo creation, AI generation | Logo | `references/logo-design.md` |
| CIP mockups, deliverables | CIP | `references/cip-design.md` |
| Presentations, pitch decks | Slides | `references/slides.md` |
| Banners, covers, headers | Banner | `references/banner-design.md` |
| Social media images | Social Photos | `references/social-photos.md` |
| SVG icons, icon sets | Icon | `references/icon-design.md` |

---

## 1. LOGO DESIGN

### Tổng quan
- 55+ logo styles (minimalist, vintage, geometric, mascot, v.v.)
- 30 color palettes theo ngành
- 25 industry guides (beauty, tech, food, health, v.v.)
- AI generation: Gemini hoặc Atlas Cloud

### Workflow thiết kế logo

**Bước 1: Phân tích brief**
```
- Brand name: [tên thương hiệu]
- Ngành: [beauty/salon/tech/food/...]  
- Style: [minimalist/luxury/playful/...]
- Target audience: [đối tượng khách hàng]
- Colors preferred: [màu sắc mong muốn]
```

**Bước 2: Tạo concept**
Dựa vào `references/logo-design.md` để chọn:
- Logo style phù hợp
- Color psychology
- Typography pairing

**Bước 3: AI Generation**
```bash
# Với Gemini (dùng generate_image tool)
python3 scripts/logo/generate.py --brand "[BrandName]" --style [style] --industry [industry]

# Prompt template cho generate_image:
"Professional [style] logo for [brand] in [industry], [colors] color scheme, white background, vector style, high quality"
```

**Bước 4: Preview HTML Gallery**
Sau khi tạo logo, hỏi user về việc tạo HTML preview gallery.

### Logo Styles theo Salon/Beauty
| Style | Mô tả | Phù hợp cho |
|-------|--------|-------------|
| Minimal Luxury | Đơn giản, tinh tế | High-end salon |
| Floral Botanical | Hoa lá, tự nhiên | Spa, beauty |
| Script Elegant | Chữ viết tay | Premium salon |
| Geometric Modern | Hình học hiện đại | Modern salon |
| Vintage Retro | Cổ điển | Barbershop |
| Art Deco | Sang trọng, nghệ thuật | Luxury spa |

---

## 2. BRAND IDENTITY (CIP)

### Tổng quan  
- 50+ deliverables (business card, letterhead, uniform, v.v.)
- 20 styles (luxury, minimal, bold, v.v.)
- 20 industries bao gồm beauty & salon

### CIP Deliverables cho Salon
| Deliverable | Mô tả |
|-------------|--------|
| Business Card | Danh thiếp (85×55mm) |
| Appointment Card | Phiếu hẹn |
| Gift Voucher | Phiếu quà tặng |
| Loyalty Card | Thẻ tích điểm |
| Staff Uniform | Mẫu đồng phục |
| Price List | Bảng giá dịch vụ |
| Menu/Service Brochure | Tờ rơi dịch vụ |
| Signage | Biển hiệu |
| Social Media Kit | Bộ ảnh mạng xã hội |
| Email Signature | Chữ ký email |
| Window Decal | Decal cửa kính |
| Packaging | Bao bì sản phẩm |

### CIP Workflow
```
1. Xác định logo và màu sắc brand
2. Xác định typography (font heading + body)
3. Thiết kế từng deliverable theo brand guidelines
4. Tạo mockup chân thực (dùng generate_image)
5. Export HTML/PDF
```

---

## 3. DESIGN SYSTEM & TOKENS

### Token Architecture (3 lớp)
```css
/* Lớp 1: Primitive tokens */
--color-rose-500: #f43f5e;
--color-gold-400: #fbbf24;
--font-size-base: 16px;

/* Lớp 2: Semantic tokens */
--color-brand-primary: var(--color-rose-500);
--color-brand-accent: var(--color-gold-400);
--text-body: var(--font-size-base);

/* Lớp 3: Component tokens */
--btn-bg: var(--color-brand-primary);
--card-border: var(--color-brand-accent);
```

### Salon Color Palettes

**Rose Gold Luxury**
```css
--primary: #b76e79;    /* Rose gold */
--secondary: #d4a86a;  /* Warm gold */
--accent: #f0e6d3;     /* Cream */
--dark: #2d1b1e;       /* Deep brown */
--light: #faf7f5;      /* Off white */
```

**Midnight Glamour**
```css
--primary: #1a1a2e;    /* Deep navy */
--secondary: #c9a96e;  /* Champagne gold */
--accent: #e8d5b7;     /* Light gold */
--dark: #0f0f1a;       /* Black */
--light: #f8f4ef;      /* Ivory */
```

**Fresh Botanical**
```css
--primary: #4a7c59;    /* Forest green */
--secondary: #8fbc8f;  /* Sage */
--accent: #f5f0e8;     /* Natural cream */
--dark: #2c3e35;       /* Dark green */
--light: #fafdf9;      /* White green */
```

---

## 4. UI STYLING

### Stack công nghệ
- **Components**: shadcn/ui (Radix UI + Tailwind)
- **Styling**: Tailwind CSS / Vanilla CSS
- **Framework**: HTML/JS, React, Next.js, Vite

### Nguyên tắc thiết kế UI cho Salon

**1. Visual Hierarchy**
- Hero image lớn, ấn tượng
- Typography rõ ràng: Heading serif + Body sans-serif
- CTA buttons nổi bật, màu brand

**2. Color Usage**
- Background: neutral/cream
- Primary actions: brand color
- Text: dark neutral, high contrast
- Accents: gold/rose sparingly

**3. Typography Pairs cho Salon**
| Heading | Body | Mood |
|---------|------|------|
| Playfair Display | Lato | Classic Luxury |
| Cormorant Garamond | Raleway | Elegant |
| Libre Baskerville | Open Sans | Professional |
| Josefin Sans | Montserrat | Modern |
| Great Vibes | Quicksand | Romantic |

**4. Components cần có**
```
- Navigation (sticky, transparent→opaque)
- Hero section (full-screen, parallax)
- Services grid (cards với hover effects)
- Booking/Appointment form
- Gallery (masonry/grid)
- Testimonials (carousel)
- Staff profiles
- Price list (table/accordion)
- Footer với social links + contact
```

**5. Animations & Interactions**
```css
/* Hover card lift */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
}

/* Smooth scroll reveal */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

/* Button shimmer */
.btn-primary::after {
  content: '';
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}
```

---

## 5. BANNER DESIGN

### Kích thước banner phổ biến

**Social Media**
| Platform | Kích thước | Tỉ lệ |
|----------|-----------|-------|
| Facebook Post | 1200×630px | 1.91:1 |
| Instagram Post | 1080×1080px | 1:1 |
| Instagram Story | 1080×1920px | 9:16 |
| LinkedIn Banner | 1584×396px | 4:1 |
| YouTube Thumbnail | 1280×720px | 16:9 |

**Quảng cáo Google**
| Loại | Kích thước |
|------|-----------|
| Leaderboard | 728×90px |
| Rectangle | 300×250px |
| Skyscraper | 160×600px |
| Billboard | 970×250px |

### Banner Template cho Salon
```html
<!-- Cấu trúc HTML banner -->
<div class="banner" style="width:1080px; height:1080px; background: linear-gradient(135deg, #b76e79, #d4a86a);">
  <div class="logo"><!-- Logo brand --></div>
  <div class="headline"><!-- Tiêu đề chính --></div>
  <div class="subtext"><!-- Mô tả --></div>
  <div class="cta"><!-- Call to action --></div>
  <div class="contact"><!-- Thông tin liên hệ --></div>
</div>
```

---

## 6. ICON DESIGN

### SVG Icon Styles
| Style | Mô tả | Use case |
|-------|--------|---------|
| Line | Nét mảnh, outline | Modern UI |
| Filled | Đặc, bold | Mobile |
| Duotone | 2 màu | Premium |
| Gradient | Gradient màu | Brand |
| Flat | Phẳng, đơn giản | Web |

### Icon set cho Salon
```
💇 Haircut / Cắt tóc
💅 Nail / Nail art  
💆 Massage / Spa
👁️ Lash / Mi
💄 Makeup / Trang điểm
🧴 Skincare / Chăm sóc da
✂️ Scissors / Kéo
🌿 Organic / Tự nhiên
⭐ Premium / Chất lượng
📅 Booking / Đặt lịch
```

---

## 7. SOCIAL MEDIA IMAGES

### Platforms & Content Types

**Instagram**
- Feed Post: 1080×1080 (square) hoặc 1080×1350 (portrait)
- Story: 1080×1920
- Reels Cover: 1080×1920

**Facebook**
- Post: 1200×630
- Story: 1080×1920
- Cover: 851×315

**TikTok**
- Video Cover: 1080×1920
- Profile: 200×200

### Content Ideas cho Salon
```
1. Before/After (kết quả dịch vụ)
2. Service promotion (khuyến mãi)
3. Staff introduction (giới thiệu nhân viên)
4. Tips & tutorials (mẹo làm đẹp)
5. Customer testimonials (đánh giá khách)
6. Seasonal offers (ưu đãi theo mùa)
7. New service launch (ra mắt dịch vụ)
8. Brand story (câu chuyện thương hiệu)
```

---

## 8. WORKFLOW TỔNG QUÁT

### Khi nhận yêu cầu thiết kế

```
1. UNDERSTAND: Hiểu rõ yêu cầu, brand, target audience
2. PLAN: Chọn style, colors, typography phù hợp
3. REFERENCE: Đọc file reference tương ứng trong /references/
4. CREATE: Tạo thiết kế với generate_image hoặc HTML/CSS
5. ITERATE: Hỏi feedback, điều chỉnh
6. DELIVER: Xuất file cuối cùng
```

### Design Checklist
- [ ] Brand colors được sử dụng nhất quán
- [ ] Typography readable và hierarchy rõ ràng  
- [ ] Contrast ratio đạt WCAG AA (4.5:1)
- [ ] Responsive trên mobile
- [ ] CTA rõ ràng và actionable
- [ ] White space đủ, không cluttered
- [ ] Images high-quality, phù hợp tone brand
- [ ] Loading performance tối ưu

---

## Quy tắc bắt buộc

1. **ALWAYS** tạo design WOW-factor, không mediocre
2. **ALWAYS** hỏi về brand colors/fonts nếu chưa có
3. **ALWAYS** tạo HTML preview khi thiết kế logo/banner
4. **NEVER** dùng màu generic (đỏ/xanh thuần), luôn dùng curated palette
5. **ALWAYS** thêm micro-animations cho web UI
6. **ALWAYS** test responsive trước khi deliver
7. Khi generate image: luôn dùng nền trắng cho logo, contextual background cho banners

---

## Tham chiếu nhanh

| Cần | Đọc file |
|-----|---------|
| Logo styles | `references/logo-design.md` |
| Brand guidelines | `references/brand-guidelines.md` |
| Design tokens | `references/design-system.md` |
| UI components | `references/ui-styling.md` |
| Banner sizes | `references/banner-design.md` |
| Social images | `references/social-photos.md` |
| Icon styles | `references/icon-design.md` |
| Slide templates | `references/slides.md` |
