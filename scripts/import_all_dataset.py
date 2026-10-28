"""
Dataset Batch Ingestion Script.
Imports all records from the Excel dataset into the database with progress logging.
"""

import sys
import os
import time

# Ensure project root is in path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.app.database import SessionLocal, Base, engine as db_engine
from backend.app.services.dataset_service import dataset_service
from backend.app.config import settings
from backend.app.services.trend_service import trend_service

def main():
    print(f"[{time.strftime('%H:%M:%S')}] Starting full dataset import from {settings.DATASET_PATH}...")
    Base.metadata.create_all(bind=db_engine)
    db = SessionLocal()
    try:
        result = dataset_service.import_excel_to_db(
            file_path=settings.DATASET_PATH,
            db=db,
            imported_by="system_admin",
            limit=None  # Import ALL rows
        )
        print(f"[{time.strftime('%H:%M:%S')}] Full Import Result:")
        print(f"  - Total rows in file: {result['total_rows']}")
        print(f"  - Successfully imported: {result['imported_rows']}")
        print(f"  - Duplicates skipped: {result['duplicates_skipped']}")
        print(f"  - Invalid rows: {result['invalid_rows']}")

        print(f"[{time.strftime('%H:%M:%S')}] Triggering trend detection across imported data...")
        trend_service.detect_trends(db)
        print(f"[{time.strftime('%H:%M:%S')}] Dataset import & trend detection complete!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
