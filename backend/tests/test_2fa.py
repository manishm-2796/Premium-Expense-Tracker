import pytest
import time
from app.services.two_factor_service import TwoFactorService

def test_generate_totp_secret():
    secret = TwoFactorService.generate_secret()
    assert isinstance(secret, str)
    assert len(secret) >= 16

def test_generate_backup_codes():
    codes, json_codes = TwoFactorService.generate_backup_codes()
    assert isinstance(codes, list)
    assert len(codes) == 8
    assert isinstance(json_codes, str)

def test_verify_valid_totp_code():
    secret = TwoFactorService.generate_secret()
    current_step = int(time.time() // 30)
    code = TwoFactorService._generate_totp_for_step(secret, current_step)
    assert TwoFactorService.verify_code(secret, code) is True

def test_verify_invalid_code_rejected():
    secret = TwoFactorService.generate_secret()
    # Check invalid code format or non-matching code
    assert TwoFactorService.verify_code(secret, "000000") is False

def test_get_otp_uri_format():
    secret = TwoFactorService.generate_secret()
    uri = TwoFactorService.get_totp_uri(secret, "user@example.com")
    assert uri.startswith("otpauth://totp/")

def test_2fa_setup_endpoint(client, auth_headers):
    response = client.post("/auth/2fa/setup", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "secret" in data
    assert "otp_uri" in data
    assert data["otp_uri"].startswith("otpauth://totp/")

def test_2fa_confirm_with_valid_code(client, auth_headers):
    setup_res = client.post("/auth/2fa/setup", headers=auth_headers)
    assert setup_res.status_code == 200
    secret = setup_res.json()["secret"]

    current_step = int(time.time() // 30)
    code = TwoFactorService._generate_totp_for_step(secret, current_step)

    confirm_res = client.post(
        "/auth/2fa/confirm",
        json={"code": code},
        headers=auth_headers
    )
    assert confirm_res.status_code == 200
    data = confirm_res.json()
    assert data.get("success") is True
    assert "backup_codes" in data
    assert len(data["backup_codes"]) == 8

def test_2fa_disable_endpoint(client, auth_headers):
    # Enable 2FA first
    setup_res = client.post("/auth/2fa/setup", headers=auth_headers)
    assert setup_res.status_code == 200
    secret = setup_res.json()["secret"]

    current_step = int(time.time() // 30)
    code = TwoFactorService._generate_totp_for_step(secret, current_step)
    client.post("/auth/2fa/confirm", json={"code": code}, headers=auth_headers)

    # Disable 2FA
    disable_res = client.post("/auth/2fa/disable", headers=auth_headers)
    assert disable_res.status_code == 200
    assert disable_res.json().get("success") is True
