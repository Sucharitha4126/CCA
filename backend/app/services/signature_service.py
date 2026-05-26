import base64
import hashlib
import json
from datetime import datetime

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from app.core.config import settings
from app.models.user import User


def _fernet() -> Fernet:
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


class DigitalSignatureService:
    def generate_identity(self, email: str, account_number: str) -> dict:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        identity = hashlib.sha256(f"{email}:{account_number}:{public_pem.decode()}".encode()).hexdigest()
        return {
            "public_key": public_pem.decode("utf-8"),
            "encrypted_private_key": _fernet().encrypt(private_pem).decode("utf-8"),
            "digital_identity": identity,
        }

    def transaction_payload(self, sender_id: int, receiver_id: int, amount: float, timestamp: datetime) -> dict:
        return {
            "sender": sender_id,
            "receiver": receiver_id,
            "amount": round(float(amount), 2),
            "timestamp": timestamp.isoformat(),
        }

    def transaction_hash(self, payload: dict) -> str:
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def sign_hash(self, user: User, transaction_hash: str) -> str:
        if not user.encrypted_private_key:
            raise ValueError("Private key is missing")
        private_pem = _fernet().decrypt(user.encrypted_private_key.encode("utf-8"))
        private_key = serialization.load_pem_private_key(private_pem, password=None)
        signature = private_key.sign(
            transaction_hash.encode("utf-8"),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return base64.b64encode(signature).decode("utf-8")

    def verify_signature(self, public_key_pem: str, transaction_hash: str, signature: str) -> bool:
        try:
            public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
            public_key.verify(
                base64.b64decode(signature.encode("utf-8")),
                transaction_hash.encode("utf-8"),
                padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False


signature_service = DigitalSignatureService()
