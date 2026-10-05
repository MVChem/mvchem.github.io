from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.gzip import GZipMiddleware

from backend.data import SITE
from backend.models import Site
from backend.reference import REFERENCE, ReferenceSite


ROOT = Path(__file__).resolve().parents[1]


def create_app(dist_dir: Path | None = None) -> FastAPI:
    application = FastAPI(title="Academic Homepage Reference", version="1.0.0")
    application.add_middleware(GZipMiddleware, minimum_size=1000)
    frontend = (dist_dir if dist_dir is not None else ROOT / "frontend" / "dist").resolve()

    @application.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/api/site.json", response_model=Site)
    def site() -> Site:
        return SITE

    @application.get('/api/reference.json', response_model=ReferenceSite)
    def reference_site() -> ReferenceSite:
        return REFERENCE

    @application.get("/{path:path}", include_in_schema=False)
    def frontend_file(path: str) -> FileResponse:
        candidate = (frontend / path).resolve()
        if not candidate.is_relative_to(frontend):
            raise HTTPException(status_code=404, detail="Not found")
        if candidate.is_file():
            return FileResponse(candidate)
        route = path.strip("/").split("/")
        locale_route = route[0] in {"zh", "en", "ja", "ko"} and (
            len(route) == 1
            or (len(route) == 2 and route[1] in {"portfolio", "aboutme"})
            or (len(route) == 3 and route[1] == "projects" and route[2] in {project.id for project in SITE.projects})
        )
        if path == "" or locale_route or '/' + path.strip('/') in REFERENCE.pages:
            index = frontend / "index.html"
            if index.is_file():
                return FileResponse(index)
        raise HTTPException(status_code=404, detail="Not found")

    return application


app = create_app()
