from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
import logging

from app.models.models import User
from app.utils.security import get_current_user, create_access_token
from app.services.two_factor_service import TwoFactorService
from app.database import get_db
from datetime import timedelta
from app.utils.security import ACCESS_TOKEN_EXPIRE_MINUTES
from app.schemas.schemas import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/2fa", tags=["2fa"])

@router.post("/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    secret = TwoFactorService.generate_secret()
    otp_uri = TwoFactorService.get_totp_uri(secret, current_user.email)
    current_user.two_factor_secret = secret
    db.commit()
    return {"success": True, "secret": secret, "otp_uri": otp_uri}


@router.post("/confirm")
async def confirm_2fa(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    code = data.get("code", "")
    secret = current_user.two_factor_secret
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    if not TwoFactorService.verify_code(secret, code):
        raise HTTPException(status_code=400, detail="Invalid 6-digit 2FA code")
    raw_codes, json_codes = TwoFactorService.generate_backup_codes()
    current_user.two_factor_enabled = True
    current_user.backup_codes = json_codes
    db.commit()
    return {"success": True, "message": "2FA enabled!", "backup_codes": raw_codes}


@router.post("/verify-token")
async def verify_token(
    data: dict,
    db: Session = Depends(get_db)
):
    """
    Verify 2FA code during login (using temp email from payload).
    """
    email = data.get("email", "")
    code = data.get("code", "")
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and code required")
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA not enabled for this account")
    
    # Check backup codes
    if user.backup_codes:
        try:
            backup_list = json.loads(user.backup_codes)
            if code.upper() in backup_list:
                backup_list.remove(code.upper())
                user.backup_codes = json.dumps(backup_list)
                db.commit()
                token = create_access_token({"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
                return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}
        except Exception:
            pass
    
    if not TwoFactorService.verify_code(user.two_factor_secret, code):
        raise HTTPException(status_code=401, detail="Invalid authentication code")
    
    token = create_access_token({"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}


@router.post("/disable")
async def disable_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.backup_codes = None
    db.commit()
    return {"success": True, "message": "2FA disabled."}
