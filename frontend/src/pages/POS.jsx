import React, { useState, useEffect, useRef } from 'react'
import {
  Input, Tag, Badge, Modal, Select, InputNumber, message,
  Typography, Drawer, List, Avatar, Space, Divider, Empty
} from 'antd'
import {
  SearchOutlined, ShoppingCartOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined, PrinterOutlined, UserOutlined
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
  const [printModal, setPrintModal] = useState(false)
  const [printData, setPrintData] = useState(null)
  const printRef = useRef()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [p, c] = await Promise.all([
      api.get('/api/products'),
      api.get('/api/categories')
    ])
    setProducts(p.data)
    setCategories(c.data)
  }

  const searchCustomers = async (q) => {
    if (!q || q.length < 2) return
    const res = await api.get('/api/customers', { params: { q } })
    setCustomers(res.data)
  }

  // Lọc sản phẩm
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !catFilter || p.category_id === catFilter
    return matchSearch && matchCat
  })

  // Cart logic
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
      const res = await api.post('/api/orders', {
        items: cart,
        customer_name: customerName || null,
        discount_amount: 0,
        paid_amount: payMethod === 'debt' ? 0 : paidAmount,
        payment_method: payMethod,
      })
      message.success(`✅ ${res.data.order_no} — Thành công!`)
      if (res.data.debt_amount > 0) message.warning(`Còn nợ: ${fmtMoney(res.data.debt_amount)}`)

      // Lấy dữ liệu in hóa đơn
      try {
        const printRes = await api.get(`/api/orders/${res.data.id}/print`)
        setPrintData(printRes.data)
        setPrintModal(true)
      } catch {}

      setCart([])
      setCustomerName('')
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
    w.document.write(`
      <html><head><title>Hóa đơn</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: monospace; font-size: 12px; width: 300px; padding: 8px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .big { font-size: 15px; font-weight: bold; }
      </style></head><body>${content.innerHTML}</body></html>
    `)
    w.document.close()
    w.focus()
    w.print()
    w.close()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Search + category filter */}
      <div style={{ padding: '10px 12px 0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          placeholder="Tìm sản phẩm, dịch vụ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 8, fontSize: 16 }}
          allowClear
        />
        {/* Category scroll */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
          <Tag
            onClick={() => setCatFilter(null)}
            style={{
              cursor: 'pointer', flexShrink: 0, padding: '4px 12px',
              borderRadius: 20, fontSize: 13,
              background: !catFilter ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
              color: !catFilter ? '#fff' : '#555',
              border: 'none'
            }}
          >Tất cả</Tag>
          {categories.map(c => (
            <Tag key={c.id} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)}
              style={{
                cursor: 'pointer', flexShrink: 0, padding: '4px 12px',
                borderRadius: 20, fontSize: 13,
                background: catFilter === c.id ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#f5f5f5',
                color: catFilter === c.id ? '#fff' : '#555',
                border: 'none'
              }}
            >{c.name}</Tag>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 10px 0' }}>
        {filtered.length === 0
          ? <Empty description="Không tìm thấy sản phẩm" style={{ marginTop: 40 }} />
          : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(product => (
                <div key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    background: '#fff', borderRadius: 12, padding: 12,
                    cursor: 'pointer', textAlign: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    position: 'relative', overflow: 'hidden',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {/* Badge tồn kho thấp */}
                  {product.track_stock && product.stock_qty <= product.min_stock && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      background: '#ff4d4f', color: '#fff',
                      fontSize: 9, padding: '1px 5px', borderRadius: 10, fontWeight: 600
                    }}>Sắp hết</div>
                  )}
                  <div style={{ fontSize: 32, marginBottom: 6 }}>
                    {product.is_service ? '✂️' : '📦'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#667eea' }}>
                    {fmtMoney(product.price)}
                  </div>
                  {product.track_stock && (
                    <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                      Còn: {product.stock_qty} {product.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Floating cart button */}
      {cart.length > 0 && (
        <div style={{
          position: 'sticky', bottom: 0, padding: '10px 12px',
          background: 'linear-gradient(to top, rgba(245,246,250,1) 80%, transparent)',
        }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              width: '100%', height: 52,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: 14,
              color: '#fff', fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 18px', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(102,126,234,0.5)'
            }}
          >
            <span>🛒 Giỏ hàng ({cartCount})</span>
            <span style={{
              background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
              borderRadius: 20, fontSize: 15
            }}>{fmtMoney(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <Drawer
        title={<span>🛒 Giỏ hàng <Tag color="purple">{cartCount} món</Tag></span>}
        placement="bottom"
        height="80dvh"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        styles={{ body: { padding: 0 }, header: { padding: '14px 16px' } }}
        extra={
          <span style={{ color: '#999', fontSize: 12, cursor: 'pointer' }}
            onClick={() => { setCart([]); setCartOpen(false) }}>
            Xóa tất cả
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Cart items */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 14px' }}>
            {cart.map(item => (
              <div key={item.product_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: '1px solid #f5f5f5'
              }}>
                <div style={{ fontSize: 24 }}>{item.product_id?.includes('-') ? '✂️' : '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ fontSize: 13, color: '#667eea', fontWeight: 600 }}>{fmtMoney(item.price)}</div>
                </div>
                {/* Qty control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => updateQty(item.product_id, item.qty - 1)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', background: '#f5f5f5', cursor: 'pointer', fontSize: 18 }}>
                    −
                  </button>
                  <span style={{ width: 28, textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.product_id, item.qty + 1)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #667eea', background: '#667eea', color: '#fff', cursor: 'pointer', fontSize: 18 }}>
                    +
                  </button>
                </div>
                <div style={{ fontWeight: 700, minWidth: 72, textAlign: 'right' }}>
                  {fmtMoney(item.qty * item.price)}
                </div>
                <button onClick={() => removeItem(item.product_id)}
                  style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Customer name (optional) */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid #f0f0f0' }}>
            <Input
              prefix={<UserOutlined style={{ color: '#ccc' }} />}
              placeholder="Tên khách (không bắt buộc)"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              style={{ fontSize: 15 }}
            />
          </div>

          {/* Total + checkout */}
          <div style={{ padding: '12px 14px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng cộng:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ff4d4f' }}>{fmtMoney(subtotal)}</span>
            </div>
            <button onClick={openCheckout} style={{
              width: '100%', height: 52,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: 14, color: '#fff',
              fontSize: 17, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(102,126,234,0.4)'
            }}>
              💳 Thanh toán {fmtMoney(subtotal)}
            </button>
          </div>
        </div>
      </Drawer>

      {/* Payment Modal */}
      <Modal
        title="💳 Xác nhận thanh toán"
        open={payModal}
        onCancel={() => setPayModal(false)}
        onOk={handleCheckout}
        okText="✅ Xác nhận"
        cancelText="Hủy"
        confirmLoading={loading}
        centered
        okButtonProps={{ style: { height: 44, fontSize: 15, fontWeight: 600 } }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{
            background: '#f0f5ff', borderRadius: 12, padding: '14px 16px',
            textAlign: 'center', marginBottom: 16
          }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Tổng tiền</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ff4d4f' }}>{fmtMoney(subtotal)}</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Hình thức thanh toán:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {PAY_METHODS.map(m => (
                <button key={m.value} onClick={() => setPayMethod(m.value)} style={{
                  border: `2px solid ${payMethod === m.value ? '#667eea' : '#e8e8e8'}`,
                  background: payMethod === m.value ? '#f0f5ff' : '#fff',
                  borderRadius: 10, padding: '10px 4px', cursor: 'pointer',
                  fontSize: 13, fontWeight: payMethod === m.value ? 700 : 400,
                  color: payMethod === m.value ? '#667eea' : '#555',
                  transition: 'all 0.15s'
                }}>{m.label}</button>
              ))}
            </div>
          </div>

          {payMethod === 'cash' && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Tiền khách đưa:</div>
              <InputNumber
                style={{ width: '100%', fontSize: 18, height: 48 }}
                value={paidAmount}
                onChange={v => setPaidAmount(v || 0)}
                min={0} step={10000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v.replace(/,/g, '')}
              />
              {paidAmount >= subtotal && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: '#f6ffed', borderRadius: 8, color: '#52c41a', fontWeight: 600 }}>
                  💰 Tiền thối: {fmtMoney(paidAmount - subtotal)}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Print Modal */}
      <Modal
        title="🖨️ In hóa đơn"
        open={printModal}
        onCancel={() => setPrintModal(false)}
        footer={null}
        centered
        width={340}
      >
        {printData && (
          <>
            <div ref={printRef} style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{printData.shop_name}</div>
                {printData.shop_address && <div>{printData.shop_address}</div>}
                {printData.shop_phone && <div>ĐT: {printData.shop_phone}</div>}
              </div>
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>HÓA ĐƠN: {printData.order_no}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
                <span>KH: {printData.customer_name}</span>
                <span>{dayjs(printData.created_at).format('DD/MM/YY HH:mm')}</span>
              </div>
              {printData.staff_name && <div style={{ fontSize: 11 }}>Thợ: {printData.staff_name}</div>}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              {printData.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 8 }}>
                    <span>{item.qty} × {Number(item.price).toLocaleString('vi-VN')}</span>
                    <span style={{ fontWeight: 700 }}>{Number(item.total).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              {printData.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Giảm giá:</span><span>-{Number(printData.discount_amount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 4 }}>
                <span>TỔNG:</span><span>{Number(printData.total).toLocaleString('vi-VN')}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đã thu:</span><span>{Number(printData.paid_amount).toLocaleString('vi-VN')}đ</span>
              </div>
              {printData.debt_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d00' }}>
                  <span>Còn nợ:</span><span>{Number(printData.debt_amount).toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 11, marginTop: 4 }}>Cảm ơn quý khách! 🙏</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
              <button
                onClick={handlePrint}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 24px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <PrinterOutlined /> In hóa đơn
              </button>
              <button
                onClick={() => setPrintModal(false)}
                style={{
                  background: '#f5f5f5', color: '#555', border: '1px solid #e8e8e8',
                  borderRadius: 10, padding: '10px 20px', fontSize: 15, cursor: 'pointer'
                }}
              >Bỏ qua</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
