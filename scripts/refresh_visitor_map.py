"""Save the site's real MapMyVisitors image as a dated, same-origin fallback."""

from datetime import datetime, timezone
import json
from pathlib import Path
import struct
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'frontend/src/assets'


def refresh() -> None:
    config = json.loads((ROOT / 'frontend/src/components/visitor-map-config.json').read_text())
    request = Request(config['imageUrl'], headers={'User-Agent': 'Hongkang-Chu-Homepage/1.0'})
    with urlopen(request, timeout=30) as response:
        if response.headers.get_content_type() != 'image/png':
            raise ValueError('Visitor map did not return a PNG; the saved map was kept.')
        content = response.read(1_000_001)
    if len(content) > 1_000_000 or content[:16] != b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR':
        raise ValueError('Invalid visitor map; the saved map was kept.')
    width, height = struct.unpack('>II', content[16:24])
    if width != 420 or not 150 <= height <= 300 or b'IEND' not in content[-12:]:
        raise ValueError('Unexpected visitor map dimensions or incomplete image; the saved map was kept.')
    metadata = {
        'updatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'width': width,
        'height': height,
    }
    ASSETS.mkdir(exist_ok=True)
    image_path = ASSETS / 'visitor-map.png'
    temporary = image_path.with_suffix('.tmp')
    temporary.write_bytes(content)
    temporary.replace(image_path)
    (ASSETS / 'visitor-map.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'Saved real visitor map ({width} × {height}); updated {metadata["updatedAt"]}.')


if __name__ == '__main__':
    refresh()
