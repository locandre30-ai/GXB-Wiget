import { ARCHIVES, KNOWLEDGE, REFLECTIONS } from './study-content.mjs?v=swings-1';
import { CATEGORIES, cleanVideo, DRILLS, LESSONS, LEVELS, touchStudy, VIDEO_MARKETS, youtubeId } from './study-store.mjs?v=save-1';

export const STUDY_SECTIONS = {
  lounge: ['Learning Lounge', 'Watch and organize educational videos.', '▶'],
  archives: ['Market Archives', 'Study five moments that reshaped markets.', '◷'],
  knowledge: ['Market Knowledge', 'Explore concepts you’ll encounter again and again.', '≡'],
  reflections: ['Reflections', '', '◇'],
  library: ['My Study Library', 'Return to your saved resources and private study notes.', '☆']
};

function el(tag, text, cls) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (cls) element.className = cls;
  return element;
}
function button(text, callback, cls) {
  const control = el('button', text, cls);
  control.type = 'button';
  control.onclick = callback;
  return control;
}
function link(text, href, cls) {
  const anchor = el('a', text, cls);
  anchor.href = href;
  if (href.startsWith('https://')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
  return anchor;
}
function field(label, input, name) {
  const wrapper = el('label', label, 'field');
  input.name = name;
  input.setAttribute('aria-label', label);
  wrapper.append(input);
  return wrapper;
}
function select(options) {
  const dropdown = el('select');
  for (const label of options) {
    const option = el('option', label || 'None');
    option.value = label;
    dropdown.append(option);
  }
  return dropdown;
}

export function academyDirectory() {
  const grid = el('section', undefined, 'academy-directory');
  grid.setAttribute('aria-label', 'Academy study areas');
  for (const [route, [title, description, glyph]] of Object.entries(STUDY_SECTIONS)) {
    if (route === 'reflections') continue;
    const card = link(undefined, '#academy/' + route, 'panel academy-directory-card');
    const icon = el('span', glyph, 'academy-directory-icon');
    icon.setAttribute('aria-hidden', 'true');
    card.append(icon, el('h2', title), el('p', description));
    grid.append(card);
  }
  return grid;
}

export function ambientReflection(custom) {
  const reflections = [...REFLECTIONS, ...custom];
  let index = Math.max(0, reflections.findIndex(item => item.text === 'I observe before I act.'));
  const quote = el('blockquote', reflections[index].text, 'academy-quote');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function tick() {
    if (!quote.isConnected) return;
    if (!motion.matches && !document.hidden) {
      index = (index + 1) % reflections.length;
      quote.textContent = reflections[index].text;
    }
    setTimeout(tick, 14000);
  }
  setTimeout(tick, 14000);
  return quote;
}

export function renderStudySection(section, target, getStudy, save) {
  const root = el('section', undefined, 'academy-study');
  const resources = el('div', undefined, 'study-resources');
  const status = el('p');
  status.setAttribute('role', 'status');
  root.append(link('← Academy', '#academy'), el('h2', STUDY_SECTIONS[section][0]), status, resources);

  async function apply(update, message) {
    const saved = await save(update);
    if (saved && message) status.textContent = message;
    return saved;
  }
  const entry = key => getStudy().entries[key] ?? {};
  const updateEntry = (study, key, changes) => {
    study.entries[key] = { ...study.entries[key], ...changes };
  };
  const recent = key => apply(study => touchStudy(study, key));
  const allReflections = () => [...REFLECTIONS, ...getStudy().customReflections];
  const videos = () => getStudy().videos.filter(video => !video.archived);

  function controls(key, { video = false } = {}) {
    const tools = el('div', undefined, 'study-controls');
    const actions = el('div', undefined, 'actions');
    const saveLabel = () => entry(key).saved ? 'Remove from study library' : 'Save to study library';
    const saved = button(saveLabel(), async () => {
      saved.disabled = true;
      try {
        const value = !entry(key).saved;
        if (await apply(study => updateEntry(study, key, { saved: value }), value ? 'Saved to My Study Library.' : 'Removed from My Study Library.')) {
          saved.textContent = saveLabel();
          saved.setAttribute('aria-pressed', String(value));
        }
      } finally { saved.disabled = false; }
    });
    saved.setAttribute('aria-pressed', String(Boolean(entry(key).saved)));
    actions.append(saved);
    if (video) {
      const label = () => entry(key).watched ? 'Mark unwatched' : 'Mark watched';
      const watched = button(label(), async () => {
        watched.disabled = true;
        try {
          if (await apply(study => updateEntry(study, key, { watched: !study.entries[key]?.watched }), 'Watch status updated.')) {
            watched.textContent = label();
            watched.setAttribute('aria-pressed', String(Boolean(entry(key).watched)));
          }
        } finally { watched.disabled = false; }
      });
      watched.setAttribute('aria-pressed', String(Boolean(entry(key).watched)));
      actions.append(watched);
    }
    const notes = el('details');
    notes.append(el('summary', entry(key).note ? 'Edit personal study note' : 'Add a personal study note'));
    const form = el('form', undefined, 'stack');
    const draft = el('textarea');
    draft.rows = 3;
    draft.maxLength = 2500;
    draft.value = entry(key).note ?? '';
    const submit = el('button', 'Save note');
    submit.type = 'submit';
    form.append(field('Personal study note', draft, 'note'), submit);
    form.onsubmit = async event => {
      event.preventDefault();
      submit.disabled = true;
      try {
        if (await apply(study => updateEntry(study, key, { note: draft.value.trim() }), 'Study note saved.')) {
          notes.querySelector('summary').textContent = draft.value.trim() ? 'Edit personal study note' : 'Add a personal study note';
        }
      } finally { submit.disabled = false; }
    };
    notes.append(form);
    tools.append(actions, notes);
    return tools;
  }

  function itemDetails(title, subtitle, key, content) {
    const details = el('details', undefined, 'panel study-item');
    const heading = el('summary');
    heading.append(el('span', title));
    if (subtitle) heading.append(el('small', subtitle));
    details.append(heading);
    let loaded = false;
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      if (!loaded) { details.append(content()); loaded = true; }
      recent(key);
    });
    return details;
  }

  function videoEditor(existing, done) {
    const form = el('form', undefined, 'panel stack study-editor');
    form.append(el('h3', existing ? 'Edit educational video' : 'Add educational video'));
    for (const [name, label, type, max, required] of [
      ['title', 'Video title', 'text', 120, true], ['educator', 'Educator or channel', 'text', 100, true],
      ['url', 'YouTube video URL', null, 2500, true], ['duration', 'Duration (optional)', 'text', 24, false],
      ['description', 'Description', null, 800, false]
    ]) {
      const input = el(type ? 'input' : 'textarea');
      if (type) input.type = type;
      input.maxLength = max;
      input.required = required;
      if (name === 'url') { input.rows = 2; input.autocapitalize = 'off'; input.spellcheck = false; input.placeholder = 'Paste a YouTube link or embed code'; }
      input.value = existing?.[name] ?? '';
      form.append(field(label, input, name));
    }
    const selectors = el('div', undefined, 'study-form-grid');
    for (const [name, label, choices] of [
      ['category', 'Category', CATEGORIES], ['market', 'Market', VIDEO_MARKETS],
      ['difficulty', 'Difficulty', LEVELS], ['lesson', 'Related lesson', ['', ...LESSONS]],
      ['practice', 'Related practice exercise', ['', ...DRILLS]]
    ]) {
      const input = select(choices);
      input.value = existing?.[name] ?? choices[0];
      selectors.append(field(label, input, name));
    }
    const submit = el('button', 'Save resource', 'primary');
    submit.type = 'submit';
    const error = el('p', undefined, 'error');
    error.setAttribute('role', 'status');
    const actions = el('div', undefined, 'actions');
    actions.append(submit, button('Cancel', done));
    form.append(selectors, actions, error);
    form.onsubmit = async event => {
      event.preventDefault();
      const input = Object.fromEntries(new FormData(form));
      const video = cleanVideo({ ...input, id: existing?.id ?? crypto.randomUUID() });
      if (!video) { error.textContent = 'Enter a title, an educator and a valid HTTPS YouTube video link or embed code.'; return; }
      const catalog = getStudy().videos;
      if (catalog.some(item => !item.archived && item.id !== video.id && item.url === video.url)) {
        error.textContent = 'That video is already in your Learning Lounge.'; return;
      }
      if (!existing && catalog.length >= 200) { error.textContent = 'This profile has reached its 200-resource storage limit.'; return; }
      submit.disabled = true;
      try {
        if (await apply(study => {
          if (existing) study.videos = study.videos.map(item => item.id === video.id ? video : item);
          else study.videos.push(video);
        }, 'Resource saved.')) done();
        else error.textContent = 'Resource wasn’t saved. Keep this form open and check the storage message before reloading.';
      } finally { submit.disabled = false; }
    };
    return form;
  }

  function lounge() {
    const intro = el('section', undefined, 'panel stack');
    intro.append(el('p', 'Build a library from YouTube videos you’ve reviewed. Add verified links for educators such as Trades by Sai.'));
    const editHost = el('div');
    const filter = select(['All categories', ...CATEGORIES]);
    const catalog = el('div', undefined, 'study-list');
    const original = el('section', undefined, 'panel');
    original.append(el('h3', 'GxB Original Sessions'),
      el('p', 'A home for future GxB lessons, market breakdowns, reflections, practice recordings, strategy explanations and live education. Published recordings can be filed here when a verified link is available.'));
    const add = button('Add educational video', () => editHost.replaceChildren(videoEditor(undefined, done)), 'primary');
    const done = () => { editHost.replaceChildren(); paint(); add.focus(); };
    intro.append(el('div', undefined, 'actions'));
    intro.lastElementChild.append(add, field('Filter by category', filter, 'filter'));
    resources.append(intro, editHost, catalog, original);

    function paint() {
      catalog.replaceChildren();
      const list = videos().filter(video => filter.value === 'All categories' || video.category === filter.value);
      if (!list.length) catalog.append(el('p', 'No videos in this view yet. Add a verified YouTube link to begin.', 'panel'));
      for (const video of list) {
        const key = 'video:' + video.id;
        const detail = itemDetails(video.title, video.educator + ' · ' + video.category, key, () => {
          const content = el('div', undefined, 'study-item-body');
          const meta = [video.market, video.difficulty, video.duration].filter(Boolean).join(' · ');
          content.append(el('p', meta));
          if (video.description) content.append(el('p', video.description));
          const player = el('div', undefined, 'study-player');
          const play = button('Play embedded video', () => {
            const frame = el('iframe');
            frame.title = video.title;
            frame.src = 'https://www.youtube-nocookie.com/embed/' + youtubeId(video.url);
            frame.allowFullscreen = true;
            frame.referrerPolicy = 'strict-origin-when-cross-origin';
            frame.allow = 'encrypted-media; picture-in-picture';
            player.replaceChildren(frame);
          });
          const thumb = button('Load thumbnail', () => {
            const image = el('img');
            image.src = video.thumbnail;
            image.alt = '';
            image.referrerPolicy = 'no-referrer';
            image.onerror = () => image.replaceWith(el('small', 'Thumbnail unavailable.'));
            thumb.replaceWith(image);
          });
          const toolbar = el('div', undefined, 'actions');
          const watch = link('Open on YouTube', video.url, 'button');
          const edit = button('Edit resource', () => {
            editHost.replaceChildren(videoEditor(video, done));
            editHost.querySelector('input')?.focus();
          });
          const remove = button('Remove resource', () => {
            const confirm = button('Confirm removal', async () => {
              if (await apply(study => {
                const item = study.videos.find(item => item.id === video.id);
                if (item) item.archived = true;
              }, 'Resource removed.')) { done(); }
            });
            remove.replaceWith(confirm);
            confirm.focus();
          });
          toolbar.append(play, watch, thumb, edit, remove);
          content.append(toolbar, player);
          if (video.lesson) {
            const market = video.market === 'Cryptocurrency' ? 'bitcoin' : 'gold';
            if (video.market === 'Stocks & ETFs') content.append(el('p', 'Related lesson · ' + video.lesson + ' · Stock curriculum in development'));
            else content.append(link('Related lesson · ' + video.lesson, '#academy/' + market + '/' + LESSONS.indexOf(video.lesson)));
          }
          if (video.practice) content.append(el('p', 'Related practice · ' + video.practice + ' '), link('Open Free Practice', '#practice'));
          content.append(controls(key, { video: true }));
          return content;
        });
        detail.id = video.id;
        catalog.append(detail);
        if (target === video.id) detail.open = true;
      }
    }
    filter.onchange = paint;
    paint();
  }

  function relatedVideos(categories) {
    const matches = videos().filter(video => categories.includes(video.category));
    const box = el('div', undefined, 'study-related');
    box.append(el('h4', 'Related videos'));
    if (!matches.length) box.append(el('p', 'Related videos will appear here when you add resources in these categories.'));
    for (const video of matches) box.append(link(video.title, '#academy/lounge/' + video.id));
    return box;
  }

  function referenceList(sources) {
    const list = el('ul');
    for (const [title, url] of sources) {
      const item = el('li');
      item.append(link(title, url));
      list.append(item);
    }
    return list;
  }

  function archives() {
    resources.append(el('p', 'Compare historical conditions, market reactions and what traders could know at the time. These cases cannot predict the next outcome.'));
    for (const item of ARCHIVES) {
      const key = 'archive:' + item.id;
      const details = itemDetails(item.title, item.period, key, () => {
        const content = el('div', undefined, 'study-item-body');
        content.append(el('p', item.summary));
        const list = el('dl', undefined, 'study-facts');
        for (const [label, value] of [['Economic context', item.context], ['Market behavior', item.behavior],
          ['Instruments to study', item.instruments], ['Key concepts', item.concepts], ['Study exercise', item.study]]) {
          list.append(el('dt', label), el('dd', value));
        }
        content.append(list, el('h4', 'Source references'), referenceList(item.sources), relatedVideos(item.categories),
          el('small', item.replay ? 'Replay · ' + item.replay : 'Market Studio replay association planned.'), controls(key));
        return content;
      });
      resources.append(details);
      if (target === item.id) details.open = true;
    }
  }

  function knowledge() {
    resources.append(el('p', 'Open a concept for a short explanation, why it matters, and material to study next.'));
    for (const item of KNOWLEDGE) {
      const key = 'knowledge:' + item.id;
      const details = itemDetails(item.title, undefined, key, () => {
        const content = el('div', undefined, 'study-item-body');
        content.append(el('p', item.explanation), el('h4', 'Why it matters'), el('p', item.significance));
        if (item.reference) content.append(link('Read the official reference', item.reference));
        const cases = ARCHIVES.filter(archive => archive.categories.some(category => item.categories.includes(category))).slice(0, 2);
        if (cases.length) {
          const related = el('div', undefined, 'study-related');
          related.append(el('h4', 'Related case studies'));
          for (const archive of cases) related.append(link(archive.title, '#academy/archives/' + archive.id));
          content.append(related);
        }
        content.append(relatedVideos(item.categories), controls(key));
        return content;
      });
      resources.append(details);
      if (target === item.id) details.open = true;
    }
  }

  function reflections() {
    const frame = el('section', undefined, 'panel stack reflection-card');
    const display = el('div', undefined, 'stack');
    const actions = el('div', undefined, 'actions');
    let index = Math.max(0, allReflections().findIndex(item => item.id === target));
    actions.append(button('Previous reflection', () => choose(-1)), button('Next reflection', () => choose(1)));
    frame.append(display, actions);
    resources.append(frame);
    const custom = el('details', undefined, 'panel');
    custom.append(el('summary', 'Add your own reflection'));
    const form = el('form', undefined, 'stack');
    const text = el('textarea');
    text.maxLength = 240;
    text.required = true;
    const submit = el('button', 'Add reflection');
    submit.type = 'submit';
    form.append(field('Reflection text', text, 'reflection'), submit);
    form.onsubmit = async event => {
      event.preventDefault();
      const value = text.value.trim();
      if (!value) return;
      if (getStudy().customReflections.length >= 100) { status.textContent = 'This profile has reached its reflection limit.'; return; }
      const id = crypto.randomUUID();
      submit.disabled = true;
      try {
        if (await apply(study => study.customReflections.push({ id, text: value, audio: null }), 'Reflection added.')) {
          text.value = '';
          index = allReflections().findIndex(item => item.id === id);
          paint();
        }
      } finally { submit.disabled = false; }
    };
    custom.append(form);
    resources.append(custom, el('p', 'A future audio space for original GxB and Lainage Sound Lab recordings.'));
    function choose(step) {
      index = (index + step + allReflections().length) % allReflections().length;
      paint();
    }
    function paint() {
      const all = allReflections();
      const item = all[index] ?? all[0];
      const key = 'reflection:' + item.id;
      display.replaceChildren(el('small', (item.source ?? 'Personal reflection') + ' · ' + (index + 1) + ' of ' + all.length),
        el('blockquote', item.text), controls(key));
      recent(key);
    }
    paint();
  }

  function library() {
    const study = getStudy();
    const lookup = new Map();
    for (const [type, route, items] of [
      ['video', 'lounge', videos()], ['archive', 'archives', ARCHIVES],
      ['knowledge', 'knowledge', KNOWLEDGE], ['reflection', 'reflections', allReflections()]
    ]) {
      for (const item of items) lookup.set(type + ':' + item.id, {
        title: item.title ?? item.text, href: '#academy/' + route + '/' + item.id, state: study.entries[type + ':' + item.id]
      });
    }
    const collections = [
      ['Saved videos', [...lookup.keys()].filter(key => key.startsWith('video:') && lookup.get(key).state?.saved)],
      ['Bookmarked case studies', [...lookup.keys()].filter(key => key.startsWith('archive:') && lookup.get(key).state?.saved)],
      ['Saved knowledge topics', [...lookup.keys()].filter(key => key.startsWith('knowledge:') && lookup.get(key).state?.saved)],
      ['Favorite reflections', [...lookup.keys()].filter(key => key.startsWith('reflection:') && lookup.get(key).state?.saved)],
      ['Personal study notes', [...lookup.keys()].filter(key => lookup.get(key).state?.note)],
      ['Recently viewed', study.recent.filter(key => lookup.has(key))]
    ];
    resources.classList.add('study-library-grid');
    for (const [title, keys] of collections) {
      const panel = el('section', undefined, 'panel');
      panel.append(el('h3', title));
      if (title === 'Favorite reflections') panel.append(link('Manage reflections', '#academy/reflections'), el('br'));
      if (!keys.length) panel.append(el('small', 'Nothing here yet.'));
      const list = el('ul');
      for (const key of keys) {
        const item = lookup.get(key);
        const row = el('li');
        row.append(link(item.title, item.href));
        if (title === 'Personal study notes') row.append(el('p', item.state.note));
        list.append(row);
      }
      if (keys.length) panel.append(list);
      resources.append(panel);
    }
  }

  ({ lounge, archives, knowledge, reflections, library })[section]();
  return root;
}
