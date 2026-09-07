import React, { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Space, Tag, Popconfirm, message, Card, Typography, Avatar,
  Drawer, Statistic, Row, Col, Badge, DatePicker, Divider, Switch, Tooltip, Grid
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  TrophyOutlined, DollarOutlined, BellOutlined, BellFilled, PhoneOutlined
} from '@ant-design/icons'
import api from '../api'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { useBreakpoint } = Grid
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

const ROLE_LABELS = {
  owner:   { label: 'Chủ tiệm',  color: 'gold' },
  manager: { label: 'Quản lý',   color: 'blue' },
  staff:   { label: 'Nhân viên', color: 'green' },
  cashier: { label: 'Thu ngân',  color: 'cyan' },
}

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [commDrawer, setCommDrawer] = useState(null)
  const [commData, setCommData] = useState(null)
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs()])
  const [form] = Form.useForm()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await api.get('/api/staff')
    setStaff(res.data)
  }

  const openModal = (record = null) => {
    setEditing(record)
    form.resetFields()
    if (record) {
      form.setFieldsValue({
        name: record.name, phone: record.phone,
        role: record.role, commission_rate: record.commission_rate,
        is_active: record.is_active
      })
    } else {
      form.setFieldsValue({ role: 'staff', commission_rate: 0, is_active: true })
    }
    setModal(true)
  }

  const save = async (vals) => {
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/api/staff/${editing.id}`, vals)
        message.success('Cập nhật nhân viên thành công!')
      } else {
        await api.post('/api/staff', { ...vals, password: vals.password || '123456' })
        message.success(`Tạo tài khoản thành công! Mật khẩu mặc định: ${vals.password || '123456'}`)
      }
      setModal(false)
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Có lỗi xảy ra')
    } finally { setLoading(false) }
  }

  const deleteStaff = async (id) => {
    await api.delete(`/api/staff/${id}`)
    message.success('Đã vô hiệu hóa tài khoản!')
    load()
  }

  const toggleNotify = async (record) => {
    setToggling(record.id)
    try {
      const res = await api.patch(`/api/staff/${record.id}/notify-toggle`)
      const nowOn = res.data.notify_upcoming
      message.success(
        nowOn
          ? `🔔 Bật thông báo cho ${record.name}`
          : `🔕 Tắt thông báo cho ${record.name}`
      )
      setStaff(prev => prev.map(s => s.id === record.id ? { ...s, notify_upcoming: nowOn } : s))
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi')
    } finally { setToggling(null) }
  }

  const loadCommission = async (staffId, range) => {
    const [from, to] = range || dateRange
    const res = await api.get(`/api/staff/${staffId}/commission`, {
      params: { date_from: from.format('YYYY-MM-DD'), date_to: to.format('YYYY-MM-DD') }
    })
    setCommData(res.data)
  }

  const openCommission = async (record) => {
    setCommDrawer(record)
    await loadCommission(record.id, dateRange)
  }

  const notifyCount = staff.filter(s => s.notify_upcoming && s.is_active).length

  // ========= Columns cho desktop =========
  const columns = [
    {
      title: 'Nhân viên',
      render: (_, r) => (
        <Space>
          <Avatar style={{ background: r.role === 'owner' ? '#f39c12' : '#667eea', flexShrink: 0 }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {r.phone && (
                <a href={`tel:${r.phone}`} style={{ color: '#888' }}>
                  <PhoneOutlined style={{ marginRight: 3 }} />{r.phone}
                </a>
              )}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      render: v => {
        const info = ROLE_LABELS[v] || { label: v, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      }
    },
    {
      title: '% Hoa hồng',
      dataIndex: 'commission_rate',
      align: 'center',
      render: v => (
        <Tag color={v > 0 ? 'purple' : 'default'} style={{ fontSize: 14, padding: '2px 10px' }}>
          {v > 0 ? `${v}%` : '—'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      align: 'center',
      render: v => <Badge status={v ? 'success' : 'error'} text={v ? 'Đang làm' : 'Nghỉ việc'} />
    },
    {
      title: (
        <Tooltip title="Bật để nhận cảnh báo khi nhân viên này sắp có lịch hẹn trong 30 phút.">
          <span style={{ cursor: 'help' }}>🔔 Nhắc lịch <span style={{ fontSize: 10, color: '#aaa' }}>(?)</span></span>
        </Tooltip>
      ),
      dataIndex: 'notify_upcoming',
      align: 'center',
      render: (val, record) => (
        <button
          onClick={() => toggleNotify(record)}
          disabled={toggling === record.id || !record.is_active}
          style={{
            background: 'none', border: 'none', cursor: record.is_active ? 'pointer' : 'not-allowed',
            padding: '4px 8px', borderRadius: 8,
            transition: 'all 0.2s',
            opacity: record.is_active ? 1 : 0.4,
          }}
        >
          {toggling === record.id
            ? <span style={{ color: '#aaa', fontSize: 18 }}>⏳</span>
            : val
              ? <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 4px #fa8c16)' }}>🔔</span>
              : <span style={{ fontSize: 20, opacity: 0.35 }}>🔕</span>
          }
        </button>
      )
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'last_login_at',
      render: v => v ? dayjs(v).format('DD/MM HH:mm') : <Text type="secondary">Chưa đăng nhập</Text>
    },
    {
      title: 'Thao tác',
      width: 120,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<TrophyOutlined />} type="primary" ghost onClick={() => openCommission(r)} title="Xem hoa hồng">HH</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)} />
          <Popconfirm
            title="Vô hiệu hóa tài khoản này?"
            description="Nhân viên sẽ không đăng nhập được nữa."
            onConfirm={() => deleteStaff(r.id)}
            okText="Xác nhận" cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={r.role === 'owner'} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // ========= Card mobile cho từng nhân viên =========
  const StaffCard = ({ r }) => {
    const roleInfo = ROLE_LABELS[r.role] || { label: r.role, color: 'default' }
    return (
      <Card
        key={r.id}
        style={{
          marginBottom: 10,
          borderRadius: 12,
          border: '1px solid #f0f0f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          opacity: r.is_active ? 1 : 0.6,
        }}
        bodyStyle={{ padding: '12px 14px' }}
      >
        {/* Dòng 1: Avatar + Tên + Trạng thái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar
            size={44}
            style={{ background: r.role === 'owner' ? '#f39c12' : '#667eea', flexShrink: 0 }}
            icon={<UserOutlined />}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: '20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.name}
            </div>
            {r.phone && (
              <a href={`tel:${r.phone}`} style={{ color: '#888', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <PhoneOutlined style={{ fontSize: 12 }} />{r.phone}
              </a>
            )}
          </div>
          <Badge status={r.is_active ? 'success' : 'error'} text={r.is_active ? 'Đang làm' : 'Nghỉ việc'} style={{ flexShrink: 0, fontSize: 12 }} />
        </div>

        {/* Dòng 2: Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <Tag color={roleInfo.color} style={{ margin: 0 }}>{roleInfo.label}</Tag>
          <Tag color={r.commission_rate > 0 ? 'purple' : 'default'} style={{ margin: 0 }}>
            {r.commission_rate > 0 ? `${r.commission_rate}% hoa hồng` : 'Không hoa hồng'}
          </Tag>
          {r.last_login_at && (
            <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
              Đăng nhập: {dayjs(r.last_login_at).format('DD/MM HH:mm')}
            </Tag>
          )}
        </div>

        {/* Dòng 3: Nút hành động */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            size="small" icon={<TrophyOutlined />} type="primary" ghost
            onClick={() => openCommission(r)}
            style={{ flex: 1, fontSize: 12 }}
          >
            Hoa hồng
          </Button>
          <Button
            size="small" icon={<EditOutlined />}
            onClick={() => openModal(r)}
            style={{ flex: 1, fontSize: 12 }}
          >
            Sửa
          </Button>

          {/* Toggle nhắc lịch */}
          <Tooltip title={r.notify_upcoming ? 'Tắt thông báo' : 'Bật thông báo lịch hẹn'}>
            <button
              onClick={() => toggleNotify(r)}
              disabled={toggling === r.id || !r.is_active}
              style={{
                background: r.notify_upcoming ? '#fff7e6' : '#f5f5f5',
                border: `1px solid ${r.notify_upcoming ? '#ffd591' : '#d9d9d9'}`,
                borderRadius: 8, cursor: r.is_active ? 'pointer' : 'not-allowed',
                padding: '2px 10px', height: 28, display: 'flex', alignItems: 'center',
                opacity: r.is_active ? 1 : 0.4, transition: 'all 0.2s'
              }}
            >
              {toggling === r.id ? '⏳' : r.notify_upcoming ? '🔔' : '🔕'}
            </button>
          </Tooltip>

          <Popconfirm
            title="Vô hiệu hóa tài khoản này?"
            onConfirm={() => deleteStaff(r.id)}
            okText="Xác nhận" cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={r.role === 'owner'} />
          </Popconfirm>
        </div>
      </Card>
    )
  }

  const commColumns = [
    { title: 'Sản phẩm / Dịch vụ', dataIndex: 'product_name' },
    { title: 'Số lượng', dataIndex: 'so_luong', align: 'right', render: v => Number(v).toLocaleString() },
    { title: 'Doanh thu', dataIndex: 'tong_tien', align: 'right', render: v => fmtMoney(v) },
  ]

  return (
    <div style={{ padding: isMobile ? '12px 10px' : 24 }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <Title level={5} style={{ margin: 0 }}>👥 Quản lý Nhân viên</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {notifyCount > 0 && !isMobile && (
            <Tag color="orange" icon={<BellFilled />} style={{ fontSize: 12 }}>
              {notifyCount} NV đang theo dõi lịch
            </Tag>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Tip box */}
      <div style={{
        background: 'linear-gradient(135deg, #fff7e6, #fff3cd)',
        border: '1px solid #ffd591', borderRadius: 10,
        padding: isMobile ? '8px 12px' : '10px 14px',
        marginBottom: 12,
        display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: isMobile ? 12 : 13
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <div>
          <b>Nhắc lịch:</b> Bật 🔔 để nhận cảnh báo khi nhân viên có lịch trong <b>30 phút</b> tới.
        </div>
      </div>

      {/* Nội dung: Card list trên mobile, Table trên desktop */}
      {isMobile ? (
        <div>
          {staff.length === 0
            ? <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>Chưa có nhân viên nào</div>
            : staff.map(r => <StaffCard key={r.id} r={r} />)
          }
        </div>
      ) : (
        <Card style={{ borderRadius: 12 }}>
          <Table
            dataSource={staff} columns={columns} rowKey="id" size="middle"
            pagination={false}
            rowClassName={r => !r.is_active ? 'ant-table-row-disabled' : ''}
            scroll={{ x: 800 }}
          />
        </Card>
      )}

      {/* Modal thêm/sửa nhân viên */}
      <Modal
        title={editing ? `✏️ Sửa: ${editing.name}` : '➕ Thêm nhân viên mới'}
        open={modal} onCancel={() => setModal(false)}
        onOk={() => form.submit()} confirmLoading={loading}
        okText="Lưu" cancelText="Hủy"
        width={isMobile ? '95vw' : 480}
        style={isMobile ? { top: 20 } : {}}
      >
        <Form form={form} layout="vertical" onFinish={save}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
            <Input prefix={<UserOutlined />} placeholder="Nguyễn Thị Mai" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại (dùng để đăng nhập)" rules={[{ required: true }]}>
            <Input placeholder="0912345678" />
          </Form.Item>
          {!editing && (
            <Form.Item name="password" label="Mật khẩu" extra="Mặc định: 123456 nếu để trống">
              <Input.Password placeholder="Để trống = dùng 123456" />
            </Form.Item>
          )}
          {editing && (
            <Form.Item name="password" label="Đặt lại mật khẩu" extra="Để trống = không thay đổi mật khẩu">
              <Input.Password placeholder="Nhập mật khẩu mới..." />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Vai trò">
                <Select
                  style={{ width: '100%' }}
                  options={Object.entries(ROLE_LABELS).map(([v, info]) => ({ value: v, label: info.label }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="commission_rate" label="% Hoa hồng" extra="VD: 10 = hưởng 10%">
                <InputNumber min={0} max={100} step={1} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Đang làm việc" unCheckedChildren="Nghỉ việc" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer hoa hồng nhân viên */}
      <Drawer
        title={`🏆 Hoa hồng: ${commDrawer?.name}`}
        open={!!commDrawer}
        onClose={() => { setCommDrawer(null); setCommData(null) }}
        width={isMobile ? '100vw' : 520}
      >
        <RangePicker
          value={dateRange}
          onChange={(range) => {
            setDateRange(range)
            if (commDrawer && range) loadCommission(commDrawer.id, range)
          }}
          format="DD/MM/YYYY"
          style={{ width: '100%', marginBottom: 20 }}
        />
        {commData && (
          <>
            <Row gutter={12} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <Card style={{ borderRadius: 10, background: 'linear-gradient(135deg, #667eea20, #764ba220)' }} bodyStyle={{ padding: 14 }}>
                  <Statistic
                    title="Tổng doanh thu"
                    value={fmtMoney(commData.tong_doanh_thu)}
                    valueStyle={{ color: '#1677ff', fontSize: isMobile ? 14 : 18 }}
                    prefix={<DollarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card style={{ borderRadius: 10, background: 'linear-gradient(135deg, #52c41a20, #73d13d20)' }} bodyStyle={{ padding: 14 }}>
                  <Statistic
                    title={`Hoa hồng (${commData.commission_rate}%)`}
                    value={fmtMoney(commData.hoa_hong_duoc_huong)}
                    valueStyle={{ color: '#52c41a', fontSize: isMobile ? 14 : 18 }}
                    prefix={<TrophyOutlined />}
                  />
                </Card>
              </Col>
            </Row>
            <Divider>Chi tiết từng dịch vụ</Divider>
            {commData.chi_tiet.length === 0
              ? <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>Chưa có dịch vụ nào trong kỳ này</div>
              : <Table
                  dataSource={commData.chi_tiet}
                  columns={commColumns}
                  rowKey="product_name"
                  size="small" pagination={false}
                  scroll={{ x: 300 }}
                  summary={data => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell><b>Tổng cộng</b></Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{data.reduce((s, r) => s + r.so_luong, 0).toLocaleString()}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b style={{ color: '#e74c3c' }}>{fmtMoney(data.reduce((s, r) => s + r.tong_tien, 0))}</b>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
            }
          </>
        )}
      </Drawer>
    </div>
  )
}
