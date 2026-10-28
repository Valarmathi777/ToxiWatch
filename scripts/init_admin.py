"""
Admin Account Initialization & Management CLI.
Allows creating or resetting administrator credentials from PowerShell.
"""

import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.app.database import SessionLocal, Base, engine
from backend.app.models import User
from backend.app.auth import hash_password

def main():
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@sentinel.ai"
    password = sys.argv[2] if len(sys.argv) > 2 else "Admin@Sentinel2026"
    full_name = sys.argv[3] if len(sys.argv) > 3 else "System Administrator"

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"[*] Updating existing user: {email}")
            user.hashed_password = hash_password(password)
            user.full_name = full_name
            user.role = "admin"
            user.is_active = True
        else:
            print(f"[*] Creating new administrator: {email}")
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True
            )
            db.add(user)
        db.commit()
        print(f"[+] Administrator {email} configured successfully with role 'admin'!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
