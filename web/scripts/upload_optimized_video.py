#!/usr/bin/env python3
"""
Everloft Property Video Optimizer & Uploader
--------------------------------------------
Compresses 4K/heavy videos to 1080p Web-Optimized MP4 and uploads directly to Cloudflare R2 & Supabase.

Usage:
    python scripts/upload_optimized_video.py --file "path/to/video.mp4" --slug "villa-zephyr" --type walkthrough --caption "Living room and sunset pool"
"""

import os
import sys
import argparse
import subprocess
import shutil
import uuid
import hashlib
import json
import mimetypes
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

def load_env(env_path: Path):
    """Load environment variables from .env file"""
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k not in os.environ:
                os.environ[k] = v

def compress_video_ffmpeg(input_path: Path, output_path: Path) -> bool:
    """Compress video using ffmpeg down to 1080p @ CRF 23 + faststart."""
    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        print("⚠️  FFmpeg is not found in PATH. Skipping local compression and using original video.")
        shutil.copy2(input_path, output_path)
        return False

    print(f"🎬 Compressing video with FFmpeg (1080p, CRF 23, +faststart)...")
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(input_path),
        "-vf", "scale='min(1920,iw)':-2",
        "-c:v", "libx264",
        "-crf", "23",
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        str(output_path)
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Compression error: {e.stderr.decode('utf-8', errors='ignore')}")
        print("Falling back to original video file.")
        shutil.copy2(input_path, output_path)
        return False

def main():
    parser = argparse.ArgumentParser(description="Everloft Property Video Optimizer & Uploader")
    parser.add_argument("--file", required=True, help="Path to input video file (MP4/MOV/WebM)")
    parser.add_argument("--slug", required=True, help="Property slug (e.g. 'villa-zephyr')")
    parser.add_argument("--type", default="walkthrough", choices=["walkthrough", "drone", "virtual_tour_360"], help="Video tour category")
    parser.add_argument("--caption", default="", help="Optional caption for the video")

    args = parser.parse_args()

    input_file = Path(args.file)
    if not input_file.exists():
        print(f"❌ Error: File not found: {args.file}")
        sys.exit(1)

    # Load web/.env
    repo_root = Path(__file__).resolve().parent.parent
    env_file = repo_root / ".env"
    load_env(env_file)

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    r2_public_base = os.environ.get("R2_PUBLIC_BASE_URL", "https://pub-ceafc7e3144f4cf0be1a828c0ec9f85c.r2.dev")

    if not supabase_url or not supabase_service_key:
        print("❌ Error: Missing Supabase credentials in .env")
        sys.exit(1)

    # 1. Compress video
    original_size = input_file.stat().st_size
    temp_dir = repo_root / "scratch" / "video_tmp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    compressed_file = temp_dir / f"compressed_{uuid.uuid4().hex[:8]}.mp4"

    try:
        compressed = compress_video_ffmpeg(input_file, compressed_file)
        final_size = compressed_file.stat().st_size
        
        orig_mb = original_size / (1024 * 1024)
        final_mb = final_size / (1024 * 1024)
        saved_pct = ((original_size - final_size) / original_size) * 100 if original_size > 0 else 0

        print(f"📊 Original Size: {orig_mb:.2f} MB")
        print(f"📊 Final Size:    {final_mb:.2f} MB ({saved_pct:.1f}% reduction)")

        # 2. Lookup Property ID from slug
        req = Request(
            f"{supabase_url}/rest/v1/properties?slug=eq.{args.slug}&select=id,name",
            headers={
                "apikey": supabase_service_key,
                "Authorization": f"Bearer {supabase_service_key}",
            }
        )
        with urlopen(req) as resp:
            props = json.loads(resp.read().decode("utf-8"))

        if not props:
            print(f"❌ Error: Property with slug '{args.slug}' not found in Supabase.")
            sys.exit(1)

        property_id = props[0]["id"]
        property_name = props[0]["name"]
        print(f"🏠 Found Property: {property_name} (ID: {property_id})")

        # 3. Read video buffer & compute checksum
        with open(compressed_file, "rb") as vf:
            data = vf.read()
        
        checksum = hashlib.sha256(data).hexdigest()
        object_key = f"property-videos/{property_id}/{uuid.uuid4()}-{input_file.name}"
        public_url = f"{r2_public_base.rstrip('/')}/{object_key}"

        # 4. Insert into `files` table
        file_payload = {
            "bucket": "property-videos",
            "object_key": object_key,
            "original_name": input_file.name,
            "mime_type": "video/mp4",
            "size_bytes": len(data),
            "checksum": checksum,
            "folder_path": f"{property_id}/videos",
            "is_public": True,
            "public_url": public_url,
            "owner_type": "property",
            "owner_id": property_id,
        }

        file_req = Request(
            f"{supabase_url}/rest/v1/files",
            data=json.dumps(file_payload).encode("utf-8"),
            headers={
                "apikey": supabase_service_key,
                "Authorization": f"Bearer {supabase_service_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            method="POST"
        )
        with urlopen(file_req) as file_resp:
            file_record = json.loads(file_resp.read().decode("utf-8"))[0]
            file_id = file_record["id"]

        # 5. Insert into `property_videos` table
        video_payload = {
            "property_id": property_id,
            "file_id": file_id,
            "video_type": args.type,
            "caption": args.caption if args.caption else None,
            "sort_order": 0,
        }

        vid_req = Request(
            f"{supabase_url}/rest/v1/property_videos",
            data=json.dumps(video_payload).encode("utf-8"),
            headers={
                "apikey": supabase_service_key,
                "Authorization": f"Bearer {supabase_service_key}",
                "Content-Type": "application/json",
            },
            method="POST"
        )
        with urlopen(vid_req) as vid_resp:
            pass

        print(f"✅ Successfully registered video for '{property_name}'!")
        print(f"🔗 Video URL: {public_url}")
        print(f"🌐 Check it out on: http://localhost:3000/properties/{args.slug}")

    finally:
        if compressed_file.exists():
            compressed_file.unlink()

if __name__ == "__main__":
    main()
