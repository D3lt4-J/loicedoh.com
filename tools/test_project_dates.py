from pathlib import Path
import re
s=(Path(__file__).parent.parent/'index.html').read_text(encoding='utf-8')
expected={'jam-in':'2025','seekers':'2025–2026','lucky-luke':'2025','heavy-skits':'2024','airship-city':'2023','delivered-with-care':'2023','greedy-bubble':'2023'}
for key,year in expected.items():
 panel=s.split(f'<article id="{key}"')[1].split('</article>')[0]
 heading=panel.split('<div class="project-heading">')[1].split('</div>')[0]
 assert heading.count('class="project-meta"')==1,key+' needs one metadata line'
 assert f'<span class="project-year">{year}</span>' in heading,key
 assert 'class="project-date"' not in heading,key
 assert 'FIBD 2025' not in heading and '6 personnes' not in heading and '6 people' not in heading,key
 assert not re.search(r'janvier|avril|juin|août|octobre|January|April|June|August|October',heading),key
print('PASS: seven uniform metadata lines; years only; no duplicated event year, months or team details')
