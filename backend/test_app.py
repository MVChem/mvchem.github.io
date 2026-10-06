import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient

from backend.app import app, create_app
from backend.reference import REFERENCE, ReferenceSite
from scripts.export_static import export_static


class PortfolioTests(unittest.TestCase):
    def test_reference_contract_and_content(self):
        with TestClient(app) as client:
            response = client.get('/api/reference.json')
            self.assertEqual(response.status_code, 200)
            snapshot = ReferenceSite.model_validate(response.json())
            self.assertEqual(snapshot.name, 'Hongkang Chu')
            self.assertEqual(snapshot.institution, 'University of the Chinese Academy of Sciences')
            self.assertEqual(set(snapshot.documents), {'cv', 'resume'})
            self.assertTrue(all(item.path in snapshot.pages for item in snapshot.navigation))

    def test_public_endpoints_share_personal_content(self):
        with TestClient(app) as client:
            self.assertEqual(client.get("/api/health").json(), {"status": "ok"})
            response = client.get("/api/site.json")
            self.assertEqual(response.status_code, 200)
            site = ReferenceSite.model_validate(response.json())
            self.assertEqual(site, REFERENCE)
            self.assertEqual(response.json(), client.get('/api/reference.json').json())

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
        import subprocess
        public = Path(__file__).resolve().parents[1] / 'frontend/public'
        for document in ('CV.pdf', 'resume.pdf'):
            text = subprocess.check_output(['pdftotext', str(public / document), '-'], text=True)
            self.assertIn('Hongkang Chu', text)
            self.assertIn('chuhongkang25@mails.ucas.ac.cn', text)
            self.assertIn('TRACE', text)
            self.assertIn('Magnetic Resonance Letters', text)
            for excluded in ('MedCase', 'Chen Fang', 'clinical case report'):
                self.assertNotIn(excluded.lower(), text.lower())
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
                self.assertEqual(client.get("/assets/missing.js").status_code, 404)
                self.assertEqual(client.get("/%2e%2e/private.txt").status_code, 404)
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
