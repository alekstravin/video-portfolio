const byId = id => document.getElementById(id);
const carousel = byId('carousel');
const player = byId('player');
const indexDialog = byId('index');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const idOf = work => work.url.replace(/\/$/, '').split('/').pop();
const format = number => String(number).padStart(2, '0');
const ordered = [...works].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const themes = ['Все', 'Рецепты', 'Сочетания', 'Познавательные', 'Анонсы', 'Короткие истории', 'Юмор', 'Музыка'];
const numbers = new Map(ordered.map((work, i) => [work, format(i + 1)]));
let selection = ordered;
let active = 0;
let ticking = false;
const archiveVideos = new Set(['DeKo2iAON6X', 'De1_gShuPhz']);

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showVideo(work) {
  const youtube = work.url.includes('youtu.be');
  const id = idOf(work);
  byId('player-title').textContent = work.title;
  byId('player-tag').textContent = work.method || work.theme;
  byId('description').textContent = work.description;
  byId('original').href = work.url;
  const screen = byId('screen');
  if (archiveVideos.has(id)) {
    const video = element('video', '', 'archive-film');
    video.src = 'assets/films/' + id + '.mp4';
    video.poster = 'assets/posters/' + id + '.webp';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    screen.replaceChildren(video, element('span', 'Версия из авторского архива', 'source-note'));
    player.showModal();
    return;
  }
  if (id === 'De-Il6LNlig') {
    const poster = element('img', '', 'restricted-poster');
    poster.src = 'assets/posters/' + id + '.webp';
    poster.alt = '';
    screen.replaceChildren(poster, element('p', 'Instagram просит войти в аккаунт для просмотра этой публикации.', 'source-note'));
    player.showModal();
    return;
  }
  const frame = element('iframe', '', youtube ? 'yt' : 'ig');
  frame.title = work.title;
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.src = youtube ? 'https://www.youtube.com/embed/' + id + '?autoplay=1'
    : 'https://www.instagram.com/reel/' + id + '/embed/';
  byId('screen').replaceChildren(frame);
  player.showModal();
}

function buildCard(work, i) {
  const card = element('button', '', 'card');
  card.type = 'button';
  card.setAttribute('aria-label', 'Смотреть ' + work.title);
  const image = element('img');
  image.alt = '';
  image.loading = i < 6 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.src = 'assets/posters/' + idOf(work) + '.webp';
  image.addEventListener('error', () => image.remove(), { once: true });
  const play = element('span', '▶', 'play');
  play.setAttribute('aria-hidden', 'true');
  card.append(image, element('span', numbers.get(work), 'card-no'), play,
    element('span', work.title, 'card-title'));
  card.addEventListener('click', () => showVideo(work));
  return card;
}

function setActive(i) {
  const prior = carousel.children[active];
  prior?.removeAttribute('aria-current');
  active = i;
  const work = selection[i];
  carousel.children[i].setAttribute('aria-current', 'true');
  byId('active-title').textContent = work.title;
  byId('active-tag').textContent = work.method || work.theme;
  byId('counter').textContent = format(i + 1) + ' / ' + format(selection.length);
  byId('prev').disabled = i === 0;
  byId('next').disabled = i === selection.length - 1;
  byId('scrub').value = i + 1;
}

function goTo(i, smooth = true) {
  const bounded = Math.max(0, Math.min(i, selection.length - 1));
  carousel.scrollTo({
    left: carousel.children[bounded].offsetLeft - carousel.children[0].offsetLeft,
    behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'
  });
  setActive(bounded);
}

function chooseTheme(theme) {
  selection = theme === 'Все' ? ordered : ordered.filter(work => work.theme === theme);
  for (const button of byId('filters').children) {
    button.setAttribute('aria-pressed', String(button.textContent === theme));
  }
  carousel.replaceChildren(...selection.map(buildCard));
  byId('scrub').max = selection.length;
  goTo(0, false);
}

for (const theme of themes) {
  const button = element('button', theme);
  button.type = 'button';
  button.addEventListener('click', () => chooseTheme(theme));
  byId('filters').append(button);
}
carousel.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const step = carousel.children[1]?.offsetLeft - carousel.children[0].offsetLeft;
    if (step > 0) {
      const i = Math.min(selection.length - 1, Math.max(0, Math.round(carousel.scrollLeft / step)));
      if (i !== active) setActive(i);
    }
  });
}, { passive: true });
carousel.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    goTo(active + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
byId('prev').addEventListener('click', () => goTo(active - 1));
byId('next').addEventListener('click', () => goTo(active + 1));
byId('scrub').addEventListener('input', event => goTo(Number(event.target.value) - 1, false));

function renderIndex() {
  const query = byId('search').value.trim().toLocaleLowerCase('ru');
  const matches = ordered.filter(work => work.title.toLocaleLowerCase('ru').includes(query));
  byId('index-list').replaceChildren(...matches.map(work => {
    const row = element('button', '', 'index-row');
    row.type = 'button';
    row.append(element('span', numbers.get(work)), element('span', work.title), element('span', '▶'));
    row.addEventListener('click', () => {
      indexDialog.close();
      showVideo(work);
    });
    return row;
  }));
  if (!matches.length) byId('index-list').textContent = 'Ничего не найдено';
}
byId('index-toggle').addEventListener('click', () => {
  renderIndex();
  indexDialog.showModal();
  byId('search').focus();
});
byId('search').addEventListener('input', renderIndex);
for (const dialog of [player, indexDialog]) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right ||
          event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    }
  });
}
player.addEventListener('close', () => byId('screen').replaceChildren());
chooseTheme('Все');
