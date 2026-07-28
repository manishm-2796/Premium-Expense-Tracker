from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json
import logging

from app.models.models import User
from app.utils.security import get_current_user
from app.services.two_factor_service import TwoFactorService
from app.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/2fa", tags=["2fa"])

@router.post("/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate secret key & QR code auth URI for 2FA setup.
    """
    secret = TwoFactorService.generate_secret()
    otp_uri = TwoFactorService.get_totp_uri(secret, current_user.email)
    
    current_user.two_factor_secret = secret
    db.commit()
    
    return {
        "success": True,
        "secret": secret,
        "otp_uri": otp_uri
    }


@router.post("/confirm")
async def confirm_2fa(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm 6-digit TOTP code and enable 2FA on account.
    """
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
    
    return {
        "success": True,
        "message": "Two-factor authentication enabled successfully!",
        "backup_codes": raw_codes
    }


@router.post("/disable")
async def disable_2fa(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable 2FA authentication.
    """
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    current_user.backup_codes = None
    db.commit()
    
    return {
        "success": True,
        "message": "Two-factor authentication disabled."
    }
