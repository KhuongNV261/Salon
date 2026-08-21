import React, { useState, useEffect } from 'react'
import {
  Input, Tag, Modal, Form, InputNumber, Select, message,
  Empty, Skeleton, Tabs, Progress, Badge
} from 'antd'
import {
  SearchOutlined, PlusOutlined, WarningOutlined,
  ImportOutlined, ExportOutlined, HistoryOutlined
} from '@ant-design/icons'
import api from '../api'
import dayjs from 'dayjs'

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtNum  = (n) => Number(n || 0).toLocaleString('vi-VN')
const fmtDate = (s) => s ? dayjs(s).format('DD/MM HH:mm') : '-'

const TX_TYPE = {
  import: { label: 'Nhập kho', color: '#52c41a', icon: '📥' },
  export: { label: 'Xuất kho', color: '#ff4d4f', icon: '📤' },
  adjust: { label: 'Điều chỉnh', color: '#fa8c16', icon: '🔧' },
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('stock')
  const [stock, setStock] = useState([])
  const [transactions, setTransactions] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [importModal, setImportModal] = useState(false)
  const [adjustModal, setAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form] = Form.useForm()
  const [adjustForm] = Form.useForm()

  useEffect(() => {
    loadStock()
    loadTransactions()
    loadAllProducts()
  }, [])

  const loadStock = async () => {
    setLoading(true)
    try { const r = await api.get('/api/inventory/stock'); setStock(r.data) }
    finally { setLoading(false) }
  }

  const loadTransactions = async () => {
    try { const r = await api.get('/api/inventory/transactions'); setTransactions(r.data) }
    catch {}
  }

  const loadAllProducts = async () => {
    try { const r = await api.get('/api/products'); setAllProducts(r.data) }
    catch {}
  }

  const handleImport = async (vals) => {
    try {
      const res = await api.post('/api/inventory/import', vals)
      message.success(res.data.message)
      form.resetFields()
      setImportModal(false)
      loadStock()
      loadTransactions()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi nhập kho')
    }
  }

  const handleAdjust = async (vals) => {
    try {
      const res = await api.post('/api/inventory/adjust', vals)
      message.success(res.data.message)
      adjustForm.resetFields()
      setAdjustModal(false)
      loadStock()
      loadTransactions()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi điều chỉnh kho')
    }
  }

  const lowStockItems = stock.filter(p => p.is_low)
  const filtered = stock.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>📦 Kho hàng</div>
        <button
          onClick={() => setImportModal(true)}
          style={{
            background: 'linear-gradient(135deg, #52c41a, #389e0d)',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '8px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
          }}
        >
          📥 Nhập kho
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="stat-card" style={{ borderLeftColor: '#1677ff' }}>
          <div className="stat-label">📦 SP theo dõi</div>
          <div className="stat-value" style={{ color: '#1677ff' }}>{stock.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#ff4d4f' }}>
          <div className="stat-label">⚠️ Sắp hết</div>
          <div className="stat-value" style={{ color: '#ff4d4f' }}>{lowStockItems.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 0 }}
        items={[
          {
            key: 'stock',
            label: `📦 Tồn kho (${stock.length})`,
            children: (
              <>
                {lowStockItems.length > 0 && (
                  <div style={{
                    background: '#fff2f0', border: '1px solid #ffccc7',
                    borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                    display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    <WarningOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                    <span style={{ fontSize: 13, color: '#ff4d4f', fontWeight: 600 }}>
                      {lowStockItems.length} sản phẩm sắp hết hàng!
                    </span>
                  </div>
                )}

                <Input
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  placeholder="Tìm sản phẩm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: 10, borderRadius: 10, height: 40 }}
                  allowClear
                />

                {loading ? (
                  <div className="m-card"><Skeleton active paragraph={{ rows: 5 }} /></div>
                ) : filtered.length === 0 ? (
                  <div className="m-card"><Empty description="Chưa có sản phẩm theo dõi kho" /></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filtered.map(p => {
                      const pct = p.min_stock > 0 ? Math.min(100, (p.stock_qty / p.min_stock) * 50) : 100
                      return (
                        <div
                          key={p.id}
                          className="m-card"
                          style={{ padding: '12px 14px', borderLeft: p.is_low ? '3px solid #ff4d4f' : '3px solid #52c41a' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                                {p.name}
                                {p.is_low && <Tag color="red" style={{ marginLeft: 6, fontSize: 11 }}>⚠️ Sắp hết</Tag>}
                              </div>
                              {p.code && <div style={{ fontSize: 11, color: '#aaa' }}>#{p.code}</div>}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{
                                fontSize: 20, fontWeight: 800,
                                color: p.is_low ? '#ff4d4f' : '#52c41a'
                              }}>
                                {fmtNum(p.stock_qty)}
                              </div>
                              <div style={{ fontSize: 12, color: '#aaa' }}>{p.unit}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 12, fontSize: 12, color: '#888' }}>
                            <span>Tối thiểu: {fmtNum(p.min_stock)} {p.unit}</span>
                            <span>Giá vốn: {fmtMoney(p.cost)}</span>
                          </div>
                          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => { setSelectedProduct(p); form.setFieldValue('product_id', p.id); setImportModal(true) }}
                              style={{
                                flex: 1, height: 32, background: '#f6ffed', border: '1px solid #b7eb8f',
                                borderRadius: 8, color: '#52c41a', fontWeight: 600, fontSize: 12, cursor: 'pointer'
                              }}
                            >📥 Nhập</button>
                            <button
                              onClick={() => { setSelectedProduct(p); adjustForm.setFieldValue('product_id', p.id); adjustForm.setFieldValue('new_qty', p.stock_qty); setAdjustModal(true) }}
                              style={{
                                flex: 1, height: 32, background: '#fff7e6', border: '1px solid #ffd591',
                                borderRadius: 8, color: '#fa8c16', fontWeight: 600, fontSize: 12, cursor: 'pointer'
                              }}
                            >🔧 Kiểm kê</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )
          },
          {
            key: 'history',
            label: `📋 Lịch sử (${transactions.length})`,
            children: (
              transactions.length === 0 ? (
                <div className="m-card"><Empty description="Chưa có lịch sử nhập/xuất" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {transactions.map(t => {
                    const typeInfo = TX_TYPE[t.transaction_type] || TX_TYPE.adjust
                    return (
                      <div key={t.id} style={{
                        background: '#fff', borderRadius: 10, padding: '10px 14px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        borderLeft: `3px solid ${typeInfo.color}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {typeInfo.icon} {t.product_name}
                            </div>
                            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                              {t.created_by_name} · {fmtDate(t.created_at)}
                            </div>
                            {t.note && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>📝 {t.note}</div>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag color={t.transaction_type === 'import' ? 'green' : t.transaction_type === 'export' ? 'red' : 'orange'}>
                              {typeInfo.label}
                            </Tag>
                            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: typeInfo.color }}>
                              {t.qty > 0 ? '+' : ''}{fmtNum(t.qty)}
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>
                              {fmtNum(t.qty_before)} → {fmtNum(t.qty_after)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )
          }
        ]}
      />

      {/* Import Modal */}
      <Modal
        title="📥 Nhập kho"
        open={importModal}
        onCancel={() => { setImportModal(false); form.resetFields(); setSelectedProduct(null) }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleImport}>
          <Form.Item name="product_id" label="Sản phẩm" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Chọn sản phẩm..."
              filterOption={(input, opt) => opt.label?.toLowerCase().includes(input.toLowerCase())}
              options={allProducts.map(p => ({ value: p.id, label: `${p.name}${p.code ? ` [${p.code}]` : ''}` }))}
            />
          </Form.Item>
          <Form.Item name="qty" label="Số lượng nhập" rules={[{ required: true, message: 'Nhập số lượng' }]}>
            <InputNumber min={0.01} placeholder="10" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cost" label="Giá vốn/đơn vị (không bắt buộc)">
            <InputNumber min={0} placeholder="0" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input placeholder="Nhà cung cấp, lý do..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setImportModal(false); form.resetFields() }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #52c41a, #389e0d)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              ✅ Nhập kho
            </button>
          </div>
        </Form>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        title="🔧 Kiểm kê / Điều chỉnh kho"
        open={adjustModal}
        onCancel={() => { setAdjustModal(false); adjustForm.resetFields(); setSelectedProduct(null) }}
        footer={null}
      >
        {selectedProduct && (
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>{selectedProduct.name}</div>
            <div style={{ fontSize: 13, color: '#888' }}>Tồn hiện tại: <strong>{fmtNum(selectedProduct.stock_qty)}</strong> {selectedProduct.unit}</div>
          </div>
        )}
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjust}>
          <Form.Item name="product_id" hidden><Input /></Form.Item>
          <Form.Item name="new_qty" label="Số lượng thực tế (sau kiểm kê)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Lý do điều chỉnh">
            <Input placeholder="Kiểm kê định kỳ, hàng hỏng..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setAdjustModal(false); adjustForm.resetFields() }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}>
              Hủy
            </button>
            <button type="submit"
              style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #fa8c16, #d46b08)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              ✅ Lưu điều chỉnh
            </button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
