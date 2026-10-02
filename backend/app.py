from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

from backend.data import SITE
from backend.models import Site


ROOT = Path(__file__).resolve().parents[1]


def create_app(dist_dir: Path | None = None) -> FastAPI:
    application = FastAPI(title="MVChem Portfolio", version="1.0.0")
    frontend = (dist_dir if dist_dir is not None else ROOT / "frontend" / "dist").resolve()

    @application.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/api/site.json", response_model=Site)
    def site() -> Site:
        return SITE

    @application.get("/{path:path}", include_in_schema=False)
    def frontend_file(path: str) -> FileResponse:
        candidate = (frontend / path).resolve()
        if not candidate.is_relative_to(frontend):
            raise HTTPException(status_code=404, detail="Not found")
        if candidate.is_file():
            return FileResponse(candidate)
        if path.rstrip("/") in {"", "zh", "en"}:
            index = frontend / "index.html"
            if index.is_file():
                return FileResponse(index)
        raise HTTPException(status_code=404, detail="Not found")

    return application


app = create_app()
