"""Snapshot the real API into an existing Vite build for GitHub Pages."""

import argparse
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from backend.app import app  # noqa: E402
from backend.reference import ReferenceSite  # noqa: E402


def export_static(dist_dir: Path) -> Path:
    dist_dir = dist_dir.resolve()
    index = dist_dir / "index.html"
    if not index.is_file():
        raise FileNotFoundError(f"Vite build missing: {index}. Build the frontend first.")

    with TestClient(app) as client:
        response = client.get("/api/site.json")
        response.raise_for_status()
        payload = ReferenceSite.model_validate(response.json()).model_dump(mode="json")
        reference_response = client.get('/api/reference.json')
        reference_response.raise_for_status()
        reference = ReferenceSite.model_validate(reference_response.json()).model_dump(mode='json')

    endpoint_file = dist_dir / "api" / "site.json"
    endpoint_file.parent.mkdir(parents=True, exist_ok=True)
    endpoint_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (endpoint_file.parent / 'reference.json').write_text(json.dumps(reference, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for route in reference['pages']:
        if route == '/':
            continue
        route_dir = dist_dir / route.strip('/')
        route_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(index, route_dir / 'index.html')
    shutil.copyfile(index, dist_dir / "404.html")
    (dist_dir / ".nojekyll").touch()
    return endpoint_file


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, default=ROOT / "frontend" / "dist")
    args = parser.parse_args()
    endpoint = export_static(args.dist)
    print(f"Exported API snapshot and locale routes to {endpoint.parent.parent}")
