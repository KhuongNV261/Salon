from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional, List
from app.database import get_db
from app.models.models import Product, Category
from app.api.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/products", tags=["products"])


class ProductCreate(BaseModel):
    category_id: Optional[int] = None
    code: Optional[str] = None
    name: str
    unit: str = "cai"
    price: float
    cost: float = 0
    is_service: bool = False
    track_stock: bool = False
    stock_qty: float = 0
    min_stock: float = 0


class ProductOut(BaseModel):
    id: str
    category_id: Optional[int]
    category_name: Optional[str]
    code: Optional[str]
    name: str
    unit: str
    price: float
    cost: float
    is_service: bool
    track_stock: bool
    stock_qty: float
    min_stock: float
    is_active: bool

    class Config:
        from_attributes = True


@router.get("")
def list_products(
    q: Optional[str] = Query(None, description="Tìm theo tên hoặc mã"),
    category_id: Optional[int] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Product, Category.name.label("category_name")).outerjoin(
        Category, Product.category_id == Category.id
    ).filter(
        Product.tenant_id == current_user.tenant_id,
        Product.is_active == is_active
    )
    if q:
        query = query.filter(or_(
            Product.name.ilike(f"%{q}%"),
            Product.code.ilike(f"%{q}%")
        ))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    results = query.order_by(Product.sort_order, Product.name).all()
    return [
        {
            "id": str(p.id),
            "category_id": p.category_id,
            "category_name": cat_name,
            "code": p.code,
            "name": p.name,
            "unit": p.unit,
            "price": float(p.price),
            "cost": float(p.cost),
            "is_service": p.is_service,
            "track_stock": p.track_stock,
            "stock_qty": float(p.stock_qty),
            "min_stock": float(p.min_stock),
            "is_active": p.is_active
        }
        for p, cat_name in results
    ]


@router.post("")
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    product = Product(
        tenant_id=current_user.tenant_id,
        **data.model_dump()
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return {"id": str(product.id), "message": "Tạo sản phẩm thành công"}


@router.put("/{product_id}")
def update_product(product_id: str, data: ProductCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    ).first()
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    for k, v in data.model_dump().items():
        setattr(product, k, v)
    db.commit()
    return {"message": "Cập nhật thành công"}


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.tenant_id == current_user.tenant_id
    ).first()
    if not product:
        raise HTTPException(404, "Không tìm thấy sản phẩm")
    product.is_active = False
    db.commit()
    return {"message": "Đã xóa sản phẩm"}
