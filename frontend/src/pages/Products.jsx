import React, { useState, useEffect } from 'react'
import {
  Table, Button, Modal, Form, Input, InputNumber, Select,
  Space, Tag, Popconfirm, message, Card, Typography, Tabs, ColorPicker, Switch
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons'
import api from '../api'

const { Title } = Typography
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [prodModal, setProdModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingCat, setEditingCat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [prodForm] = Form.useForm()
  const [catForm] = Form.useForm()

  useEffect(() => { load() }, [])

  const load = async () => {
    const [p, c] = await Promise.all([
      api.get('/api/products', { params: { is_active: true } }),
      api.get('/api/categories')
    ])
    setProducts(p.data)
    setCategories(c.data)
  }

  // ===== PRODUCT HANDLERS =====
  const openProd = (record = null) => {
    setEditing(record)
    prodForm.resetFields()
    if (record) prodForm.setFieldsValue(record)
    setProdModal(true)
  }

  const saveProd = async (vals) => {
    setLoading(true)
    try {
      if (editing) {
        await api.put(`/api/products/${editing.id}`, vals)
        message.success('Cập nhật thành công!')
      } else {
        await api.post('/api/products', vals)
        message.success('Thêm sản phẩm thành công!')
      }
      setProdModal(false)
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const deleteProd = async (id) => {
    await api.delete(`/api/products/${id}`)
    message.success('Đã xóa!')
    load()
  }

  // ===== CATEGORY HANDLERS =====
  const openCat = (record = null) => {
    setEditingCat(record)
    catForm.resetFields()
    if (record) catForm.setFieldsValue({ name: record.name, sort_order: record.sort_order })
    setCatModal(true)
  }

  const saveCat = async (vals) => {
    setLoading(true)
    try {
      if (editingCat) {
        await api.put(`/api/categories/${editingCat.id}`, vals)
        message.success('Cập nhật danh mục!')
      } else {
        await api.post('/api/categories', vals)
        message.success('Thêm danh mục!')
      }
      setCatModal(false)
      load()
    } catch (e) {
      message.error(e.response?.data?.error || 'Lỗi')
    } finally {
      setLoading(false)
    }
  }

  const deleteCat = async (id) => {
    await api.delete(`/api/categories/${id}`)
    message.success('Đã xóa danh mục!')
    load()
  }

  const prodColumns = [
    {
      title: 'Tên sản phẩm / dịch vụ', dataIndex: 'name',
      render: (name, r) => (
        <Space>
          <span>{r.is_service ? '✂️' : '📦'}</span>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {r.is_service && <Tag color="purple" style={{ fontSize: 11 }}>Dịch vụ</Tag>}
        </Space>
      )
    },
    {
      title: 'Danh mục', dataIndex: 'category_name',
      render: v => v ? <Tag>{v}</Tag> : <Tag color="default">—</Tag>
    },
    { title: 'Đơn vị', dataIndex: 'unit', width: 80 },
    { title: 'Giá bán', dataIndex: 'price', align: 'right', render: v => <b style={{ color: '#e74c3c' }}>{fmtMoney(v)}</b> },
    { title: 'Giá vốn', dataIndex: 'cost', align: 'right', render: v => fmtMoney(v) },
    {
      title: 'Tồn kho', align: 'center',
      render: (_, r) => r.track_stock
        ? <Tag color={r.stock_qty <= r.min_stock ? 'red' : 'green'}>{r.stock_qty} {r.unit}</Tag>
        : <Tag color="default">Không theo dõi</Tag>
    },
    {
      title: 'Thao tác', width: 110,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openProd(r)} />
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => deleteProd(r.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  const catColumns = [
    { title: 'Tên danh mục', dataIndex: 'name', render: (n, r) => <Space><span style={{ width: 14, height: 14, borderRadius: 3, background: r.color || '#ccc', display: 'inline-block' }} />{n}</Space> },
    { title: 'Thứ tự', dataIndex: 'sort_order', width: 80 },
    {
      title: 'Thao tác', width: 110,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openCat(r)} />
          <Popconfirm title="Xóa danh mục này?" onConfirm={() => deleteCat(r.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Tabs defaultActiveKey="products" items={[
        {
          key: 'products',
          label: <span><UnorderedListOutlined /> Sản phẩm & Dịch vụ</span>,
          children: (
            <Card
              title={<Title level={5} style={{ margin: 0 }}>📦 Quản lý Sản phẩm / Dịch vụ</Title>}
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openProd()}>
                  Thêm mới
                </Button>
              }
              style={{ borderRadius: 12 }}
            >
              <Table
                dataSource={products} columns={prodColumns}
                rowKey="id" size="middle"
                pagination={{ pageSize: 15 }}
              />
            </Card>
          )
        },
        {
          key: 'categories',
          label: <span><AppstoreOutlined /> Danh mục</span>,
          children: (
            <Card
              title={<Title level={5} style={{ margin: 0 }}>🗂️ Quản lý Danh mục</Title>}
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openCat()}>
                  Thêm danh mục
                </Button>
              }
              style={{ borderRadius: 12 }}
            >
              <Table dataSource={categories} columns={catColumns} rowKey="id" size="middle" pagination={false} />
            </Card>
          )
        }
      ]} />

      {/* Modal Sản phẩm */}
      <Modal
        title={editing ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm / dịch vụ'}
        open={prodModal} onCancel={() => setProdModal(false)}
        onOk={() => prodForm.submit()} confirmLoading={loading}
        okText="Lưu" cancelText="Hủy" width={560}
      >
        <Form form={prodForm} layout="vertical" onFinish={saveProd}>
          <Form.Item name="name" label="Tên sản phẩm / dịch vụ" rules={[{ required: true }]}>
            <Input placeholder="VD: Cắt tóc nữ, Nhuộm toàn đầu..." />
          </Form.Item>
          <Form.Item name="category_id" label="Danh mục">
            <Select allowClear placeholder="Chọn danh mục"
              options={categories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Space style={{ width: '100%' }} size={16}>
            <Form.Item name="price" label="Giá bán (đ)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={1000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v.replace(/,/g, '')} />
            </Form.Item>
            <Form.Item name="cost" label="Giá vốn (đ)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={1000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v.replace(/,/g, '')} />
            </Form.Item>
            <Form.Item name="unit" label="Đơn vị" style={{ width: 90 }}>
              <Select defaultValue="cái" options={[
                { value: 'cái' }, { value: 'lần' }, { value: 'chai' },
                { value: 'kg' }, { value: 'gói' }, { value: 'hộp' }, { value: 'lon' }
              ]} />
            </Form.Item>
          </Space>
          <Space size={16}>
            <Form.Item name="is_service" label="Là dịch vụ?" valuePropName="checked">
              <Switch checkedChildren="Dịch vụ" unCheckedChildren="Hàng hóa" />
            </Form.Item>
            <Form.Item name="track_stock" label="Theo dõi tồn kho?" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.is_service !== cur.is_service}>
            {({ getFieldValue }) => getFieldValue('is_service') ? (
              <div style={{ background: '#f8f9ff', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#667eea', marginBottom: 10 }}>💈 Hoa hồng thợ (cho dịch vụ)</div>
                <Space size={16}>
                  <Form.Item name="commission_main_pct" label="% HH Thợ chính" style={{ flex: 1, margin: 0 }}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} step={1}
                      formatter={v => `${v}%`} parser={v => v.replace('%', '')}
                      placeholder="0" />
                  </Form.Item>
                  <Form.Item name="commission_assist_pct" label="% HH Thợ phụ" style={{ flex: 1, margin: 0 }}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} step={1}
                      formatter={v => `${v}%`} parser={v => v.replace('%', '')}
                      placeholder="0" />
                  </Form.Item>
                </Space>
              </div>
            ) : null}
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.track_stock !== cur.track_stock}>
            {({ getFieldValue }) => getFieldValue('track_stock') ? (
              <Space size={16}>
                <Form.Item name="stock_qty" label="Số lượng tồn">
                  <InputNumber min={0} style={{ width: 120 }} />
                </Form.Item>
                <Form.Item name="min_stock" label="Tồn tối thiểu">
                  <InputNumber min={0} style={{ width: 120 }} />
                </Form.Item>
              </Space>
            ) : null}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Danh mục */}
      <Modal
        title={editingCat ? '✏️ Sửa danh mục' : '➕ Thêm danh mục'}
        open={catModal} onCancel={() => setCatModal(false)}
        onOk={() => catForm.submit()} confirmLoading={loading}
        okText="Lưu" cancelText="Hủy" width={360}
      >
        <Form form={catForm} layout="vertical" onFinish={saveCat}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
            <Input placeholder="VD: Cắt tóc, Nhuộm - Uốn..." />
          </Form.Item>
          <Form.Item name="sort_order" label="Thứ tự hiển thị">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
