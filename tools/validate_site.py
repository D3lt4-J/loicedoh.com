"""Validate the static portfolio release without external dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re
import subprocess
import sys

root = Path(sys.argv[1])
html = (root / 'index.html').read_text(encoding='utf-8')
assert '<title>Loïc Edoh — Portfolio</title>' in html
assert '<div class="preview-note">' not in html, 'Preview banner must not ship'
assert 'styles/concept.css' in html, 'New validated interface missing'
assert 'scripts/tactile.js' in html
assert (root / 'CNAME').read_text().strip() == 'loicedoh.com'
assert (root / '.nojekyll').exists()
panel = html.split('<article id="delivered-with-care"')[1].split('</article>')[0]
images = re.findall(r'<img src="(assets/project_images/dwc/[^"]+)', panel)
assert images == ['assets/project_images/dwc/gameplay-park-original.png'], images
assert 'assets/gameplay-web/dwc.mp4' in panel

class References(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('src', 'href', 'poster') or not value:
                continue
            url = urlsplit(value)
            if not url.scheme and not url.netloc and url.path:
                assert (root / unquote(url.path)).is_file(), f'Missing asset: {value}'

References().feed(html)
for p in (root / 'styles').glob('*.css'):
    pattern = r'''url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)'''
    for match in re.finditer(pattern, p.read_text(encoding='utf-8')):
        ref = next(value for value in match.groups() if value is not None)
        url = urlsplit(ref.strip())
        if not url.scheme and not url.netloc and url.path:
            asset = root / unquote(url.path).lstrip('/') if url.path.startswith('/') else p.parent / unquote(url.path)
            assert asset.is_file(), f'Missing CSS asset: {p.name}: {ref}'
for p in (root / 'scripts').glob('*.js'):
    subprocess.run(['node', '--check', str(p)], check=True, capture_output=True)
print('PASS: release title, no preview banner, new interface, DWC gallery, video, domain, HTML/CSS assets, JS syntax')
