"""
Application Configuration settings loaded from environment or defaults.
Zero-dependency robust settings using standard library and os.getenv.
"""

import os


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "ToxiWatch AI")
    PROJECT_DESCRIPTION: str = os.getenv("PROJECT_DESCRIPTION", "Automated Extraction and Preprocessing of Live Forums for Early Identification of Hate Speech and Toxic Trends")
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"

    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "toxiwatch-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./backend/data/platform.db")

    # Initial Admin
    DEFAULT_ADMIN_EMAIL: str = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@toxiwatch.ai")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@ToxiWatch2026")
    DEFAULT_ADMIN_NAME: str = "ToxiWatch Administrator"

    # Simulation settings
    SIMULATION_INTERVAL_SECONDS: float = float(os.getenv("SIMULATION_INTERVAL_SECONDS", "2.0"))

    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATASET_PATH: str = os.path.join(BASE_DIR, "Context_Aware_Hate_Toxicity_Dataset_10000plus.xlsx")
    MODEL_DIR: str = os.path.join(BASE_DIR, "backend", "models")


settings = Settings()
