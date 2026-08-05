#!/usr/bin/env python3

import json
import os
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import redis
import requests
from ultralytics import YOLO

QUEUE_KEY = "visionflow:jobs"
PERSON_CLASS_ID = 0


@dataclass
class ProcessingStats:
    processed_frames: int = 0
    people_per_frame: list[int] = field(default_factory=list)
    track_ids: set[int] = field(default_factory=set)
    max_people_in_frame: int = 0


class VideoProcessor:
    def __init__(self):
        self.storage_path = Path(os.getenv("STORAGE_PATH", "/app/storage"))
        self.api_url = os.getenv("API_URL", "http://localhost:3333")
        self.confidence = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
        model_name = os.getenv("YOLO_MODEL", "yolov8n.pt")
        self.model = YOLO(model_name)
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            decode_responses=True,
        )

    def run(self):
        print("VisionFlow processor started. Waiting for jobs...")
        while True:
            result = self.redis_client.brpop(QUEUE_KEY, timeout=5)
            if result is None:
                continue
            job_id = result[1]
            print(f"Processing job: {job_id}")
            try:
                self.process_job(job_id)
            except Exception as error:
                print(f"Job {job_id} failed: {error}")
                self.update_video(job_id, {"status": "failed", "errorMessage": str(error)})

    def process_job(self, job_id: str):
        start_time = time.time()
        self.update_video(job_id, {"status": "processing", "progress": 5})

        video_path = self.storage_path / "uploads" / self.find_upload_file(job_id)
        if not video_path.exists():
            raise FileNotFoundError(f"Video not found for job {job_id}")

        normalized_path = self.storage_path / "uploads" / f"{job_id}_normalized.mp4"
        self.normalize_video(video_path, normalized_path)
        self.update_video(job_id, {"progress": 15})

        processed_dir = self.storage_path / "processed"
        reports_dir = self.storage_path / "reports"
        processed_dir.mkdir(parents=True, exist_ok=True)
        reports_dir.mkdir(parents=True, exist_ok=True)

        output_path = processed_dir / f"{job_id}.mp4"
        report_path = reports_dir / f"{job_id}.json"

        stats = self.detect_and_annotate(normalized_path, output_path, job_id)
        self.restore_audio(normalized_path, output_path)

        processing_time = round(time.time() - start_time, 1)
        avg_people = (
            round(sum(stats.people_per_frame) / len(stats.people_per_frame), 1)
            if stats.people_per_frame
            else 0
        )

        cap = cv2.VideoCapture(str(normalized_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = round(frame_count / fps, 1) if fps else 0
        cap.release()

        report = {
            "status": "completed",
            "durationSeconds": duration,
            "processedFrames": stats.processed_frames,
            "uniquePeople": len(stats.track_ids),
            "maximumPeopleInFrame": stats.max_people_in_frame,
            "averagePeoplePerFrame": avg_people,
            "processingTimeSeconds": processing_time,
        }

        report_path.write_text(json.dumps(report, indent=2))

        self.update_video(
            job_id,
            {
                "status": "completed",
                "progress": 100,
                "durationSeconds": duration,
                "width": width,
                "height": height,
                "frameCount": frame_count,
                "uniquePeople": len(stats.track_ids),
                "maxPeopleInFrame": stats.max_people_in_frame,
                "averagePeoplePerFrame": avg_people,
                "processingTimeSeconds": processing_time,
            },
        )

        if normalized_path.exists() and normalized_path != video_path:
            normalized_path.unlink()

        print(f"Job {job_id} completed in {processing_time}s")

    def find_upload_file(self, job_id: str) -> str:
        uploads_dir = self.storage_path / "uploads"
        for file in uploads_dir.iterdir():
            if file.stem == job_id:
                return file.name
        raise FileNotFoundError(f"No upload file matching {job_id}")

    def normalize_video(self, input_path: Path, output_path: Path):
        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_path),
            "-vf",
            "scale=1280:-2",
            "-r",
            "30",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "23",
            "-an",
            str(output_path),
        ]
        subprocess.run(command, check=True, capture_output=True)

    def restore_audio(self, source_path: Path, video_path: Path):
        temp_path = video_path.with_suffix(".temp.mp4")
        command = [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(source_path),
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-map",
            "0:v:0",
            "-map",
            "1:a:0?",
            "-shortest",
            str(temp_path),
        ]
        result = subprocess.run(command, capture_output=True)
        if result.returncode == 0 and temp_path.exists():
            temp_path.replace(video_path)

    def detect_and_annotate(self, input_path: Path, output_path: Path, job_id: str) -> ProcessingStats:
        cap = cv2.VideoCapture(str(input_path))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

        stats = ProcessingStats()
        frame_index = 0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            results = self.model.track(
                frame,
                persist=True,
                classes=[PERSON_CLASS_ID],
                conf=self.confidence,
                verbose=False,
            )

            people_count = 0
            annotated = frame.copy()

            if results and results[0].boxes is not None:
                boxes = results[0].boxes
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    confidence = float(box.conf[0])
                    track_id = int(box.id[0]) if box.id is not None else None

                    people_count += 1
                    if track_id is not None:
                        stats.track_ids.add(track_id)
                        label = f"Pessoa #{track_id} | {confidence * 100:.0f}%"
                    else:
                        label = f"Pessoa | {confidence * 100:.0f}%"

                    cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 200, 255), 2)
                    cv2.rectangle(annotated, (x1, y1 - 28), (x2, y1), (0, 200, 255), -1)
                    cv2.putText(
                        annotated,
                        label,
                        (x1 + 5, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 0, 0),
                        1,
                        cv2.LINE_AA,
                    )

            stats.people_per_frame.append(people_count)
            stats.max_people_in_frame = max(stats.max_people_in_frame, people_count)
            stats.processed_frames += 1

            overlay = f"Pessoas no frame: {people_count}"
            cv2.rectangle(annotated, (10, 10), (260, 45), (0, 0, 0), -1)
            cv2.putText(
                annotated,
                overlay,
                (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )

            writer.write(annotated)
            frame_index += 1

            if total_frames > 0 and frame_index % 10 == 0:
                progress = min(95, 15 + int((frame_index / total_frames) * 80))
                self.update_video(job_id, {"progress": progress})

        cap.release()
        writer.release()
        return stats

    def update_video(self, job_id: str, payload: dict):
        camel_payload = {}
        mapping = {
            "durationSeconds": "durationSeconds",
            "frameCount": "frameCount",
            "uniquePeople": "uniquePeople",
            "maxPeopleInFrame": "maxPeopleInFrame",
            "averagePeoplePerFrame": "averagePeoplePerFrame",
            "processingTimeSeconds": "processingTimeSeconds",
            "errorMessage": "errorMessage",
        }
        for key, value in payload.items():
            camel_payload[mapping.get(key, key)] = value

        url = f"{self.api_url}/api/videos/{job_id}/progress"
        try:
            requests.patch(url, json=camel_payload, timeout=10)
        except requests.RequestException as error:
            print(f"Failed to update progress for {job_id}: {error}")


if __name__ == "__main__":
    processor = VideoProcessor()
    processor.run()
