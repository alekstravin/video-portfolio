const byId = id => document.getElementById(id);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function link(work, label) {
  const node = element('a', label);
  node.href = work.url;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  return node;
}
function feature(work, image) {
  const card = element('article', '', 'feature');
  if (image) {
    const img = element('img');
    img.src = image;
    img.alt = work.title;
    img.loading = 'lazy';
    card.append(img);
  }
  card.append(element('span', work.method || work.theme, 'tag'), element('h3', work.title),
    element('p', work.description), link(work, 'Смотреть ↗'));
  return card;
}
const chosen = [
  ['DdCnkJQOd4I', 'assets/soup.jpg'], ['DdkEo6iOtiW', 'assets/amelie.jpg'],
  ['DfFQRcQuZMV'], ['DdXHb6zO7_Y'], ['DehScMpIcgJ'], ['DectzJxOuqx']
];
for (const [id, image] of chosen) {
  const work = works.find(item => item.url.includes(id));
  if (work) byId('featured').append(feature(work, image));
}
for (const work of works.filter(item => item.group.startsWith('Авторские музыкальные'))) {
  byId('personal').append(feature(work));
}
for (const [id, label] of [['theme', 'Все темы'], ['method', 'Все техники']]) {
  const select = byId(id);
  select.add(new Option(label, ''));
  const values = [...new Set(works.map(work => work[id]).filter(Boolean))].sort();
  for (const value of values) select.add(new Option(value, value));
  select.addEventListener('change', render);
}
function render() {
  const theme = byId('theme').value;
  const method = byId('method').value;
  const query = byId('query').value.trim().toLocaleLowerCase('ru');
  const results = works.filter(work => (!theme || work.theme === theme) &&
    (!method || work.method === method) && work.title.toLocaleLowerCase('ru').includes(query));
  byId('count').textContent = results.length ? `${results.length} из ${works.length}` : 'Ничего не найдено';
  byId('entries').replaceChildren(...results.map(work => {
    const row = element('li', '', 'entry');
    const details = element('details');
    details.append(element('summary', work.title), element('p', work.method || work.theme, 'tag'),
      element('p', work.description), link(work, 'Открыть видео ↗'));
    row.append(details);
    return row;
  }));
}
byId('query').addEventListener('input', render);
render();
const videos = [...document.querySelectorAll('.frames video')];
const motion = byId('motion');
function setMotion(play) {
  motion.setAttribute('aria-pressed', String(play));
  motion.textContent = play ? 'Пауза Ⅱ' : 'Воспроизвести ▶';
  for (const video of videos) {
    if (play) video.play().catch(() => setMotion(false));
    else video.pause();
  }
}
motion.addEventListener('click', () => setMotion(motion.getAttribute('aria-pressed') !== 'true'));
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setMotion(true);
