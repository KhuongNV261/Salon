import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Typography, Space, Select, Tag } from 'antd'
import { PlusOutlined, CopyOutlined, LogoutOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons'
import { superGetTenants, superCreateTenant, superUpdateTenant, superExtendTenant } from '../api'

const { Title, Text } = Typography

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
      await superUpdateTenant(editingTenant.id, values)
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

  const copyLink = (slug) => {
    const link = `${window.location.origin}/${slug}/`
    navigator.clipboard.writeText(link)
    message.success('Đã copy link cửa hàng!')
  }

  const columns = [
    { title: 'Tên Tiệm', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (text) => <Text code>{text}</Text> },
    { title: 'Chủ Tiệm', dataIndex: 'owner_name', key: 'owner_name' },
    { title: 'Số Điện Thoại', dataIndex: 'owner_phone', key: 'owner_phone' },
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
              editForm.setFieldsValue(record)
              setEditModalOpen(true)
            }}
          >
            Sửa
          </Button>
          <Button icon={<CopyOutlined />} onClick={() => copyLink(record.slug)} />
        </Space>
      ),
    },
  ]

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/super-admin'
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
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
    </div>
  )
}
