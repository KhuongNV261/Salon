import React, { useState, useEffect, useRef } from 'react'
import {
  Input, Tag, Badge, Modal, Select, InputNumber, message,
  Typography, Drawer, List, Avatar, Space, Divider, Empty
} from 'antd'
import {
  SearchOutlined, ShoppingCartOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined, PrinterOutlined, UserOutlined,
  QrcodeOutlined, CopyOutlined
} from '@ant-design/icons'
import api from '../api'
import useStore from '../store'
import dayjs from 'dayjs'

const { Text } = Typography
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

const PAY_METHODS = [
  { value: 'cash', label: '💵 Tiền mặt' },
  { value: 'transfer', label: '📲 Chuyển khoản' },
  { value: 'debt', label: '📋 Ghi nợ' },
]

// Tạo URL QR VietQR
function makeVietQRUrl({ bankName, accountNo, accountName, amount, note }) {
  const BANK_MAP = {
    'vietcombank': 'VCB', 'vcb': 'VCB',
    'mb bank': 'MB', 'mb': 'MB', 'mbbank': 'MB',
    'techcombank': 'TCB', 'tcb': 'TCB',
    'vietinbank': 'ICB', 'icb': 'ICB',
    'bidv': 'BIDV', 'agribank': 'VBA', 'acb': 'ACB',
    'sacombank': 'STB', 'stb': 'STB',
    'tpbank': 'TPB', 'vpbank': 'VPB', 'vpb': 'VPB',
    'hdbank': 'HDB', 'ocb': 'OCB', 'msb': 'MSB',
    'seabank': 'SEAB', 'vib': 'VIB', 'scb': 'SCB',
    'lienvietpostbank': 'LPB', 'lpb': 'LPB',
    'eximbank': 'EIB', 'dongabank': 'DAB',
  }
  const bk = BANK_MAP[bankName?.toLowerCase()?.trim()] || bankName?.toUpperCase() || 'MB'
  const amtParam = amount ? `&amount=${Math.round(amount)}` : ''
  const noteParam = note ? `&addInfo=${encodeURIComponent(note)}` : ''
  const nameParam = accountName ? `&accountName=${encodeURIComponent(accountName)}` : ''
  return `https://img.vietqr.io/image/${bk}-${accountNo}-compact2.png?${amtParam}${noteParam}${nameParam}`
}

