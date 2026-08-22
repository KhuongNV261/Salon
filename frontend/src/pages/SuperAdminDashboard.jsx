import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Typography, Space, Select, Tag, DatePicker, Switch, InputNumber, Divider, Tooltip } from 'antd'
import { PlusOutlined, CopyOutlined, LogoutOutlined, EditOutlined, DollarOutlined, ControlOutlined, TeamOutlined } from '@ant-design/icons'
import { superGetTenants, superCreateTenant, superUpdateTenant, superExtendTenant } from '../api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// Danh sách tất cả tính năng có thể bật/tắt
const ALL_FEATURES = [
  { key: 'dashboard',  label: '📊 Tổng quan',    desc: 'Tab Dashboard - Doanh thu, thống kê tổng hợp' },
  { key: 'pos',        label: '🛒 Bán hàng',      desc: 'Màn hình bán hàng (POS) - Tạo đơn, thu tiền' },
  { key: 'booking',   label: '📅 Lịch hẹn',      desc: 'Quản lý lịch hẹn, đặt lịch khách' },
  { key: 'customers', label: '👤 Khách hàng',     desc: 'Danh sách và quản lý khách hàng' },
  { key: 'expenses',  label: '💸 Chi phí',        desc: 'Theo dõi và quản lý chi phí vận hành' },
  { key: 'reports',   label: '📈 Báo cáo',        desc: 'Báo cáo doanh thu, thống kê nhân viên' },
  { key: 'inventory', label: '📦 Kho hàng',       desc: 'Quản lý tồn kho, nhập hàng' },
  { key: 'staff',     label: '👥 Nhân viên',      desc: 'Thêm, quản lý tài khoản nhân viên' },
  { key: 'settings',  label: '⚙️ Cài đặt',       desc: 'Cài đặt cửa hàng, thông tin tiệm' },
]

