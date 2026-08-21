import React, { useState, useEffect, useRef } from 'react'
import {
  Input, Tag, Modal, Button, Form, message, Empty,
  Skeleton, Divider, Badge, Drawer
} from 'antd'
import {
  SearchOutlined, PlusOutlined, UserOutlined,
  PhoneOutlined, RightOutlined
} from '@ant-design/icons'
import api from '../api'
import dayjs from 'dayjs'

const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtDate = (s) => s ? dayjs(s).format('DD/MM/YY HH:mm') : '-'

const STATUS_MAP = {
  completed: { color: 'success', label: 'Hoàn thành' },
  debt:      { color: 'warning', label: 'Còn nợ' },
  cancelled: { color: 'error',   label: 'Đã hủy' },
}

const PAY_MAP = {
  cash: '💵 TM', transfer: '📲 CK', debt: '📋 Nợ'
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [payDebtModal, setPayDebtModal] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [orderDetail, setOrderDetail] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [form] = Form.useForm()
  const searchTimer = useRef(null)

  useEffect(() => { loadCustomers('') }, [])

  const loadCustomers = async (q) => {
    setLoading(true)
    try {
      const res = await api.get('/api/customers', { params: { q } })
      setCustomers(res.data)
    } finally { setLoading(false) }
  }

  const handleSearch = (val) => {
    setSearch(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadCustomers(val), 400)
  }

  const openDetail = async (c) => {
    setSelected(c)
    setDrawerOpen(true)
    setDetailLoading(true)
    try {
      const res = await api.get(`/api/customers/${c.id}`)
      setDetail(res.data)
    } catch { setDetail(null) }
    finally { setDetailLoading(false) }
  }

  const handlePayDebt = async () => {
    const amount = parseFloat(payAmount.replace(/,/g, ''))
    if (!amount || amount <= 0) { message.error('Nhập số tiền hợp lệ'); return }
    setPayLoading(true)
    try {
      const res = await api.post(`/api/customers/${selected.id}/pay-debt`, { amount })
      message.success(res.data.message)
      setPayDebtModal(false)
      setPayAmount('')
      // Reload detail
      const r2 = await api.get(`/api/customers/${selected.id}`)
      setDetail(r2.data)
      // Reload list
      loadCustomers(search)
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi thu nợ')
    } finally { setPayLoading(false) }
  }

  const handleAddCustomer = async (vals) => {
    try {
      await api.post('/api/customers', vals)
      message.success('Đã thêm khách hàng')
      form.resetFields()
      setAddModal(false)
      loadCustomers(search)
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi tạo khách hàng')
    }
  }

  const openOrderDetail = async (orderId) => {
    setOrderDetailLoading(true)
    setOrderDetail({ loading: true })
    try {
      const res = await api.get(`/api/orders/${orderId}/items`)
      setOrderDetail(res.data)
    } catch {
      setOrderDetail(null)
      message.error('Không tải được chi tiết đơn hàng')
    } finally {
      setOrderDetailLoading(false)
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>👥 Khách hàng</div>
        <button
          onClick={() => setAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none', borderRadius: 10, color: '#fff',
            padding: '8px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <PlusOutlined /> Thêm mới
        </button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="stat-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="stat-label">👥 Tổng KH</div>
          <div className="stat-value" style={{ color: '#667eea' }}>{customers.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#ff4d4f' }}>
          <div className="stat-label">📋 Đang nợ</div>
          <div className="stat-value" style={{ color: '#ff4d4f' }}>
            {customers.filter(c => c.debt > 0).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <Input
        prefix={<SearchOutlined style={{ color: '#bbb' }} />}
        placeholder="Tìm theo tên hoặc số điện thoại..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        style={{ marginBottom: 12, borderRadius: 10, height: 40 }}
        allowClear
      />

      {/* List */}
      {loading ? (
        <div className="m-card"><Skeleton active paragraph={{ rows: 6 }} /></div>
      ) : customers.length === 0 ? (
        <div className="m-card"><Empty description="Chưa có khách hàng" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {customers.map(c => (
            <div
              key={c.id}
              className="m-card"
              onClick={() => openDetail(c)}
              style={{ cursor: 'pointer', padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                    <UserOutlined style={{ marginRight: 6, color: '#667eea' }} />{c.name}
                  </div>
                  {c.phone && (
                    <div style={{ fontSize: 13, color: '#888' }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />{c.phone}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                    Đã mua: {fmtMoney(c.total_spent)} · {c.visit_count} lần
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {c.debt > 0 ? (
                    <Tag color="red" style={{ fontWeight: 700, fontSize: 13 }}>
                      Nợ: {fmtMoney(c.debt)}
                    </Tag>
                  ) : (
                    <Tag color="success">✅ Không nợ</Tag>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            <span>{selected?.name}</span>
            {detail?.debt > 0 && <Tag color="red">Nợ {fmtMoney(detail.debt)}</Tag>}
          </div>
        }
        placement="bottom"
        height="85dvh"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0, overflowY: 'auto' } }}
      >
        {detailLoading ? (
          <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 8 }} /></div>
        ) : detail ? (
          <div>
            {/* Info section */}
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div className="stat-card" style={{ borderLeftColor: '#52c41a' }}>
                  <div className="stat-label">💰 Tổng chi tiêu</div>
                  <div className="stat-value" style={{ color: '#52c41a', fontSize: 16 }}>
                    {fmtMoney(detail.total_spent)}
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: '#ff4d4f' }}>
                  <div className="stat-label">📋 Công nợ</div>
                  <div className="stat-value" style={{ color: '#ff4d4f', fontSize: 16 }}>
                    {fmtMoney(detail.debt)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {detail.phone && (
                  <Tag icon={<PhoneOutlined />}>{detail.phone}</Tag>
                )}
                <Tag>{detail.visit_count} lần ghé thăm</Tag>
                {detail.last_visit_at && (
                  <Tag color="blue">Lần cuối: {fmtDate(detail.last_visit_at)}</Tag>
                )}
              </div>
              {detail.address && (
                <div style={{ fontSize: 13, color: '#888' }}>📍 {detail.address}</div>
              )}
              {detail.note && (
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📝 {detail.note}</div>
              )}

              {detail.debt > 0 && (
                <button
                  onClick={() => setPayDebtModal(true)}
                  style={{
                    width: '100%', marginTop: 12, height: 44,
                    background: 'linear-gradient(135deg, #ff7875, #ff4d4f)',
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 15, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  💰 Thu nợ {fmtMoney(detail.debt)}
                </button>
              )}
            </div>

            {/* Orders history */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#555' }}>
                🧾 Lịch sử giao dịch ({detail.orders?.length || 0})
              </div>
              {detail.orders?.length === 0 ? (
                <Empty description="Chưa có giao dịch" style={{ padding: '20px 0' }} />
              ) : (
                detail.orders.map(o => (
                  <div key={o.id}
                    onClick={() => openOrderDetail(o.id)}
                    style={{
                      padding: '10px 0', borderBottom: '1px solid #f5f5f5',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{o.order_no}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>
                        {fmtDate(o.created_at)} · {PAY_MAP[o.payment_method] || o.payment_method}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>{fmtMoney(o.total)}</div>
                        {o.debt_amount > 0 && (
                          <div style={{ fontSize: 12, color: '#ff4d4f' }}>Nợ: {fmtMoney(o.debt_amount)}</div>
                        )}
                        <Tag
                          color={STATUS_MAP[o.status]?.color || 'default'}
                          style={{ fontSize: 11, marginTop: 2 }}
                        >
                          {STATUS_MAP[o.status]?.label || o.status}
                        </Tag>
                      </div>
                      <RightOutlined style={{ color: '#ccc', fontSize: 12 }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div style={{ padding: 16 }}><Empty description="Không tải được dữ liệu" /></div>
        )}
      </Drawer>

      {/* Pay Debt Modal */}
      <Modal
        title={`💰 Thu nợ - ${selected?.name}`}
        open={payDebtModal}
        onCancel={() => { setPayDebtModal(false); setPayAmount('') }}
        onOk={handlePayDebt}
        okText="Xác nhận thu"
        cancelText="Hủy"
        okButtonProps={{ loading: payLoading, danger: true }}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 15, marginBottom: 12, color: '#555' }}>
            Số nợ hiện tại: <strong style={{ color: '#ff4d4f' }}>{fmtMoney(detail?.debt)}</strong>
          </div>
          <Input
            value={payAmount}
            onChange={e => setPayAmount(e.target.value)}
            placeholder="Nhập số tiền thu (VD: 100000)"
            prefix="₫"
            size="large"
            style={{ borderRadius: 10 }}
            onPressEnter={handlePayDebt}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {[50000, 100000, 200000].map(v => (
              <button key={v}
                onClick={() => setPayAmount(String(v))}
                style={{
                  background: '#f5f5f5', border: '1px solid #e8e8e8',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13
                }}
              >{fmtMoney(v)}</button>
            ))}
            {detail?.debt > 0 && (
              <button
                onClick={() => setPayAmount(String(detail.debt))}
                style={{
                  background: '#fff2f0', border: '1px solid #ffccc7',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#ff4d4f'
                }}
              >Thu hết {fmtMoney(detail.debt)}</button>
            )}
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        title={orderDetail?.order_no ? `🧾 ${orderDetail.order_no}` : '🧾 Chi tiết đơn hàng'}
        open={!!orderDetail}
        onCancel={() => setOrderDetail(null)}
        footer={null}
        centered
        width={400}
      >
        {orderDetailLoading || orderDetail?.loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : orderDetail ? (
          <div>
            {/* Header info */}
            <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#888' }}>Ngày:</span>
                <span style={{ fontWeight: 600 }}>{orderDetail.created_at ? dayjs(orderDetail.created_at).format('DD/MM/YYYY HH:mm') : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#888' }}>Nhân viên:</span>
                <span style={{ fontWeight: 600 }}>{orderDetail.staff_name || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#888' }}>Thanh toán:</span>
                <span style={{ fontWeight: 600 }}>{PAY_MAP[orderDetail.payment_method] || orderDetail.payment_method}</span>
              </div>
            </div>

            {/* Items */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#555' }}>Dịch vụ / Sản phẩm:</div>
            {(orderDetail.items || []).map((item, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderBottom: i < orderDetail.items.length - 1 ? '1px solid #f5f5f5' : 'none',
                fontSize: 13
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>
                    {item.qty} × {Number(item.price).toLocaleString('vi-VN')}đ
                    {item.staff_name ? ` · ${item.staff_name}` : ''}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#333' }}>
                  {Number(item.total).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))}

            {/* Totals */}
            <div style={{ borderTop: '2px solid #f0f0f0', marginTop: 10, paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
                <span>Tổng cộng:</span>
                <span style={{ color: '#667eea' }}>{fmtMoney(orderDetail.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#52c41a', marginTop: 4 }}>
                <span>Đã thu:</span>
                <span style={{ fontWeight: 600 }}>{fmtMoney(orderDetail.paid_amount)}</span>
              </div>
              {orderDetail.debt_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#ff4d4f', marginTop: 4 }}>
                  <span>Còn nợ:</span>
                  <span style={{ fontWeight: 700 }}>{fmtMoney(orderDetail.debt_amount)}</span>
                </div>
              )}
              {orderDetail.note && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#888', fontStyle: 'italic' }}>📝 {orderDetail.note}</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        title="➕ Thêm khách hàng"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields() }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCustomer}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Nhập tên khách hàng' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Địa chỉ (không bắt buộc)" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={2} placeholder="Ghi chú..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setAddModal(false); form.resetFields() }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Lưu</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