function VietQRPanel({ amount, orderNote, shopSettings }) {
  const { bank_name, bank_account_number, bank_account_name, bank_transfer_note } = shopSettings || {}
  const [copied, setCopied] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const note = bank_transfer_note || orderNote || 'Thanh toan'
  const qrUrl = bank_account_number
    ? makeVietQRUrl({ bankName: bank_name, accountNo: bank_account_number, accountName: bank_account_name, amount, note })
    : null

  const copyAcct = () => {
    navigator.clipboard?.writeText(bank_account_number || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!bank_account_number) {
    return (
      <div style={{ textAlign: 'center', padding: '16px', background: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f' }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>⚙️</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#874d00', marginBottom: 4 }}>Chưa cấu hình ngân hàng</div>
        <div style={{ fontSize: 12, color: '#888' }}>Vào Cài đặt → Thanh toán chuyển khoản để thiết lập QR</div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: '#f8faff', borderRadius: 14, padding: 10, marginBottom: 10,
        border: '2px solid #e8e8ff', minHeight: 180
      }}>
        {!imgLoaded && !imgError && <div style={{ color: '#aaa', fontSize: 13 }}>⏳ Đang tạo QR...</div>}
        {imgError && (
          <div style={{ color: '#ff4d4f', fontSize: 12 }}>
            <div style={{ fontSize: 24 }}>❌</div>
            <div>Không tải được QR. Kiểm tra tên ngân hàng.</div>
          </div>
        )}
        {qrUrl && (
          <img src={qrUrl} alt="VietQR"
            style={{ maxWidth: 190, maxHeight: 210, display: imgLoaded ? 'block' : 'none', borderRadius: 8 }}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(false) }}
          />
        )}
      </div>
      <div style={{ background: '#f0f5ff', borderRadius: 12, padding: '10px 14px', marginBottom: 8, textAlign: 'left' }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>🏦 Thông tin chuyển khoản</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{bank_name}</div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1, color: '#4f46e5' }}>{bank_account_number}</div>
            <div style={{ fontSize: 13, color: '#555' }}>{bank_account_name}</div>
          </div>
          <button onClick={copyAcct} style={{
            background: copied ? '#52c41a' : '#667eea', color: '#fff',
            border: 'none', borderRadius: 8, padding: '6px 12px',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>
            {copied ? '✅ Đã copy' : '📋 Copy STK'}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0 0', marginTop: 8, borderTop: '1px dashed #d0d7f0' }}>
          <span style={{ color: '#888' }}>Số tiền:</span>
          <span style={{ fontWeight: 800, color: '#ff4d4f', fontSize: 16 }}>{fmtMoney(amount)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          Nội dung: <span style={{ color: '#333', fontWeight: 600 }}>{note}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#aaa' }}>📱 Quét QR hoặc chuyển khoản theo thông tin trên</div>
    </div>
  )
}

export default function POS() {
  const { user } = useStore()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [payMethod, setPayMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [printModal, setPrintModal] = useState(false)
  const [printData, setPrintData] = useState(null)
  const [shopSettings, setShopSettings] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  // Gợi ý gói khách hàng
  const [customerPackages, setCustomerPackages] = useState([])
  const [pkgSuggestion, setPkgSuggestion] = useState(null) // gói được gợi ý
  // Chọn thợ từng item (main + assist)
  const [itemStaffModal, setItemStaffModal] = useState(null) // { product_id, product_name }
  const [itemMainStaff, setItemMainStaff] = useState({})
  const [itemAssistStaff, setItemAssistStaff] = useState({})
  const printRef = useRef()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [p, c, s, staff] = await Promise.all([
      api.get('/api/products'),
      api.get('/api/categories'),
      api.get('/api/settings').catch(() => ({ data: {} })),
      api.get('/api/staff').catch(() => ({ data: [] })),
    ])
    setProducts(p.data)
    setCategories(c.data)
    setShopSettings(s.data)
    setStaffList((staff.data || []).filter(u => u.is_active))
  }

  const searchCustomers = async (q) => {
    if (!q || q.length < 2) return
    const res = await api.get('/api/customers', { params: { q } })
    setCustomers(res.data)
  }

  const onSelectCustomer = async (val, opt) => {
    setSelectedCustomerId(val || null)
    if (!val) { setCustomerName(''); setCustomerPackages([]); setPkgSuggestion(null); return }
    // Load gói đang hoạt động của khách
    try {
      const r = await api.get(`/api/customers/${val}/packages/active`)
      const active = (r.data || []).filter(p => p.status === 'active' && p.remaining_sessions > 0)
      setCustomerPackages(active)
      if (active.length > 0) setPkgSuggestion(active[0])
    } catch { setCustomerPackages([]) }
  }

  const updateItemStaff = (product_id, field, val) => {
    if (field === 'main') setItemMainStaff(p => ({ ...p, [product_id]: val }))
    else setItemAssistStaff(p => ({ ...p, [product_id]: val }))
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category_id === catFilter
    return matchSearch && matchCat
  })

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, {
        product_id: product.id, product_name: product.name,
        unit: product.unit, price: product.price, cost: product.cost,
        qty: 1, discount_amount: 0
      }]
    })
  }

  const updateQty = (product_id, qty) => {
    if (qty <= 0) { setCart(c => c.filter(i => i.product_id !== product_id)); return }
    setCart(c => c.map(i => i.product_id === product_id ? { ...i, qty } : i))
  }

  const removeItem = (product_id) => setCart(c => c.filter(i => i.product_id !== product_id))

  const subtotal = cart.reduce((s, i) => s + i.qty * i.price - (i.discount_amount || 0), 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const openCheckout = () => {
    setPaidAmount(subtotal)
    setPayModal(true)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return message.warning('Giỏ hàng trống!')
    setLoading(true)
    try {
      // Build items với thợ chính/phụ từng item
      const itemsWithStaff = cart.map(item => {
        const mainId = itemMainStaff[item.product_id] || selectedStaff || null
        const assistId = itemAssistStaff[item.product_id] || null
        const mainStaff = mainId ? staffList.find(s => s.id === mainId) : null
        const assistStaff = assistId ? staffList.find(s => s.id === assistId) : null
        return {
          ...item,
          main_staff_id: mainId,
          main_staff_name: mainStaff?.name || null,
          assist_staff_id: assistId,
          assist_staff_name: assistStaff?.name || null,
        }
      })
      const res = await api.post('/api/orders', {
        items: itemsWithStaff,
        customer_id: selectedCustomerId || null,
        customer_name: customerName || null,
        discount_amount: 0,
        paid_amount: payMethod === 'debt' ? 0 : paidAmount,
        payment_method: payMethod,
        staff_name: selectedStaff ? (staffList.find(s => s.id === selectedStaff)?.name || null) : null,
      })
      message.success('✅ ' + res.data.order_no)
      if (res.data.debt_amount > 0) message.warning('Còn nợ: ' + fmtMoney(res.data.debt_amount))
      try {
        const printRes = await api.get('/api/orders/' + res.data.id + '/print')
        setPrintData(printRes.data)
        setPrintModal(true)
      } catch {}
      setCart([])
      setCustomerName('')
      setSelectedCustomerId(null)
      setSelectedStaff(null)
      setItemMainStaff({})
      setItemAssistStaff({})
      setCustomerPackages([])
      setPkgSuggestion(null)
      setPayModal(false)
      setCartOpen(false)
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi tạo đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const w = window.open('', '_blank', 'width=400,height=600')
    w.document.write('<html><head><title>Hoa don</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: monospace; font-size: 12px; width: 300px; padding: 8px; } .center { text-align: center; } .bold { font-weight: bold; } .line { border-top: 1px dashed #000; margin: 6px 0; } .row { display: flex; justify-content: space-between; margin: 2px 0; } .big { font-size: 15px; font-weight: bold; }</style></head><body>' + content.innerHTML + '</body></html>')
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  const tempOrderNote = shopSettings?.bank_transfer_note || ('TT ' + dayjs().format('DDMMHHmm'))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      <div style={{ padding: '10px 12px 0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          placeholder="Tim san pham, dich vu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 8, fontSize: 16 }}
          allowClear
        />
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          <Tag onClick={() => setCatFilter(null)} style={{
            cursor: 'pointer', flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 13,
            background: !catFilter ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
            color: !catFilter ? '#fff' : '#555', border: 'none'
          }}>Tat ca</Tag>
          {categories.map(c => (
            <Tag key={c.id} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)} style={{
              cursor: 'pointer', flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 13,
              background: catFilter === c.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
              color: catFilter === c.id ? '#fff' : '#555', border: 'none'
            }}>{c.name}</Tag>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 10px 0' }}>
        {filtered.length === 0
          ? <Empty description="Khong tim thay san pham" style={{ marginTop: 40 }} />
          : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(product => {
                const inCart = cart.find(i => i.product_id === product.id)
                return (
                  <div key={product.id} onClick={() => addToCart(product)} style={{
                    background: inCart ? '#f0f5ff' : '#fff', borderRadius: 12, padding: 12,
                    cursor: 'pointer', textAlign: 'center',
                    boxShadow: inCart ? '0 2px 8px rgba(102,126,234,0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
                    border: inCart ? '2px solid #667eea' : '2px solid transparent',
                    transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
                    WebkitTapHighlightColor: 'transparent'
                  }}>
                    {product.track_stock && product.stock_qty <= product.min_stock && (
                      <div style={{ position: 'absolute', top: 6, right: 6, background: '#ff4d4f', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 10, fontWeight: 600 }}>Sap het</div>
                    )}
                    {inCart && (
                      <div style={{ position: 'absolute', top: 6, left: 6, background: '#667eea', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>x{inCart.qty}</div>
                    )}
                    <div style={{ fontSize: 30, marginBottom: 6 }}>{product.is_service ? '✂️' : '📦'}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#667eea' }}>{fmtMoney(product.price)}</div>
                    {product.track_stock && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Con: {product.stock_qty} {product.unit}</div>}
                  </div>
                )
              })}
            </div>
        }
      </div>

      {cart.length > 0 && (
        <div style={{ position: 'sticky', bottom: 0, padding: '10px 12px', background: 'linear-gradient(to top, rgba(245,246,250,1) 80%, transparent)' }}>
          <button onClick={() => setCartOpen(true)} style={{
            width: '100%', height: 52,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(102,126,234,0.5)'
          }}>
            <span>🛒 Gio hang ({cartCount})</span>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 15 }}>{fmtMoney(subtotal)}</span>
          </button>
        </div>
      )}

      <Drawer
        title={<span>🛒 Gio hang <Tag color="purple">{cartCount} mon</Tag></span>}
        placement="bottom" height="82dvh"
        open={cartOpen} onClose={() => setCartOpen(false)}
        styles={{ body: { padding: 0 }, header: { padding: '14px 16px' } }}
        extra={<span style={{ color: '#999', fontSize: 12, cursor: 'pointer' }} onClick={() => { setCart([]); setCartOpen(false) }}>Xoa tat ca</span>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px' }}>
            {cart.map(item => {
              const mainStaff = itemMainStaff[item.product_id]
              const assistStaff = itemAssistStaff[item.product_id]
              const mainName = mainStaff ? staffList.find(s => s.id === mainStaff)?.name : null
              const assistName = assistStaff ? staffList.find(s => s.id === assistStaff)?.name : null
              return (
                <div key={item.product_id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 22 }}>✂️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: 13, color: '#667eea', fontWeight: 600 }}>{fmtMoney(item.price)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item.product_id, item.qty - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e8e8e8', background: '#f5f5f5', cursor: 'pointer', fontSize: 16 }}>−</button>
                      <span style={{ width: 24, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.product_id, item.qty + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #667eea', background: '#667eea', color: '#fff', cursor: 'pointer', fontSize: 16 }}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, minWidth: 68, textAlign: 'right', fontSize: 13 }}>{fmtMoney(item.qty * item.price)}</div>
                    <button onClick={() => removeItem(item.product_id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: 18, padding: 4 }}>×</button>
                  </div>
                  {staffList.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, paddingLeft: 32 }}>
                      <Select
                        size="small" allowClear
                        placeholder="✂️ Thợ chính"
                        style={{ flex: 1, fontSize: 12 }}
                        value={mainStaff || undefined}
                        onChange={v => updateItemStaff(item.product_id, 'main', v)}
                        options={staffList.map(s => ({ value: s.id, label: '✂️ ' + s.name }))}
                      />
                      <Select
                        size="small" allowClear
                        placeholder="➕ Thợ phụ"
                        style={{ flex: 1, fontSize: 12 }}
                        value={assistStaff || undefined}
                        onChange={v => updateItemStaff(item.product_id, 'assist', v)}
                        options={staffList.map(s => ({ value: s.id, label: '✂️ ' + s.name }))}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ padding: '8px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Select showSearch allowClear placeholder="👤 Chọn khách hàng..." style={{ width: '100%' }}
              filterOption={false} onSearch={searchCustomers}
              onChange={onSelectCustomer}
              value={selectedCustomerId || undefined} notFoundContent={null}
            >
              {customers.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}{c.phone && <span style={{ color: '#aaa', fontSize: 12 }}> · {c.phone}</span>}
                </Select.Option>
              ))}
            </Select>
            {!selectedCustomerId && (
              <Input prefix={<UserOutlined style={{ color: '#ccc' }} />} placeholder="Hoặc nhập tên khách..." value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ fontSize: 15 }} />
            )}
            {/* Banner gợi ý gói */}
            {pkgSuggestion && (
              <div style={{
                background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
                border: '1px solid #91d5ff', borderRadius: 10,
                padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#003a8c' }}>🎫 Khách có gói dịch vụ!</div>
                  <div style={{ fontSize: 11, color: '#1677ff', marginTop: 2 }}>
                    {pkgSuggestion.package_name} · Còn <b>{pkgSuggestion.remaining_sessions}</b>/{pkgSuggestion.total_sessions} buổi
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/api/customer-packages/${pkgSuggestion.id}/use`, {})
                        message.success('Đã trừ 1 buổi từ gói!')
                        setPkgSuggestion(null)
                        setCustomerPackages([])
                      } catch (e) { message.error(e.response?.data?.error || 'Lỗi') }
                    }}
                    style={{ background: '#1677ff', color: '#fff', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >Dùng gói</button>
                  <button onClick={() => setPkgSuggestion(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 7, padding: '5px 8px', fontSize: 11, color: '#888', cursor: 'pointer' }}>×</button>
                </div>
              </div>
            )}
            {staffList.length > 0 && (
              <Select allowClear placeholder="✂️ Thợ mặc định cho đơn" style={{ width: '100%' }}
                value={selectedStaff} onChange={setSelectedStaff}
                options={staffList.map(s => ({ value: s.id, label: '✂️ ' + s.name }))}
              />
            )}
          </div>

          <div style={{ padding: '12px 14px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Tong cong:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ff4d4f' }}>{fmtMoney(subtotal)}</span>
            </div>
            <button onClick={openCheckout} style={{
              width: '100%', height: 52,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: 14, color: '#fff', fontSize: 17, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(102,126,234,0.4)'
            }}>
              💳 Thanh toan {fmtMoney(subtotal)}
            </button>
          </div>
        </div>
      </Drawer>

      <Modal
        title="💳 Xac nhan thanh toan"
        open={payModal} onCancel={() => setPayModal(false)}
        onOk={handleCheckout} okText="✅ Xac nhan" cancelText="Huy"
        confirmLoading={loading} centered
        okButtonProps={{ style: { height: 44, fontSize: 15, fontWeight: 600 } }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ background: '#f0f5ff', borderRadius: 12, padding: '14px 16px', textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Tong tien</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ff4d4f' }}>{fmtMoney(subtotal)}</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Hinh thuc thanh toan:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {PAY_METHODS.map(m => (
                <button key={m.value} onClick={() => setPayMethod(m.value)} style={{
                  border: '2px solid ' + (payMethod === m.value ? '#667eea' : '#e8e8e8'),
                  background: payMethod === m.value ? '#f0f5ff' : '#fff',
                  borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                  fontSize: 13, fontWeight: payMethod === m.value ? 700 : 400,
                  color: payMethod === m.value ? '#667eea' : '#555', transition: 'all 0.15s'
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {payMethod === 'cash' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tien khach dua:</div>
              <InputNumber style={{ width: '100%', fontSize: 18, height: 48 }}
                value={paidAmount} onChange={v => setPaidAmount(v || 0)}
                min={0} step={10000}
                formatter={v => '' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v.replace(/,/g, '')}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {[50000, 100000, 200000, 500000].map(amt => (
                  <button key={amt} onClick={() => setPaidAmount(amt)} style={{
                    padding: '4px 10px', borderRadius: 8,
                    border: '1px solid ' + (paidAmount === amt ? '#667eea' : '#e8e8e8'),
                    background: paidAmount === amt ? '#667eea' : '#f5f5f5',
                    color: paidAmount === amt ? '#fff' : '#555',
                    fontSize: 12, cursor: 'pointer', fontWeight: 600
                  }}>{(amt / 1000)}k</button>
                ))}
                <button onClick={() => setPaidAmount(subtotal)} style={{
                  padding: '4px 10px', borderRadius: 8,
                  border: '1px solid #667eea',
                  background: paidAmount === subtotal ? '#667eea' : '#f0f5ff',
                  color: paidAmount === subtotal ? '#fff' : '#667eea',
                  fontSize: 12, cursor: 'pointer', fontWeight: 700
                }}>Dung tien</button>
              </div>
              {paidAmount >= subtotal && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 8, color: '#52c41a', fontWeight: 600 }}>
                  💰 Tien thoi: {fmtMoney(paidAmount - subtotal)}
                </div>
              )}
            </div>
          )}

          {payMethod === 'transfer' && (
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#667eea' }}>
                🏦 Ma QR chuyen khoan VietQR
              </div>
              <VietQRPanel amount={subtotal} orderNote={tempOrderNote} shopSettings={shopSettings} />
            </div>
          )}

          {payMethod === 'debt' && (
            <div style={{ padding: '10px 14px', background: '#fff7e6', borderRadius: 10, border: '1px solid #ffd591', fontSize: 13, color: '#874d00' }}>
              📋 Don hang se duoc ghi vao cong no khach hang. Thanh toan sau.
            </div>
          )}
        </div>
      </Modal>

      <Modal title="🖨️ In hoa don" open={printModal} onCancel={() => setPrintModal(false)} footer={null} centered width={340}>
        {printData && (
          <>
            <div ref={printRef} style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{printData.shop_name}</div>
                {printData.shop_address && <div>{printData.shop_address}</div>}
                {printData.shop_phone && <div>DT: {printData.shop_phone}</div>}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>HOA DON: {printData.order_no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
                <span>KH: {printData.customer_name}</span>
                <span>{dayjs(printData.created_at).format('DD/MM/YY HH:mm')}</span>
              </div>
              {printData.staff_name && <div style={{ fontSize: 11 }}>Tho: {printData.staff_name}</div>}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              {printData.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                    <span>{item.qty} x {Number(item.price).toLocaleString('vi-VN')}</span>
                    <span style={{ fontWeight: 700 }}>{Number(item.total).toLocaleString('vi-VN')}d</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              {printData.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Giam gia:</span><span>-{Number(printData.discount_amount).toLocaleString('vi-VN')}d</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                <span>TONG:</span><span>{Number(printData.total).toLocaleString('vi-VN')}d</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Da thu:</span><span>{Number(printData.paid_amount).toLocaleString('vi-VN')}d</span>
              </div>
              {printData.debt_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d00' }}>
                  <span>Con no:</span><span>{Number(printData.debt_amount).toLocaleString('vi-VN')}d</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 11, marginTop: 4 }}>Cam on quy khach! 🙏</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <button onClick={handlePrint} style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
                border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}><PrinterOutlined /> In hoa don</button>
              <button onClick={() => setPrintModal(false)} style={{
                background: '#f5f5f5', color: '#555', border: '1px solid #e8e8e8',
                borderRadius: 10, padding: '10px 20px', fontSize: 15, cursor: 'pointer'
              }}>Bo qua</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
