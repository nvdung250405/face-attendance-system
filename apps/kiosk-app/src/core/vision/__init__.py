"""Gói thị giác máy tính và suy luận trí tuệ nhân tạo tại biên (core.vision)."""

from core.vision.camera_worker import CameraWorker
from core.vision.face_detector import FaceDetectionResult, YuNetFaceDetector
from core.vision.feature_extractor import (
    REFERENCE_FACIAL_POINTS,
    ArcFaceFeatureExtractor,
)
from core.vision.gallery_matcher import GalleryCacheManager
from core.vision.liveness_gate import LivenessResult, MiniFASNetLivenessGate

__all__ = [
    "CameraWorker",
    "YuNetFaceDetector",
    "FaceDetectionResult",
    "ArcFaceFeatureExtractor",
    "REFERENCE_FACIAL_POINTS",
    "GalleryCacheManager",
    "MiniFASNetLivenessGate",
    "LivenessResult",
]
