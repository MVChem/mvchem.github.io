import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient

from backend.app import app, create_app
from backend.reference import CONTENT_VERSION, REFERENCE, ReferenceSite
from scripts.export_static import export_static
from backend.demo import load_manifest


class PortfolioTests(unittest.TestCase):
    def test_reference_contract_and_content(self):
        with TestClient(app) as client:
            response = client.get('/api/reference.json')
            self.assertEqual(response.status_code, 200)
            snapshot = ReferenceSite.model_validate(response.json())
            self.assertEqual(snapshot.name, 'Hongkang Chu')
            self.assertEqual(snapshot.institution, 'UCAS')
            self.assertEqual(snapshot.documents, {})
            self.assertTrue(all(item.path in snapshot.pages for item in snapshot.navigation))

    def test_public_endpoints_share_personal_content(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json(), {"status": "ok"})
            response = client.get("/api/site.json")
            self.assertEqual(response.status_code, 200)
            site = ReferenceSite.model_validate(response.json())
            self.assertEqual(site, REFERENCE)
            self.assertEqual(response.json(), client.get('/api/reference.json').json())
            self.assertEqual(response.json(), client.get(f'/api/reference.{CONTENT_VERSION}.json').json())
            self.assertEqual(client.get('/api/reference.unknown.json').status_code, 404)

    def test_public_content_excludes_private_work_and_reference_author(self):
        content = REFERENCE.model_dump_json().lower()
        for excluded in ('medcase', 'cfmmp2xvbk', 'tgdnyovybf', 'chen fang', 'chenfang', 'medxr',
                         'gazeagent', 'audioguard', 'nyulangone', 'nowmad', 'chenf3@'):
            self.assertNotIn(excluded, content)
        self.assertIn('/photos/chuhongkang-centered.png', REFERENCE.profile.model_dump_json())
        for reference in ('erYE1VciKv', '10.1016/j.mrl.2026.200272', '10.1021/acs.jpclett.5c03529',
                          'ISMRM 2026', '10.3390/ijms25084507'):
            self.assertIn(reference.lower(), content)

    def test_public_documents_and_attachments_respect_disclosure_scope(self):
        public = Path(__file__).resolve().parents[1] / 'frontend/public'
        for path in ('CV.pdf', 'resume.pdf', 'previews/cv-1.png', 'previews/cv-2.png', 'previews/resume-1.png'):
            self.assertFalse((public / path).exists())
        self.assertNotIn('/cv', REFERENCE.pages)
        self.assertFalse(any(item.path == '/cv' for item in REFERENCE.navigation))
        self.assertNotIn('/CV.pdf', REFERENCE.profile.model_dump_json())
        self.assertFalse((public / 'downloads/MDLE-V8.pptx').exists())
        self.assertFalse((public / 'img/simg-8f5a877c.webp').exists())

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
                for route in routes:
                    response = client.get(route)
                    self.assertEqual(response.status_code, 200, route)
                    self.assertEqual(response.text, index)
                self.assertEqual(client.get("/api/missing").status_code, 404)
                for path in ('/cv', '/CV.pdf', '/resume.pdf', '/previews/cv-1.png'):
                    self.assertEqual(client.get(path).status_code, 404, path)
                self.assertEqual(client.get("/assets/missing.js").status_code, 404)
                self.assertEqual(client.get("/%2e%2e/private.txt").status_code, 404)
            self.assertEqual((dist / "404.html").read_text(), index)
            self.assertTrue((dist / ".nojekyll").is_file())
            self.assertEqual(
                {path.relative_to(dist).as_posix() for path in dist.rglob("*") if path.is_file()},
                {"index.html", "404.html", ".nojekyll", "api/site.json", "api/reference.json", f"api/reference.{CONTENT_VERSION}.json", "api/demo/vertebrae.json", f"api/demo/vertebrae.{load_manifest().version}.json"} | {f"{route.strip('/')}/index.html" for route in routes if route != "/"},
            )
            self.assertEqual(json.loads((dist/'api/reference.json').read_text()), REFERENCE.model_dump(mode='json'))

    def test_missing_build_fails_before_export(self):
        with TemporaryDirectory() as temp:
            dist = Path(temp)
            with self.assertRaises(FileNotFoundError):
                export_static(dist)
            self.assertFalse((dist / "api").exists())

    def test_research_demo_retains_authentic_cases_and_changed_slices(self):
        with TestClient(app) as client:
            response = client.get('/api/demo/vertebrae.json')
            self.assertEqual(response.status_code, 200)
            manifest = response.json()
            self.assertEqual(client.get(f"/api/demo/vertebrae.{manifest['version']}.json").json(), manifest)
            self.assertEqual(client.get('/api/demo/vertebrae.unknown.json').status_code, 404)
        self.assertFalse(manifest['groundTruthAvailable'])
        self.assertEqual({case['id'] for case in manifest['cases']}, {'BDMAP_00000006','BDMAP_00000031'})
        for case in manifest['cases']:
            self.assertEqual(len(case['labels']), 24)
            self.assertEqual(case['added_voxels'], 0)
            for plane,frames in case['frames'].items():
                indices=[frame['index'] for frame in frames]
                self.assertEqual(indices, sorted(set(indices)))
                edited=[frame for frame in frames if frame['index']==case['change_indices'][plane]]
                self.assertEqual(len(edited), 1)
                self.assertGreater(edited[0]['changedPixels'], 0)


if __name__ == "__main__":
    unittest.main()
