from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.database import get_db
from app.models.models import Order, OrderItem, Customer, Product
from app.api.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    unit: str = "cai"
    qty: float
    price: float
    discount_amount: float = 0
    cost: float = 0
    staff_name: Optional[str] = None
    note: Optional[str] = None


class OrderCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[OrderItemIn]
    discount_amount: float = 0
    paid_amount: float = 0
    payment_method: str = "cash"  # cash / transfer / debt
    note: Optional[str] = None


def gen_order_no(db: Session, tenant_id) -> str:
    date_str = datetime.now().strftime("%Y%m%d")
    count = db.query(func.count(Order.id)).filter(
        Order.tenant_id == tenant_id,
        func.date(Order.created_at) == datetime.now().date()
    ).scalar() or 0
    return f"HD{date_str}{str(count + 1).zfill(3)}"


@router.get("")
def list_orders(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Order).filter(
        Order.tenant_id == current_user.tenant_id,
        Order.is_deleted == False
    )
    if status:
        q = q.filter(Order.status == status)
    if date_from:
        q = q.filter(func.date(Order.created_at) >= date_from)
    if date_to:
        q = q.filter(func.date(Order.created_at) <= date_to)

    orders = q.order_by(Order.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(o.id),
            "order_no": o.order_no,
            "customer_name": o.customer_name,
            "status": o.status,
            "total": float(o.total),
            "paid_amount": float(o.paid_amount),
            "debt_amount": float(o.debt_amount),
            "payment_method": o.payment_method,
            "created_at": o.created_at.isoformat() if o.created_at else None
        }
        for o in orders
    ]


@router.post("")
def create_order(data: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Tính tổng tiền
    subtotal = sum(item.qty * item.price - item.discount_amount for item in data.items)
    total = subtotal - data.discount_amount
    debt_amount = max(0, total - data.paid_amount)
    status = "debt" if debt_amount > 0 else "completed"

    order = Order(
        tenant_id=current_user.tenant_id,
        order_no=gen_order_no(db, current_user.tenant_id),
        customer_id=data.customer_id,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        status=status,
        subtotal=subtotal,
        discount_amount=data.discount_amount,
        total=total,
        paid_amount=data.paid_amount,
        debt_amount=debt_amount,
        payment_method=data.payment_method,
        staff_name=current_user.name,
        note=data.note,
        created_by=current_user.id
    )
    db.add(order)
    db.flush()  # Get order.id trước

    # Thêm từng dòng sản phẩm
    for item in data.items:
        oi = OrderItem(
            order_id=order.id,
            tenant_id=current_user.tenant_id,
            product_id=item.product_id,
            product_name=item.product_name,
            unit=item.unit,
            qty=item.qty,
            price=item.price,
            discount_amount=item.discount_amount,
            total=item.qty * item.price - item.discount_amount,
            cost=item.cost,
            staff_name=item.staff_name or current_user.name,
            note=item.note
        )
        db.add(oi)

        # Cập nhật tồn kho nếu cần
        if item.product_id:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product and product.track_stock:
                product.stock_qty = float(product.stock_qty) - item.qty

    # Cập nhật công nợ khách hàng
    if data.customer_id and debt_amount > 0:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if customer:
            customer.debt = float(customer.debt) + debt_amount
            customer.total_spent = float(customer.total_spent) + float(data.paid_amount)
            customer.visit_count = customer.visit_count + 1
            customer.last_visit_at = datetime.now()

    db.commit()
    return {
        "id": str(order.id),
        "order_no": order.order_no,
        "total": float(order.total),
        "debt_amount": float(order.debt_amount),
        "status": order.status,
        "message": "Tạo hóa đơn thành công"
    }


@router.get("/{order_id}")
def get_order(order_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tenant_id == current_user.tenant_id
    ).first()
    if not order:
        raise HTTPException(404, "Không tìm thấy hóa đơn")
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    return {
        "id": str(order.id),
        "order_no": order.order_no,
        "customer_name": order.customer_name,
        "status": order.status,
        "subtotal": float(order.subtotal),
        "discount_amount": float(order.discount_amount),
        "total": float(order.total),
        "paid_amount": float(order.paid_amount),
        "debt_amount": float(order.debt_amount),
        "payment_method": order.payment_method,
        "note": order.note,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
                "product_name": i.product_name,
                "unit": i.unit,
                "qty": float(i.qty),
                "price": float(i.price),
                "total": float(i.total)
            }
            for i in items
        ]
    }


@router.put("/{order_id}/cancel")
def cancel_order(order_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.tenant_id == current_user.tenant_id
    ).first()
    if not order:
        raise HTTPException(404, "Không tìm thấy hóa đơn")
    order.is_deleted = True
    order.status = "cancelled"
    db.commit()
    return {"message": "Đã hủy hóa đơn"}
