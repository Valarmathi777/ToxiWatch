"""
Real-time Context-Aware ML Inference Engine.
Loads saved Model A, B, C, D pipelines and provides comprehensive prediction,
toxicity risk scoring, explainability indicators, and review categorization.
"""

import os
import json
import joblib
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional, List

from .preprocessor import TextPreprocessor, default_preprocessor


MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")
METRICS_PATH = os.path.join(MODEL_DIR, "evaluation_report.json")


class InferenceEngine:
    def __init__(self):
        self.preprocessor = default_preprocessor
        self.model_a = None  # Baseline
        self.model_b = None  # Hate speech
        self.model_c = None  # Context-aware
        self.model_d = None  # Toxicity regressor
        self.metadata = {}
        self.version = "v1.0.0"
        self._load_models()

    def _load_models(self):
        try:
            model_c_path = os.path.join(MODEL_DIR, "model_context_aware.joblib")
            if os.path.exists(model_c_path):
                self.model_c = joblib.load(model_c_path)
            
            model_a_path = os.path.join(MODEL_DIR, "model_baseline_text.joblib")
            if os.path.exists(model_a_path):
                self.model_a = joblib.load(model_a_path)

            model_b_path = os.path.join(MODEL_DIR, "model_hate_speech.joblib")
            if os.path.exists(model_b_path):
                self.model_b = joblib.load(model_b_path)

            model_d_path = os.path.join(MODEL_DIR, "model_toxicity_regressor.joblib")
            if os.path.exists(model_d_path):
                self.model_d = joblib.load(model_d_path)

            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.version = self.metadata.get("version", "v1.0.0")
        except Exception as e:
            print(f"Warning loading models: {e}")

    @property
    def is_ready(self) -> bool:
        return self.model_c is not None

    def explain_prediction(self, text: str, pipeline, top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Extract top feature indicators contributing to the decision from TF-IDF + LogisticRegression.
        """
        try:
            vectorizer = pipeline.named_steps['tfidf']
            clf = pipeline.named_steps['clf']
            feature_names = np.array(vectorizer.get_feature_names_out())

            # Transform input text
            X = vectorizer.transform([text])
            if X.nnz == 0:
                return []

            # Get predicted class index
            class_idx = clf.predict(X)[0]
            if hasattr(clf, 'classes_'):
                class_pos = np.where(clf.classes_ == class_idx)[0]
                if len(class_pos) > 0:
                    coef = clf.coef_[class_pos[0]]
                else:
                    coef = clf.coef_[0]
            else:
                coef = clf.coef_[0]

            # Multiply features with coefficients
            row = X.toarray()[0]
            scores = row * coef
            nonzero_indices = np.where(row > 0)[0]
            if len(nonzero_indices) == 0:
                return []

            sorted_indices = nonzero_indices[np.argsort(scores[nonzero_indices])][::-1]
            explanations = []
            for idx in sorted_indices[:top_n]:
                term = feature_names[idx]
                score = float(scores[idx])
                explanations.append({
                    "term": term,
                    "importance": round(score, 4),
                    "impact": "increases_toxicity" if score > 0 else "mitigating_context"
                })
            return explanations
        except Exception as e:
            return []

    def predict(
        self,
        comment: str,
        conversation_context: Optional[str] = None,
        confidence_threshold: float = 0.55
    ) -> Dict[str, Any]:
        """
        Executes real-time multi-model inference, risk scoring, and categorization.
        """
        if not self.is_ready:
            self._load_models()
            if not self.is_ready:
                raise RuntimeError("Models are not trained or loaded yet. Run training first.")

        cleaned_comment = self.preprocessor.clean(comment)
        cleaned_context = self.preprocessor.clean(conversation_context) if conversation_context else ""
        contextual_text = self.preprocessor.build_context_text(comment, conversation_context)

        # 1. Model C: Context-Aware Category Prediction
        probs_c = self.model_c.predict_proba([contextual_text])[0]
        classes_c = list(self.model_c.classes_)
        pred_cat_idx = np.argmax(probs_c)
        pred_category = str(classes_c[pred_cat_idx])
        confidence = float(probs_c[pred_cat_idx])
        uncertainty = round(1.0 - confidence, 4)

        all_category_probs = {
            str(cls_name): round(float(prob), 4)
            for cls_name, prob in zip(classes_c, probs_c)
        }

        # 2. Model A: Baseline Text-Only prediction (for comparison)
        baseline_category = None
        baseline_confidence = None
        if self.model_a:
            probs_a = self.model_a.predict_proba([cleaned_comment])[0]
            classes_a = list(self.model_a.classes_)
            idx_a = np.argmax(probs_a)
            baseline_category = str(classes_a[idx_a])
            baseline_confidence = round(float(probs_a[idx_a]), 4)

        # 3. Model B: Hate Speech Prediction
        hate_speech_flag = False
        hate_speech_prob = 0.0
        if self.model_b:
            probs_b = self.model_b.predict_proba([cleaned_comment])[0]
            hate_speech_prob = round(float(probs_b[1]), 4)
            hate_speech_flag = bool(probs_b[1] >= 0.50)
        else:
            hate_speech_flag = bool(pred_category == "hate_speech")
            hate_speech_prob = all_category_probs.get("hate_speech", 0.0)

        # 4. Model D: Toxicity Regressor Score (0.0 to 1.0)
        toxicity_score = 0.0
        if self.model_d:
            raw_score = float(self.model_d.predict([contextual_text])[0])
            toxicity_score = round(max(0.0, min(1.0, raw_score)), 4)
        else:
            # Fallback model-derived estimate based on category probabilities
            toxic_weight = (
                all_category_probs.get("hate_speech", 0.0) * 1.0 +
                all_category_probs.get("harmful_toxic", 0.0) * 0.85 +
                all_category_probs.get("offensive", 0.0) * 0.60 +
                all_category_probs.get("friendly_toxic", 0.0) * 0.30
            )
            toxicity_score = round(min(1.0, toxic_weight), 4)

        # 5. Risk Prioritization & Category Assignment (Section 9)
        # Distinguish Normal, Offensive, Friendly-context toxic, Harmful toxic, Hate speech, Needs human review
        final_category = pred_category
        requires_review = False
        review_reason = None

        if confidence < confidence_threshold:
            requires_review = True
            review_reason = f"Low model confidence ({confidence:.2f} < {confidence_threshold:.2f})"
        elif hate_speech_flag and pred_category != "hate_speech":
            requires_review = True
            review_reason = "Conflict: Hate speech detector triggered but multiclass predicted " + pred_category
        elif baseline_category and baseline_category != pred_category and pred_category == "friendly_toxic":
            # Context inverted a toxic-looking comment into friendly teasing!
            review_reason = f"Context disambiguation: text-only flagged '{baseline_category}', but context shows '{pred_category}'."

        # Explanations / influential tokens
        explanations = self.explain_prediction(contextual_text, self.model_c, top_n=5)

        return {
            "comment": comment,
            "conversation_context": conversation_context,
            "cleaned_comment": cleaned_comment,
            "cleaned_context": cleaned_context,
            "predicted_category": final_category,
            "category_probabilities": all_category_probs,
            "confidence": round(confidence, 4),
            "uncertainty": uncertainty,
            "hate_speech": hate_speech_flag,
            "hate_speech_probability": hate_speech_prob,
            "toxicity_score": toxicity_score,
            "baseline_category": baseline_category,
            "baseline_confidence": baseline_confidence,
            "requires_review": requires_review,
            "review_reason": review_reason,
            "explanations": explanations,
            "model_version": self.version,
            "timestamp": datetime.utcnow().isoformat()
        }


# Singleton instance
engine = InferenceEngine()
