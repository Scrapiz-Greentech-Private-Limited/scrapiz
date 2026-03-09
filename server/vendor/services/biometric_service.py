import io
import logging
from typing import Optional

import numpy as np
import requests
from django.db import transaction
from PIL import Image

from vendor.models import ArrivalVerification, Vendor, VendorAuditLog, VendorBiometric

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = 0.6
MODEL_VERSION = 'facenet-v1'


def _load_facenet():
    """Lazy-load FaceNet model (CPU-only)."""
    from facenet_pytorch import MTCNN, InceptionResnetV1
    mtcnn = MTCNN(keep_all=False, device='cpu')
    resnet = InceptionResnetV1(pretrained='vggface2').eval()
    return mtcnn, resnet


_mtcnn = None
_resnet = None


def _get_models():
    global _mtcnn, _resnet
    if _mtcnn is None or _resnet is None:
        _mtcnn, _resnet = _load_facenet()
    return _mtcnn, _resnet


class BiometricService:

    @staticmethod
    def generate_embedding(image_url: str) -> Optional[list]:
        """Download image, detect face, and return 512-d embedding as list of floats."""
        import torch

        try:
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            img = Image.open(io.BytesIO(response.content)).convert('RGB')
        except Exception as e:
            logger.error(f"Failed to download image from {image_url}: {e}")
            return None

        mtcnn, resnet = _get_models()
        face = mtcnn(img)
        if face is None:
            logger.warning(f"No face detected in image: {image_url}")
            return None

        with torch.no_grad():
            embedding = resnet(face.unsqueeze(0))
        return embedding.squeeze().tolist()

    @staticmethod
    @transaction.atomic
    def store_embedding(vendor: Vendor, embedding: list, model_version: str = MODEL_VERSION, actor=None):
        biometric, _ = VendorBiometric.objects.update_or_create(
            vendor=vendor,
            defaults={
                'embedding_vector': embedding,
                'model_version': model_version,
            },
        )
        VendorAuditLog.log_action(
            vendor=vendor,
            action='face_uploaded',
            actor=actor,
            new_value={'model_version': model_version},
        )
        return biometric

    @staticmethod
    def compare_embeddings(embedding1: list, embedding2: list) -> float:
        """Cosine similarity between two embedding vectors."""
        a = np.array(embedding1, dtype=np.float32)
        b = np.array(embedding2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    @transaction.atomic
    def verify_arrival(vendor: Vendor, selfie_url: str, order=None) -> ArrivalVerification:
        """Generate embedding from selfie, compare with stored, create ArrivalVerification."""
        selfie_embedding = BiometricService.generate_embedding(selfie_url)
        if selfie_embedding is None:
            verification = ArrivalVerification.objects.create(
                vendor=vendor,
                order=order,
                selfie_url=selfie_url,
                similarity_score=0.0,
                is_verified=False,
                flag_for_manual_review=True,
            )
            VendorAuditLog.log_action(vendor=vendor, action='face_flagged', details='No face detected in selfie')
            return verification

        try:
            stored = vendor.biometric
        except VendorBiometric.DoesNotExist:
            verification = ArrivalVerification.objects.create(
                vendor=vendor,
                order=order,
                selfie_url=selfie_url,
                similarity_score=0.0,
                is_verified=False,
                flag_for_manual_review=True,
            )
            VendorAuditLog.log_action(vendor=vendor, action='face_flagged', details='No stored biometric found')
            return verification

        score = BiometricService.compare_embeddings(selfie_embedding, stored.embedding_vector)
        is_verified = score >= SIMILARITY_THRESHOLD
        flagged = not is_verified

        verification = ArrivalVerification.objects.create(
            vendor=vendor,
            order=order,
            selfie_url=selfie_url,
            similarity_score=score,
            is_verified=is_verified,
            flag_for_manual_review=flagged,
        )

        if is_verified:
            VendorAuditLog.log_action(vendor=vendor, action='face_verified', new_value={'score': score})
        else:
            VendorAuditLog.log_action(vendor=vendor, action='face_flagged', new_value={'score': score})

        return verification
