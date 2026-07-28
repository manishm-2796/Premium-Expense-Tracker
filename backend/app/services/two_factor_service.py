import secrets
import base64
import time
import hmac
import hashlib
import struct
import json
from typing import List, Tuple

class TwoFactorService:
    """
    TOTP 2FA Service implementing RFC 6238 TOTP verification and backup recovery codes.
    """

    @staticmethod
    def generate_secret() -> str:
        """Generate 16-character Base32 secret key."""
        random_bytes = secrets.token_bytes(10)
        return base64.b32encode(random_bytes).decode('utf-8').replace('=', '')

    @staticmethod
    def get_totp_uri(secret: str, email: str, issuer: str = "ExpenseTracker") -> str:
        """Generate OTP Auth URI for QR Code scanning."""
        return f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"

    @staticmethod
    def verify_code(secret: str, code: str, window: int = 1) -> bool:
        """Verify 6-digit TOTP code with time drift window."""
        if not secret or not code or len(code.strip()) != 6:
            return False

        code_str = code.strip()
        current_time = int(time.time() // 30)

        for time_step in range(current_time - window, current_time + window + 1):
            generated = TwoFactorService._generate_totp_for_step(secret, time_step)
            if secrets.compare_digest(generated, code_str):
                return True
        return False

    @staticmethod
    def _generate_totp_for_step(secret: str, step: int) -> str:
        """Generate 6-digit TOTP for a given time step."""
        try:
            missing_padding = len(secret) % 8
            if missing_padding:
                secret += '=' * (8 - missing_padding)
            key = base64.b32decode(secret, casefold=True)
            msg = struct.pack(">Q", step)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            offset = h[19] & 0xf
            code = (struct.unpack(">I", h[offset:offset+4])[0] & 0x7fffffff) % 1000000
            return f"{code:06d}"
        except Exception:
            return ""

    @staticmethod
    def generate_backup_codes(count: int = 8) -> Tuple[List[str], str]:
        """Generate 8 single-use recovery codes."""
        codes = [secrets.token_hex(4).upper() for _ in range(count)]
        return codes, json.dumps(codes)
