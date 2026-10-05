import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient

from backend.app import app, create_app
from backend.models import Site
from backend.reference import REFERENCE, ReferenceSite
from scripts.export_static import export_static


class PortfolioTests(unittest.TestCase):
    def test_reference_contract_and_content(self):
        with TestClient(app) as client:
            response = client.get('/api/reference.json')
            self.assertEqual(response.status_code, 200)
            snapshot = ReferenceSite.model_validate(response.json())
            self.assertEqual(snapshot.name, 'Chen Fang')
            self.assertEqual(len(snapshot.navigation), 7)
            self.assertEqual(set(snapshot.documents), {'cv', 'resume'})
            self.assertTrue(all(item.path in snapshot.pages for item in snapshot.navigation))

    def test_multilingual_api_contract(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json(), {"status": "ok"})
            response = client.get("/api/site.json")
            self.assertEqual(response.status_code, 200)
            site = Site.model_validate(response.json())
            self.assertEqual(site.profile.name, "MVChem")
            self.assertEqual(len(site.experiences), 4)
            self.assertEqual({project.kind for project in site.projects}, {"orbit", "garden", "play"})
            for experience in site.experiences:
                self.assertIn("示例", experience.period.zh)
                self.assertTrue(experience.description.zh)
                self.assertTrue(experience.description.en)

    def test_export_matches_api_and_serves_direct_routes(self):
        with TemporaryDirectory() as temp:
            dist = Path(temp) / "dist"
            dist.mkdir()
            index = "<!doctype html><html><body>Portfolio</body></html>"
            (dist / "index.html").write_text(index, encoding="utf-8")
            (Path(temp) / "private.txt").write_text("private", encoding="utf-8")
            endpoint = export_static(dist)
            with TestClient(create_app(dist)) as client:
                self.assertEqual(json.loads(endpoint.read_text(encoding="utf-8")), client.get("/api/site.json").json())
                routes = ["/"]
                routes += [route + '/' for route in REFERENCE.pages if route != '/']
                for locale in ("zh", "en", "ja", "ko"):
                    routes += [f"/{locale}/", f"/{locale}/portfolio/", f"/{locale}/aboutme/"]
                    routes += [f"/{locale}/projects/{project.id}/" for project in Site.model_validate(client.get("/api/site.json").json()).projects]
                for route in routes:
                    response = client.get(route)
                    self.assertEqual(response.status_code, 200, route)
                    self.assertEqual(response.text, index)
                self.assertEqual(client.get("/api/missing").status_code, 404)
                self.assertEqual(client.get("/assets/missing.js").status_code, 404)
                self.assertEqual(client.get("/%2e%2e/private.txt").status_code, 404)
            self.assertEqual((dist / "zh" / "index.html").read_text(), index)
            self.assertEqual((dist / "en" / "index.html").read_text(), index)
            self.assertEqual((dist / "404.html").read_text(), index)
            self.assertTrue((dist / ".nojekyll").is_file())
            self.assertEqual(
                {path.relative_to(dist).as_posix() for path in dist.rglob("*") if path.is_file()},
                {"index.html", "404.html", ".nojekyll", "api/site.json", "api/reference.json"} | {f"{route.strip('/')}/index.html" for route in routes if route != "/"},
            )
            self.assertEqual(json.loads((dist/'api/reference.json').read_text()), REFERENCE.model_dump(mode='json'))

    def test_missing_build_fails_before_export(self):
        with TemporaryDirectory() as temp:
            dist = Path(temp)
            with self.assertRaises(FileNotFoundError):
                export_static(dist)
            self.assertFalse((dist / "api").exists())


if __name__ == "__main__":
    unittest.main()
