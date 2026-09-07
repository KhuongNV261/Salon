from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.services.auth import authenticate_user, create_access_token, decode_token, hash_password
from app.models.models import User, Tenant

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class LoginRequest(BaseModel):
    tenant_id: str
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_role: str
    tenant_name: str


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, req.tenant_id, req.phone, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Sai số điện thoại hoặc mật khẩu")
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    token = create_access_token({
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role
    })
    return TokenResponse(
        access_token=token,
        user_name=user.name,
        user_role=user.role,
        tenant_name=tenant.name if tenant else ""
    )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại")
    return user


# Endpoint tạo user mới (dùng khi setup lần đầu)
class CreateUserRequest(BaseModel):
    tenant_id: str
    name: str
    phone: str
    password: str
    role: str = "staff"


@router.post("/setup-user")
def create_user(req: CreateUserRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        User.tenant_id == req.tenant_id,
        User.phone == req.phone
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")
    user = User(
        tenant_id=req.tenant_id,
        name=req.name,
        phone=req.phone,
        password_hash=hash_password(req.password),
        role=req.role
    )
    db.add(user)
    db.commit()
    return {"message": "Tạo tài khoản thành công", "user_id": str(user.id)}
