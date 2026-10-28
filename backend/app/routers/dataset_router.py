"""
Dataset Management and Exploratory Data Analysis Router.
"""

import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import DatasetImport, User
from ..services.dataset_service import dataset_service
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/dataset", tags=["Dataset"])


@router.get("/eda")
def get_eda_summary():
    """Returns exploratory data analysis of the primary dataset."""
    try:
        report = dataset_service.analyze_dataset(settings.DATASET_PATH)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import")
def trigger_import(
    limit: int = 2500,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)
):
    """Imports records from the local Excel file into the database."""
    try:
        result = dataset_service.import_excel_to_db(
            file_path=settings.DATASET_PATH,
            db=db,
            imported_by="system_admin",
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imports")
def get_import_history(db: Session = Depends(get_db)):
    """Fetch history of dataset imports."""
    imports = db.query(DatasetImport).order_by(DatasetImport.created_at.desc()).all()
    return [i.to_dict() for i in imports]


@router.get("/download-sample")
def download_sample():
    """Serves sample rows from the dataset."""
    if os.path.exists(settings.DATASET_PATH):
        return FileResponse(
            settings.DATASET_PATH,
            filename="Context_Aware_Hate_Toxicity_Dataset_Sample.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    raise HTTPException(status_code=404, detail="Dataset file not found")
