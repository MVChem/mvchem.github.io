from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.gzip import GZipMiddleware

from backend.reference import CONTENT_VERSION, REFERENCE, ROUTE_REDIRECTS, ReferenceSite
from backend.demo import DemoManifest, load_manifest


ROOT = Path(__file__).resolve().parents[1]


def create_app(dist_dir: Path | None = None) -> FastAPI:
    application = FastAPI(title="Hongkang Chu Academic Homepage", version="1.1.0")
    application.add_middleware(GZipMiddleware, minimum_size=1000)
    frontend = (dist_dir if dist_dir is not None else ROOT / "frontend" / "dist").resolve()

    @application.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get('/api/site.json', response_model=ReferenceSite)
    @application.get('/api/reference.json', response_model=ReferenceSite)
    def reference_site() -> ReferenceSite:
        return REFERENCE

    @application.get('/api/reference.{version}.json', response_model=ReferenceSite)
    def versioned_reference_site(version: str) -> ReferenceSite:
        if version != CONTENT_VERSION:
            raise HTTPException(status_code=404, detail='Not found')
        return REFERENCE

    @application.get('/api/demo/vertebrae.json', response_model=DemoManifest)
    @application.get('/api/demo/vertebrae.{version}.json', response_model=DemoManifest)
    def vertebrae_demo(version: str | None = None) -> DemoManifest:
        try:
            manifest = load_manifest()
        except FileNotFoundError:
            raise HTTPException(503, 'Research demo export is being prepared')
        if version is not None and version != manifest.version:
            raise HTTPException(404, 'Not found')
        return manifest

    @application.get("/{path:path}", include_in_schema=False, response_model=None)
    def frontend_file(path: str, request: Request) -> FileResponse | RedirectResponse:
        if target := ROUTE_REDIRECTS.get('/' + path.strip('/')):
            query = '?' + request.url.query if request.url.query else ''
            return RedirectResponse(target + query, status_code=308)
        candidate = (frontend / path).resolve()
        if not candidate.is_relative_to(frontend):
            raise HTTPException(status_code=404, detail="Not found")
        if candidate.is_file():
            return FileResponse(candidate)
        if path == "" or '/' + path.strip('/') in REFERENCE.pages:
            index = frontend / "index.html"
            if index.is_file():
                return FileResponse(index)
        raise HTTPException(status_code=404, detail="Not found")

    return application


app = create_app()
