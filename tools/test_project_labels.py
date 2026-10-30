from pathlib import Path
import json
import re
from html import escape
root = Path(__file__).parent
labels = json.loads((root/'project-labels.json').read_text(encoding='utf-8'))
s = (root.parent/'index.html').read_text(encoding='utf-8')
for key,d in labels.items():
    pair = f'<span class="fr" lang="fr">{escape(d["fr"])}</span><span class="en" lang="en">{escape(d["en"])}</span>'
    panel = s.split(f'<article id="{key}"')[1].split('</article>')[0]
    assert f'<p class="project-subtitle">{pair}</p>' in panel, key+' page subtitle missing'
    links = re.findall(r'<a\b[^>]*>.*?</a>', s)
    project_links = [a for a in links if f'href="#{key}"' in a and 'index-link' in a]
    assert len(project_links)==3, (key,len(project_links))
    assert all(f'<span class="project-link-subtitle">{pair}</span>' in a for a in project_links), key+' link subtitles missing'
airship = s.split('<article id="airship-city"')[1].split('</article>')[0]
assert 'Participation à la conception du système de météo, des bâtiments déblocables et du fonctionnement des bateaux.' in airship
assert 'Contributed to the design of the weather system, unlockable buildings and ship mechanics.' in airship
assert 'Core gameplay, systems design and balancing.' not in airship
print('PASS: 7 page subtitles + 21 project links, bilingual labels and factual Airship contributions')
