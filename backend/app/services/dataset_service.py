"""
Dataset Ingestion and Exploratory Data Analysis (EDA) Service.
Handles Excel validation, deduplication, statistical profiling, and batch database loading.
"""

import os
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..models import Post, DatasetImport
from ..ml.preprocessor import default_preprocessor
from ..ml.inference import engine


class DatasetService:
    def __init__(self):
        self.preprocessor = default_preprocessor

    def analyze_dataset(self, file_path: str) -> Dict[str, Any]:
        """
        Performs thorough Exploratory Data Analysis (EDA) on the dataset.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        df = pd.read_excel(file_path)
        total_rows = len(df)

        required_cols = ['comment', 'conversation_context', 'category', 'toxicity_score', 'hate_speech']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Missing mandatory columns: {missing_cols}")

        # Missing values analysis
        missing_counts = df.isnull().sum().to_dict()

        # Category distribution
        cat_counts = df['category'].value_counts(dropna=False).to_dict()
        cat_percentages = {k: round(v / total_rows * 100, 2) for k, v in cat_counts.items()}

        # Hate speech distribution
        hate_counts = df['hate_speech'].value_counts(dropna=False).to_dict()

        # Toxicity score stats
        tox = df['toxicity_score'].dropna()
        toxicity_stats = {
            "mean": round(float(tox.mean()), 4),
            "median": round(float(tox.median()), 4),
            "std": round(float(tox.std()), 4),
            "min": round(float(tox.min()), 4),
            "max": round(float(tox.max()), 4),
            "q25": round(float(tox.quantile(0.25)), 4),
            "q75": round(float(tox.quantile(0.75)), 4),
        }

        # Text length distributions
        comment_lengths = df['comment'].fillna('').astype(str).apply(len)
        comment_word_counts = df['comment'].fillna('').astype(str).apply(lambda x: len(x.split()))
        text_stats = {
            "char_length_mean": round(float(comment_lengths.mean()), 1),
            "char_length_min": int(comment_lengths.min()),
            "char_length_max": int(comment_lengths.max()),
            "word_count_mean": round(float(comment_word_counts.mean()), 1),
            "word_count_min": int(comment_word_counts.min()),
            "word_count_max": int(comment_word_counts.max())
        }

        # Intent distribution if available
        intent_counts = {}
        if 'intent' in df.columns:
            intent_counts = df['intent'].value_counts().head(10).to_dict()

        # Duplicates check
        exact_duplicate_comments = int(df.duplicated(subset=['comment']).sum())

        return {
            "filename": os.path.basename(file_path),
            "total_rows": total_rows,
            "columns": df.columns.tolist(),
            "missing_values": missing_counts,
            "categories": cat_counts,
            "category_percentages": cat_percentages,
            "hate_speech_distribution": {str(k): int(v) for k, v in hate_counts.items()},
            "toxicity_stats": toxicity_stats,
            "text_stats": text_stats,
            "intent_distribution": intent_counts,
            "exact_duplicate_comments": exact_duplicate_comments,
            "analyzed_at": datetime.utcnow().isoformat()
        }

    def import_excel_to_db(
        self,
        file_path: str,
        db: Session,
        imported_by: str = "admin",
        limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Validates, preprocesses, deduplicates and imports records into the database.
        Runs inference on items where necessary.
        """
        eda_summary = self.analyze_dataset(file_path)
        df = pd.read_excel(file_path)
        if limit:
            df = df.head(limit)

        total_rows = len(df)
        imported_count = 0
        duplicates_skipped = 0
        invalid_rows = 0

        existing_ids = set(p[0] for p in db.query(Post.comment_id).filter(Post.comment_id.isnot(None)).all())
        batch = []
        batch_size = 500

        for idx, row in df.iterrows():
            try:
                cmt_id = str(row.get('comment_id', f"cmt_{idx}"))
                if cmt_id in existing_ids:
                    duplicates_skipped += 1
                    continue

                comment = str(row['comment']) if pd.notnull(row['comment']) else ""
                if not comment.strip():
                    invalid_rows += 1
                    continue

                context = str(row['conversation_context']) if pd.notnull(row['conversation_context']) else ""
                cleaned_comment = self.preprocessor.clean(comment)
                cleaned_context = self.preprocessor.clean(context)
                text_hash = self.preprocessor.compute_hash(comment)

                existing_ids.add(cmt_id)

                category = str(row.get('category', 'normal'))
                tox_score = float(row.get('toxicity_score', 0.0))
                hate_flag = bool(int(row.get('hate_speech', 0)))

                post = Post(
                    comment_id=cmt_id,
                    conversation_id=str(row.get('conversation_id', f"cnv_{idx}")),
                    user_id=str(row.get('user_id', f"usr_{idx}")),
                    comment=comment,
                    conversation_context=context,
                    cleaned_comment=cleaned_comment,
                    cleaned_context=cleaned_context,
                    source="dataset",
                    original_category=category,
                    predicted_category=category,
                    toxicity_score=tox_score,
                    hate_speech=hate_flag,
                    hate_speech_probability=1.0 if hate_flag else 0.0,
                    confidence=0.98,
                    uncertainty=0.02,
                    requires_review=bool(category == "harmful_toxic" or hate_flag),
                    review_reason="Dataset baseline record flagged for baseline verification" if hate_flag else None,
                    review_status="reviewed",
                    is_simulated=False,
                    text_hash=text_hash,
                    created_at=datetime.utcnow()
                )
                batch.append(post)

                if len(batch) >= batch_size:
                    db.bulk_save_objects(batch)
                    db.commit()
                    imported_count += len(batch)
                    batch = []

            except Exception as e:
                invalid_rows += 1

        if batch:
            db.bulk_save_objects(batch)
            db.commit()
            imported_count += len(batch)

        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

        # Save import summary
        import_record = DatasetImport(
            filename=os.path.basename(file_path),
            total_rows=total_rows,
            imported_rows=imported_count,
            duplicates_skipped=duplicates_skipped,
            invalid_rows=invalid_rows,
            file_size_bytes=file_size,
            summary_json=json.dumps(eda_summary),
            imported_by=imported_by,
            created_at=datetime.utcnow()
        )
        db.add(import_record)
        db.commit()

        return {
            "status": "success",
            "filename": os.path.basename(file_path),
            "total_rows": total_rows,
            "imported_rows": imported_count,
            "duplicates_skipped": duplicates_skipped,
            "invalid_rows": invalid_rows,
            "eda_summary": eda_summary
        }


dataset_service = DatasetService()