// Helper: lấy features hiện tại (mặc định tất cả bật)
const getFeatures = (raw) => {
  const defaults = {}
  ALL_FEATURES.forEach(f => { defaults[f.key] = true })
  return { ...defaults, ...(raw || {}) }
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [editingTenant, setEditingTenant] = useState(null)
  
  const [extendModalOpen, setExtendModalOpen] = useState(false)
  const [extendForm] = Form.useForm()
  const [extendingTenant, setExtendingTenant] = useState(null)

  // State cho modal tính năng
  const [featuresModalOpen, setFeaturesModalOpen] = useState(false)
  const [featuresTenant, setFeaturesTenant] = useState(null)
  const [featuresState, setFeaturesState] = useState({})
  const [maxStaff, setMaxStaff] = useState(10)
  const [savingFeatures, setSavingFeatures] = useState(false)

  const fetchTenants = async () => {
    try {
      const res = await superGetTenants()
      setTenants(res.data)
    } catch (err) {
      if (err.response?.status === 403) {
        window.location.href = '/super-admin'
      }
      message.error('Không thể lấy danh sách cửa hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenants()
  }, [])

  const handleCreate = async (values) => {
    setSubmitting(true)
    try {
      const res = await superCreateTenant(values)
      message.success(res.data.message)
      setIsModalOpen(false)
      form.resetFields()
      fetchTenants()
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi khi tạo tiệm')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        trial_ends_at: values.trial_ends_at ? values.trial_ends_at.toISOString() : null,
      }
      await superUpdateTenant(editingTenant.id, payload)
      message.success('Cập nhật thành công')
      setEditModalOpen(false)
      fetchTenants()
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi cập nhật')
    } finally {
      setSubmitting(false)
    }
  }

  const handleExtend = async (values) => {
    setSubmitting(true)
    try {
      await superExtendTenant(extendingTenant.id, values.months)
      message.success(`Gia hạn thành công ${values.months} tháng!`)
      setExtendModalOpen(false)
      fetchTenants()
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi gia hạn')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveFeatures = async () => {
    setSavingFeatures(true)
    try {
      await superUpdateTenant(featuresTenant.id, {
        features: featuresState,
        max_staff: maxStaff,
      })
      message.success('Đã lưu cấu hình tính năng!')
      setFeaturesModalOpen(false)
      fetchTenants()
    } catch (err) {
      message.error(err.response?.data?.error || 'Lỗi lưu tính năng')
    } finally {
      setSavingFeatures(false)
    }
  }

  const copyLink = (slug) => {
    const link = `${window.location.origin}/${slug}/`
    navigator.clipboard.writeText(link)
    message.success('Đã copy link cửa hàng!')
  }

  const openFeaturesModal = (record) => {
    setFeaturesTenant(record)
    setFeaturesState(getFeatures(record.features))
    setMaxStaff(record.max_staff ?? 10)
    setFeaturesModalOpen(true)
  }

  const columns = [
    { title: 'Tên Tiệm', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (text) => <Text code>{text}</Text> },
    { title: 'Chủ Tiệm', dataIndex: 'owner_name', key: 'owner_name' },
    { title: 'Số Điện Thoại', dataIndex: 'owner_phone', key: 'owner_phone' },
    {
      title: 'NV / Giới hạn',
      key: 'staff_info',
      render: (_, record) => {
        const count = record.staff_count ?? 0
        const max = record.max_staff ?? 10
        const isFull = count >= max
        return (
          <Tooltip title={`${count}/${max} nhân viên`}>
            <Tag color={isFull ? 'red' : count >= max * 0.8 ? 'orange' : 'blue'} icon={<TeamOutlined />}>
              {count}/{max}
            </Tag>
          </Tooltip>
        )
      }
    },
    { 
      title: 'Hết Hạn', 
      dataIndex: 'trial_ends_at', 
      key: 'trial_ends_at', 
      render: (val, record) => {
        if (!val) return '-'
        const date = new Date(val)
        const now = new Date()
        const diffTime = date - now
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        const isExpired = diffDays < 0 || record.status === 'expired'
        
        if (isExpired) {
          return <Text type="danger" strong>Đã hết hạn ({date.toLocaleDateString('vi-VN')})</Text>
        } else {
          return <Text type="success" strong>Còn {diffDays} ngày ({date.toLocaleDateString('vi-VN')})</Text>
        }
      } 
    },
    { 
      title: 'Trạng Thái', 
      dataIndex: 'status', 
      key: 'status', 
      render: (val) => {
        if (val === 'active' || val === 'trial') return <Tag color="green">Hoạt Động</Tag>
        if (val === 'expired') return <Tag color="red">Hết Hạn</Tag>
        return <Tag color="default">Khóa</Tag>
      } 
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<DollarOutlined />} 
            type="primary" 
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => {
              setExtendingTenant(record)
              extendForm.setFieldsValue({ months: 6 })
              setExtendModalOpen(true)
            }}
          >
            Thu Tiền
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingTenant(record)
              editForm.resetFields()
              editForm.setFieldsValue({
                ...record,
                trial_ends_at: record.trial_ends_at ? dayjs(record.trial_ends_at) : null,
              })
              setEditModalOpen(true)
            }}
          >
            Sửa
          </Button>
          <Tooltip title="Cấu hình tính năng & giới hạn">
            <Button 
              icon={<ControlOutlined />}
              style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
              onClick={() => openFeaturesModal(record)}
            >
              Tính Năng
            </Button>
          </Tooltip>
          <Button icon={<CopyOutlined />} onClick={() => copyLink(record.slug)} />
        </Space>
      ),
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem('super_token')
    window.location.href = '/super-admin'
  }

  // Đếm số tính năng đang bật của tiệm
  const countActiveFeatures = (features) => {
    const f = getFeatures(features)
    return ALL_FEATURES.filter(ft => f[ft.key] !== false).length
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Quản Lý Khách Hàng</Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Tạo Tiệm Mới
          </Button>
          <Button icon={<LogoutOutlined />} onClick={handleLogout} danger>Đăng xuất</Button>
        </Space>
      </div>

      <Table 
        columns={columns} 
        dataSource={tenants} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      {/* Tạo mới */}
      <Modal title="Tạo Cửa Hàng Mới (Cấp tài khoản cho khách)" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="Tên Cửa Hàng" name="tenant_name" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên cửa hàng..." />
          </Form.Item>
          <Form.Item label="Đường Dẫn Ngắn (Slug)" name="slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}>
            <Input placeholder="ví dụ: tiem-toc-abc" />
          </Form.Item>
          <Form.Item label="Họ tên chủ tiệm" name="owner_name" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên người chủ..." />
          </Form.Item>
          <Form.Item label="Số điện thoại đăng nhập" name="owner_phone" rules={[{ required: true }]}>
            <Input placeholder="Nhập số điện thoại..." />
          </Form.Item>
          <Form.Item label="Mật khẩu đăng nhập" name="owner_password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Nhập mật khẩu..." />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>Tạo Ngay</Button>
        </Form>
      </Modal>

      {/* Sửa thông tin */}
      <Modal title="Sửa Thông Tin Tiệm" open={editModalOpen} onCancel={() => setEditModalOpen(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item label="Tên Cửa Hàng" name="name" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên cửa hàng..." />
          </Form.Item>
          <Form.Item label="Đường Dẫn (Slug)" name="slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/ }]}>
            <Input placeholder="ví dụ: tiem-toc-abc" />
          </Form.Item>
          <Form.Item label="Họ tên chủ tiệm" name="owner_name" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên người chủ..." />
          </Form.Item>
          <Form.Item label="Số điện thoại đăng nhập" name="owner_phone" rules={[{ required: true }]}>
            <Input placeholder="Nhập số điện thoại..." />
          </Form.Item>
          <Form.Item label="Đổi mật khẩu (Bỏ trống nếu giữ nguyên)" name="owner_password" rules={[{ min: 6, message: 'Mật khẩu ít nhất 6 ký tự' }]}>
            <Input.Password placeholder="Nhập mật khẩu mới..." />
          </Form.Item>
          <Form.Item label="Ngày hết hạn" name="trial_ends_at">
            <DatePicker
              format="DD/MM/YYYY"
              style={{ width: '100%' }}
              placeholder="Chọn ngày hết hạn..."
            />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">Hoạt Động</Select.Option>
              <Select.Option value="locked">Tạm Khóa</Select.Option>
              <Select.Option value="expired">Hết Hạn (Chờ Đóng Tiền)</Select.Option>
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>Lưu Thay Đổi</Button>
        </Form>
      </Modal>

      {/* Gia Hạn Thu Tiền */}
      <Modal title={`Thu Tiền Cước - ${extendingTenant?.name}`} open={extendModalOpen} onCancel={() => setExtendModalOpen(false)} footer={null}>
        <div style={{ marginBottom: 16 }}>
          <Text>Khách hàng đóng tiền cước sử dụng phần mềm. Việc gia hạn sẽ cộng dồn số tháng vào ngày hết hạn hiện tại.</Text>
        </div>
        <Form form={extendForm} layout="vertical" onFinish={handleExtend} initialValues={{ months: 6 }}>
          <Form.Item label="Gói gia hạn (Chọn số tháng)" name="months" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value={1}>1 Tháng (Gói thử nghiệm)</Select.Option>
              <Select.Option value={3}>3 Tháng (Gói quý)</Select.Option>
              <Select.Option value={6}>6 Tháng (Tặng thêm 1 tháng = 7 tháng)</Select.Option>
              <Select.Option value={12}>12 Tháng (Tặng thêm 2 tháng = 14 tháng)</Select.Option>
              <Select.Option value={24}>2 Năm (Tặng thêm 6 tháng = 30 tháng)</Select.Option>
            </Select>
          </Form.Item>
          
          <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '12px 16px', borderRadius: 8, marginBottom: 24 }}>
            <Text strong type="success">💡 Mẹo Sale cho bạn:</Text>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#389e0d' }}>
              <li>Khuyên khách chọn gói 6 tháng để được tặng 1 tháng.</li>
              <li>Chọn gói 12 tháng được tặng 2 tháng và hỗ trợ VIP.</li>
            </ul>
          </div>
          
          <Button type="primary" htmlType="submit" loading={submitting} block size="large" style={{ background: '#52c41a' }}>
            Xác Nhận Đã Thu Tiền (Gia Hạn Ngay)
          </Button>
        </Form>
      </Modal>

      {/* Modal Cấu Hình Tính Năng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ControlOutlined style={{ color: '#7c3aed', fontSize: 20 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Cấu Hình Tính Năng</div>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>{featuresTenant?.name}</div>
            </div>
          </div>
        }
        open={featuresModalOpen}
        onCancel={() => setFeaturesModalOpen(false)}
        footer={null}
        width={520}
      >
        {/* Giới hạn nhân viên */}
        <div style={{ background: 'linear-gradient(135deg, #f0e6ff, #e8d5ff)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#5b21b6', fontSize: 14 }}>
                <TeamOutlined /> Giới hạn nhân viên
              </div>
              <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>
                Hiện có: <b>{featuresTenant?.staff_count ?? 0}</b> nhân viên
              </div>
            </div>
            <InputNumber
              min={1}
              max={999}
              value={maxStaff}
              onChange={val => setMaxStaff(val)}
              addonAfter="người"
              style={{ width: 140 }}
              size="large"
            />
          </div>
        </div>

        <Divider style={{ margin: '0 0 16px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Bật/tắt tính năng ({ALL_FEATURES.filter(f => featuresState[f.key] !== false).length}/{ALL_FEATURES.length} đang bật)
          </Text>
        </Divider>

        {/* Danh sách tính năng */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {ALL_FEATURES.map(feature => {
            const isOn = featuresState[feature.key] !== false
            return (
              <div
                key={feature.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: isOn ? '#f6f0ff' : '#fafafa',
                  border: `1px solid ${isOn ? '#c4b5fd' : '#e8e8e8'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: isOn ? '#5b21b6' : '#999' }}>
                    {feature.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                    {feature.desc}
                  </div>
                </div>
                <Switch
                  checked={isOn}
                  onChange={val => setFeaturesState(prev => ({ ...prev, [feature.key]: val }))}
                  style={{ background: isOn ? '#7c3aed' : undefined }}
                />
              </div>
            )
          })}
        </div>

        {/* Nút bật/tắt tất cả */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Button size="small" onClick={() => {
            const all = {}
            ALL_FEATURES.forEach(f => { all[f.key] = true })
            setFeaturesState(all)
          }}>✅ Bật tất cả</Button>
          <Button size="small" onClick={() => {
            const all = {}
            ALL_FEATURES.forEach(f => { all[f.key] = false })
            // POS luôn bật
            all['pos'] = true
            setFeaturesState(all)
          }}>🔒 Chỉ giữ Bán hàng</Button>
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={savingFeatures}
          onClick={handleSaveFeatures}
          style={{ background: '#7c3aed', borderColor: '#7c3aed', borderRadius: 10 }}
        >
          Lưu Cấu Hình
        </Button>
      </Modal>
    </div>
  )
}
