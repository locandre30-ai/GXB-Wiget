import { renderPortfolioLab } from './portfolio-lab.mjs';
import { savePortfolioWeek } from './portfolio.mjs';
import { academyDirectory, renderStudySection, STUDY_SECTIONS } from './academy-library.mjs';
import { recordActivity } from './activity.mjs';
import { recordPaperDecision } from './learning.mjs';
import { setupNavigation } from './navigation.mjs';
import { marketBrief, watchlist } from './market-watch.mjs';
import { clearStudio, renderStudio } from './studio.mjs';
import { exportBook, importBook, newProfile, openStore, PALETTES } from './store.mjs';
import { LocalIdentity } from './identity.mjs';

const workspace = document.querySelector('#workspace');
const navigation = document.querySelector('#navigation');
const storageStatus = document.querySelector('#storage');
const routes = new Set(['entrance', 'home', 'academy', 'practice', 'studio', 'portfolio', 'performance', 'settings']);

let guest = false;
let guestBook;
let choice;
let experience = 'beginner';
let creating = false;
let message = '';

function status(problem = store.problem) {
  storageStatus.classList.toggle('error', Boolean(problem));
  storageStatus.textContent = problem || (guest ? 'Guest session · Progress is held in memory while this Arena tab stays open.' :
    'Local storage ready · Profiles and training are saved in this browser.');
}

const store = await openStore({
  storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
  locks: navigator.locks,
  notify: problem => {
    storageStatus.classList.add('error');
    storageStatus.textContent = problem;
  }
});
const identity = new LocalIdentity(store);
choice = store.book.active;
experience = store.book.profiles[choice]?.experience ?? experience;

function node(tag, content, className) {
  const element = document.createElement(tag);
  if (content !== undefined) element.textContent = content;
  if (className) element.className = className;
  return element;
}

function action(label, callback, className) {
  const button = node('button', label, className);
  button.type = 'button';
  button.addEventListener('click', callback);
  return button;
}

function link(label, destination, className = 'button') {
  const anchor = node('a', label, className);
  anchor.href = destination;
  return anchor;
}

function select(label, options, value) {
  const field = node('label', label, 'field');
  const input = node('select');
  for (const [id, text] of options) {
    const option = node('option', text);
    option.value = id;
    input.append(option);
  }
  input.value = value;
  field.append(input);
  return [field, input];
}

function route() {
  const requested = location.hash.slice(1).split('/')[0];
  if (!requested) return store.book.profiles[store.book.active]?.onboarded ? 'home' : 'entrance';
  if (!routes.has(requested) || (!guest && !store.book.active && requested !== 'settings')) return 'entrance';
  return requested;
}

function go(page) {
  if (location.hash === '#' + page) render(true);
  else location.hash = page;
}

function experiencePicker() {
  const group = node('fieldset', undefined, 'paths');
  group.append(node('legend', 'Training path'));
  for (const [id, title, detail] of [
    ['beginner', 'Beginner · Guided Learning', 'Structured lessons and chart walkthroughs.'],
    ['experienced', 'Experienced · Independent Practice', 'Direct access to drills and review.']
  ]) {
    const card = node('label', undefined, 'path');
    const radio = node('input');
    radio.type = 'radio';
    radio.name = 'experience';
    radio.value = id;
    radio.checked = experience === id;
    radio.onchange = () => { experience = id; };
    card.append(radio, node('strong', title), node('small', detail));
    group.append(card);
  }
  return group;
}

function renderEntrance() {
  const panel = node('section', undefined, 'entrance panel');
  panel.append(node('h1', 'Enter the Arena'), node('p', 'Your personal trading workstation.'));
  const form = node('form', undefined, 'stack');
  const profiles = identity.list();
  let input;
  if (!creating && profiles.length) {
    const [field, picker] = select('Existing local trader profile',
      profiles.map(profile => [profile.id, profile.icon + ' ' + profile.name]), choice);
    if (!picker.value) picker.value = profiles[0].id;
    choice = picker.value;
    picker.onchange = () => {
      choice = picker.value;
      experience = profiles.find(profile => profile.id === choice).experience;
      for (const radio of form.elements.experience) radio.checked = radio.value === experience;
    };
    form.append(field);
    if (profiles.find(profile => profile.id === choice)?.origin === 'legacy-device') {
      form.append(node('small', 'Imported device history. Its original owner was not recorded.'));
    }
  } else {
    creating = true;
    const field = node('label', 'Local profile name', 'field');
    input = node('input');
    input.name = 'nickname';
    input.autocomplete = 'nickname';
    input.maxLength = 24;
    input.required = true;
    input.placeholder = 'Your trader name';
    field.append(input);
    form.append(field);
  }
  form.append(experiencePicker());
  const submit = node('button', creating ? 'Create profile and enter' : 'Continue to Command Center', 'primary');
  submit.type = 'submit';
  submit.disabled = Boolean(store.problem);
  form.append(submit);
  form.onsubmit = async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const previousOwner = store.book.active;
      const saved = creating ? await identity.create(input.value, experience) : await identity.select(choice, experience);
      if (saved) {
        if (guest || previousOwner !== store.book.active) clearStudio();
        guest = false;
        choice = store.book.active;
        creating = false;
        go('home');
      }
    } catch (error) {
      message = error.message;
      render(true);
    } finally {
      submit.disabled = Boolean(store.problem);
    }
  };
  const options = node('div', undefined, 'actions');
  if (profiles.length) options.append(action(creating ? 'Use an existing profile' : 'Create local profile', () => {
    creating = !creating;
    render();
    workspace.querySelector('input[name="nickname"], select')?.focus();
  }, 'quiet'));
  options.append(action('Guest practice', () => {
    if (guest && guestBook) { go('practice'); return; }
    clearStudio();
    guest = true;
    guestBook = { active: 'guest', profiles: { guest: newProfile('Guest', experience) } };
    go('practice');
  }, 'quiet'), action('Walkthrough', () => {
    const guide = panel.querySelector('details');
    guide.open = !guide.open;
    if (guide.open) guide.querySelector('summary').focus();
  }, 'quiet'));
  const guide = node('details');
  guide.append(node('summary', 'How local access works'),
    node('p', 'Choose a profile to keep progress in this browser. The Academy and Free Practice are open on both paths. Export a backup from Settings to move or restore your data.'));
  options.append(link('Restore a backup', '#settings', 'button quiet'));
  panel.append(form, options, guide);
  workspace.append(panel);
}

function download(filename = 'gxb-arena-backup.json') {
  const url = URL.createObjectURL(new Blob([exportBook(store.book)], { type: 'application/json' }));
  const anchor = link('Download backup', url);
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderSettings() {
  const id = store.book.active;
  const profile = store.book.profiles[id];
  if (!guest && profile) {
    const prefs = node('form', undefined, 'panel stack');
    prefs.append(node('h2', 'Training preferences'));
    experience = profile.experience;
    const [modeLabel, mode] = select('Drill mode', [['guided', 'Guided'], ['pro', 'Pro']], profile.state.mode);
    const [themeLabel, theme] = select('Candle palette', PALETTES.map(name => [name, name]), profile.state.candleTheme);
    const assistLabel = node('label', ' Show chart assists in Pro');
    const assist = node('input');
    assist.type = 'checkbox';
    assist.checked = profile.state.assist;
    assistLabel.prepend(assist);
    const picker = experiencePicker();
    picker.onchange = event => { mode.value = event.target.value === 'experienced' ? 'pro' : 'guided'; };
    prefs.append(picker, modeLabel, themeLabel, assistLabel);
    prefs.append(action('Save preferences', async event => {
      event.currentTarget.disabled = true;
      const book = store.book;
      const selected = book.profiles[id];
      Object.assign(selected, { experience });
      Object.assign(selected.state, { mode: mode.value, candleTheme: theme.value, assist: assist.checked });
      if (await store.save(book)) {
        message = 'Preferences saved.';
        render(true);
      }
    }, 'primary'));
    prefs.onsubmit = event => event.preventDefault();
    workspace.append(prefs);
  }
  const backup = node('section', undefined, 'panel stack');
  backup.append(node('h2', 'Backup and restore'), node('p', 'Export all saved profiles, preferences and training. Backups contain local profile names.'));
  if (!guest) backup.append(action('Export backup', () => download()));
  const form = node('form', undefined, 'stack');
  const field = node('label', 'Arena JSON backup', 'field');
  const file = node('input');
  file.type = 'file';
  file.accept = '.json,application/json';
  file.required = true;
  field.append(file);
  const replace = node('input');
  replace.type = 'checkbox';
  const confirmation = node('label', ' Restore matching profiles. A copy of current data downloads first.');
  confirmation.prepend(replace);
  const submit = node('button', 'Import backup');
  submit.disabled = Boolean(store.problem);
  form.append(field, confirmation, submit);
  form.onsubmit = async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      const selected = file.files[0];
      if (selected.size > 20 * 1024 * 1024) throw new Error('Choose a backup smaller than 20 MB.');
      const serialized = await selected.text();
      const prior = store.book;
      const next = importBook(prior, serialized, replace.checked);
      const unchanged = JSON.stringify(prior) === JSON.stringify(next);
      if (replace.checked && !unchanged) download('gxb-arena-before-restore.json');
      if (await store.save(next)) {
        choice = store.book.active;
        message = unchanged ? 'This backup is already present. No duplicate records were added.' : 'Backup imported.';
        render(true);
      }
    } catch (error) {
      message = error.message;
      render(true);
    } finally {
      submit.disabled = Boolean(store.problem);
    }
  };
  backup.append(form);
  workspace.append(backup);
}

let frame;
window.gxbTraining = {
  connect(element, view) {
    if (element !== frame || !frame.isConnected || frame.dataset.view !== view) return null;
    const guestAtConnect = guest;
    const snapshot = guestAtConnect ? structuredClone(guestBook) : store.book;
    const id = snapshot.active;
    return {
      view,
      market: element.dataset.market,
      lesson: element.dataset.lesson,
      book: { ...snapshot, profiles: { [id]: snapshot.profiles[id] } },
      save(updated) {
        if (guestAtConnect) {
          guestBook.profiles[id] = structuredClone(updated.profiles[id]);
          return Promise.resolve(true);
        }
        const next = store.book;
        next.profiles[id] = updated.profiles[id];
        return store.save(next);
      },
      exit: page => go(page),
      resize(height) {
        if (frame === element && Number.isFinite(height)) element.style.height = Math.ceil(height) + 'px';
      },
      get problem() { return guestAtConnect ? '' : store.problem; }
    };
  }
};

function renderTraining(view, market, lesson) {
  frame = node('iframe', undefined, 'training');
  frame.dataset.view = view;
  if (market) frame.dataset.market = market;
  if (/^[0-6]$/.test(lesson ?? "")) frame.dataset.lesson = lesson;
  frame.title = view === 'academy' ? 'Academy lesson workspace' : 'Free Practice training';
  frame.src = './practice.html?view=' + view;
  workspace.append(frame);
}

const lessons = ['Meet the market', 'Read the trend', 'Understand pullbacks', 'Define risk',
  'Practice entries', 'Manage exits', 'Review a session'];
const marketNames = { gold: 'Gold', bitcoin: 'Bitcoin', stocks: 'Stocks and ETFs' };

function activeProfile() {
  const book = guest ? guestBook : store.book;
  return book.profiles[book.active];
}

async function updateProfile(update) {
  const isGuest = guest;
  const active = isGuest ? guestBook.active : store.book.active;
  if (!isGuest) await store.flush();
  const book = isGuest ? guestBook : store.book;
  if (guest !== isGuest || book.active !== active || !book.profiles[active]) return false;
  update(book.profiles[active]);
  return isGuest || await store.save(book);
}

const syncNavigation = setupNavigation(navigation, () => activeProfile()?.navOrder, async order => {
  if (!await updateProfile(profile => { profile.navOrder = order; })) syncNavigation();
});

function progressFor(state, market) {
  const done = state.journey.skills[market] ?? [];
  const first = Boolean(state.journey.completed[market]);
  return { count: done.length + Number(first), next: !first ? 0 : lessons.findIndex((_, index) => index > 0 && !done.includes(index)) };
}

function chartAccuracy(state) {
  return state.rounds ? Math.round(100 * state.correct / state.rounds) + '%' : '—';
}

function metric(label, value, detail) {
  const card = node('article', undefined, 'metric panel');
  card.append(node('span', label), node('strong', value), node('small', detail));
  return card;
}

function marketButton(title, description, current, callback) {
  const button = action('', callback, 'market');
  button.setAttribute('aria-pressed', String(current));
  button.append(node('strong', title), node('small', description));
  return button;
}

function recent(state, full = false) {
  const panel = node('section', undefined, 'panel activity');
  panel.append(node('h2', full ? 'Completed session history' : 'Recent training activity'));
  const events = state.history.map(record => ({
    date: record.date,
    title: record.focus,
    detail: [record.grade, record.correct + '/' + record.rounds + ' correct',
      record.r === undefined ? '' : (record.r > 0 ? '+' : '') + record.r.toFixed(1) + 'R',
      record.scoringVersion ? 'Legacy scoring v' + record.scoringVersion : 'Legacy scoring version unrecorded']
      .filter(Boolean).join(' · ')
  }));
  if (!full) {
    for (const [key, completion] of Object.entries(state.journey.completed)) {
      if (completion.date) events.push({ date: completion.date, title: marketNames[key] + ' · Meet the market', detail: 'Academy lesson completed' });
    }
  }
  if (!full) {
    for (const [key, dates] of Object.entries(state.journey.skillDates)) {
      for (const [lesson, date] of Object.entries(dates)) {
        events.push({ date, title: marketNames[key] + ' · ' + lessons[lesson], detail: 'Academy lesson completed' });
      }
    }
  }
  events.sort((a, b) => b.date.localeCompare(a.date));
  if (!events.length) panel.append(node('p', full ? 'No individual session records are available. Recorded totals are shown separately.' : 'Completed sessions and dated lessons will appear here.'));
  for (const event of full ? events : events.slice(0, 5)) {
    const row = node('article', undefined, 'record');
    const date = node('time', new Date(event.date).toLocaleDateString());
    date.dateTime = event.date;
    row.append(node('strong', event.title), date, node('small', event.detail));
    panel.append(row);
  }
  return panel;
}

function tickerPreview(symbols) {
  return symbols.slice(0, 4).map(symbol => symbol.split(':')[1]).join('  ·  ') || 'Add watchlist symbols';
}

function renderHome() {
  const profile = activeProfile();
  const state = profile.state;
  const track = state.journey.market ?? 'gold';
  const progress = progressFor(state, track);
  const heading = node('section', undefined, 'welcome');
  heading.append(node('h2', 'Welcome' + (guest ? ', Guest.' : ' back, ' + profile.name + '.')),
    node('p', (profile.experience === 'experienced' ? 'Independent Practice' : 'Guided Learning') +
      ' · Focus: ' + (state.draft ? state.draft.focus : marketNames[profile.market])));
  if (profile.origin === 'legacy-device') heading.append(node('small', 'Imported device history · Original trader was not recorded.'));
  const metrics = node('section', undefined, 'metrics');
  metrics.setAttribute('aria-label', 'Training metrics');
  metrics.append(metric('Academy progress', progress.count + ' / 7', marketNames[track] + ' track'),
    metric('Recorded sessions', String(state.sessions), state.history.length + ' with saved details'),
    metric('Drill accuracy', chartAccuracy(state), state.rounds + ' recorded decisions'));
  const markets = node('section', undefined, 'panel');
  const marketGrid = node('div', undefined, 'two');
  markets.append(node('h2', 'Select your market'), marketGrid);
  for (const [id, detail] of [['gold', 'XAU/USD · Gold Academy available'], ['stocks', 'Equities & ETFs · Local replay in Market Studio']]) {
    const market = marketButton(marketNames[id], detail, profile.market === id, async () => {
      if (await updateProfile(selected => { selected.market = id; })) {
        render();
        workspace.querySelector('.market[aria-pressed="true"]')?.focus();
      }
    });
    const arrow = node('span', '↗', 'market-arrow');
    arrow.setAttribute('aria-hidden', 'true');
    const art = node('span', undefined, 'market-art market-art-' + id);
    art.setAttribute('aria-hidden', 'true');
    market.prepend(art, arrow);
    const tickers = node('span', tickerPreview(profile.watch[id]), 'market-tickers');
    tickers.dataset.market = id;
    market.append(tickers);
    marketGrid.append(market);
  }
  const actions = node('section', undefined, 'panel stack next-exercises');
  const academyLink = link(progress.next < 0 ? 'Review the ' + marketNames[track] + ' Academy' :
    'Academy · ' + lessons[progress.next], '#academy/' + track);
  const practiceLink = link(state.draft ? 'Resume practice draft' : 'Open Free Practice', '#practice');
  const nextTitle = node('h2', undefined, 'icon-heading');
  const nextIcon = node('span', undefined, 'arena-icon icon-next');
  nextIcon.setAttribute('aria-hidden', 'true');
  nextTitle.append(nextIcon, 'Next exercises');
  actions.append(nextTitle);
  const next = profile.experience === 'experienced' || state.draft ? [practiceLink, academyLink] : [academyLink, practiceLink];
  next[0].classList.add('primary');
  actions.append(...next);
  if (state.draft) actions.append(node('small', state.draft.session.results.length + ' of 10 decisions saved · ' + state.draft.focus));
  actions.append(link('Open Market Studio', '#studio'), link('Review recorded performance', '#performance'), link('Open Portfolio Lab', '#portfolio'));
  const columns = node('div', undefined, 'two workspace-columns');
  columns.append(actions, recent(state));
  const training = node('div', undefined, 'dashboard-main');
  training.append(heading, metrics, markets, columns);
  const rail = node('aside', undefined, 'dashboard-rail');
  const title = marketNames[profile.market];
  rail.append(watchlist(profile, title, async (market, symbols) => {
    if (!await updateProfile(selected => { selected.watch[market] = symbols; })) return false;
    const tickers = marketGrid.querySelector('[data-market="' + market + '"]');
    tickers.textContent = tickerPreview(symbols);
    return true;
  }),
    marketBrief(profile, title, () => activeProfile().watch[profile.market]));
  const dashboard = node('div', undefined, 'dashboard');
  dashboard.append(training, rail);
  workspace.append(dashboard);
}

function renderLearningActivity() {
  const panel = node('section', undefined, 'panel stack');
  const history = node('details');
  const records = node('div', undefined, 'activity');
  history.append(node('summary', 'Learning activity'), records);
  const sources = node('details');
  sources.append(node('summary', 'Save market research'));
  const feedback = node('p');
  feedback.setAttribute('role', 'status');
  const research = node('form', undefined, 'stack');
  research.append(node('small', 'Save a public source you reviewed. Arena records when you saved it.'));
  const [marketLabel, market] = select('Research market', [['stocks', 'Stocks and ETFs'], ['gold', 'Gold'], ['bitcoin', 'Bitcoin']],
    activeProfile().market);
  market.setAttribute('aria-label', 'Research market');
  const title = node('input');
  title.required = true;
  title.maxLength = 100;
  const titleLabel = node('label', 'Source title', 'field');
  titleLabel.append(title);
  const url = node('input');
  url.type = 'url';
  url.maxLength = 1000;
  url.required = true;
  const urlLabel = node('label', 'Public HTTPS link', 'field');
  urlLabel.append(url);
  const saveSource = node('button', 'Save research source');
  saveSource.type = 'submit';
  research.append(marketLabel, titleLabel, urlLabel, saveSource);
  sources.append(research, feedback);
  panel.append(history, sources);

  function paint() {
    const activity = activeProfile().state.learning.activity;
    records.replaceChildren(node('h3', 'Recent profile activity'));
    if (!activity.length) records.append(node('p', 'Your first saved learning decision or research source will appear here.'));
    for (const item of activity.slice(-8).reverse()) {
      const row = node('article', undefined, 'record');
      const time = node('time', new Date(item.at).toLocaleString());
      time.dateTime = item.at;
      let summary;
      if (item.type === 'research') {
        summary = link(item.title, item.url, 'research-link');
        summary.target = '_blank';
        summary.rel = 'noopener noreferrer';
        row.append(summary, time, node('small', marketNames[item.market] + ' research'));
      } else {
        const label = item.type === 'academy' ? marketNames[item.market] + ' · ' + lessons[item.chapter] + ' · ' + (item.correct ? 'Correct answer' : 'Retry needed') :
          item.type === 'practice' ? item.drill + ' · ' + (item.correct ? 'Correct practice decision' : 'Missed practice decision') :
          item.type === 'studio' ? marketNames[item.market] + ' · Paper ' + item.action :
          item.type === 'pressure' ? 'Decision reflection · ' + item.feeling : 'Check-in · ' + item.feeling;
        row.append(node('strong', label), time);
      }
      records.append(row);
    }
  }

  async function save(event, control, status) {
    control.disabled = true;
    let recorded = false;
    try {
      const ok = await updateProfile(profile => { recorded = recordActivity(profile.state.learning, event); });
      if (!ok) return;
      feedback.textContent = recorded ? status : 'Enter a title and a public HTTPS link.';
      if (recorded) paint();
    } finally {
      control.disabled = false;
    }
  }

  research.onsubmit = async event => {
    event.preventDefault();
    await save({ type: 'research', market: market.value, title: title.value, url: url.value }, saveSource, 'Research source saved.');
  };
  workspace.append(panel);
  paint();
}

function renderAcademy() {
  const state = activeProfile().state;
  const [, page, target] = location.hash.split('/');
  if (Object.hasOwn(STUDY_SECTIONS, page)) {
    workspace.append(renderStudySection(page, target, () => activeProfile().study,
      update => updateProfile(profile => update(profile.study))));
    return;
  }
  const tracks = [
    ['gold', 'Gold', 'XAU/USD · Precious Metals'],
    ['bitcoin', 'Cryptocurrency', 'Bitcoin · Digital Assets'],
    ['stocks', 'Stocks & ETFs', 'Equities and exchange-traded funds']
  ];
  if (page === 'gold' || page === 'bitcoin') {
    const nav = node('div', undefined, 'actions academy-track-nav');
    nav.append(link('← Academy', '#academy'));
    for (const [id, title] of tracks.slice(0, 2)) {
      const tab = link(title, '#academy/' + id);
      if (id === page) tab.setAttribute('aria-current', 'page');
      nav.append(tab);
    }
    workspace.append(nav);
    renderTraining('academy', page, target);
    return;
  }

  const intro = node('section', undefined, 'panel academy-welcome');
  intro.append(node('h2', 'Knowledge before capital.'),
    node('p', 'Explore the markets. Develop your understanding. Move with intention.'));
  const journeys = node('section', undefined, 'academy-journeys');
  journeys.append(node('h2', 'Market Journeys'));
  const grid = node('div', undefined, 'academy-track-grid');
  for (const [id, title, detail] of tracks) {
    const available = id !== 'stocks';
    const card = available ? link('', '#academy/' + id, 'panel academy-track-card')
      : node('article', undefined, 'panel academy-track-card unavailable');
    const photo = node('span', undefined, 'academy-track-art market-art-' + id);
    photo.setAttribute('aria-hidden', 'true');
    card.append(photo, node('h3', title), node('p', detail));
    if (available) {
      const progress = progressFor(state, id);
      const started = progress.count > 0 || Object.keys(state.learning?.evidence[id] ?? {}).length > 0;
      card.append(node('small', progress.count + ' of 7 lessons complete'),
        node('span', progress.count === 7 ? 'Review Journey' : started ? 'Continue Journey' : 'Begin Journey', 'academy-track-action'));
    } else {
      card.append(node('small', 'Structured curriculum in development'));
    }
    grid.append(card);
  }
  journeys.append(grid);
  workspace.append(intro, journeys, academyDirectory(activeProfile().study));
}

function renderPractice() {
  const state = activeProfile().state;
  const panel = node('section', undefined, 'panel practice-note');
  panel.append(node('p', 'Five synthetic chart drills · 10 rounds · Guided or Pro · Legacy drill scoring'));
  if (state.draft) panel.append(node('small', 'Resuming saved draft · ' + state.draft.session.results.length + ' of 10 decisions recorded.'));
  else panel.append(node('small', 'Your session saves as you go. Open Market Studio for local historical replay.'));
  workspace.append(panel);
  renderTraining('practice');
}

function renderPerformance() {
  const state = activeProfile().state;
  const metrics = node('section', undefined, 'metrics');
  metrics.append(metric('Recorded sessions', String(state.sessions), state.history.length + ' with saved details'),
    metric('Drill accuracy', chartAccuracy(state), state.rounds + ' recorded decisions'),
    metric('Experience', state.xp + ' XP', state.dayStreak + '-day streak · Best combo ×' + state.bestCombo));
  const skills = node('section', undefined, 'panel activity');
  skills.append(node('h2', 'Accuracy by drill'));
  for (const [name, score] of Object.entries(state.skills)) {
    if (!score.rounds) continue;
    const row = node('article', undefined, 'record');
    row.append(node('strong', name), node('span', Math.round(100 * score.correct / score.rounds) + '%'),
      node('small', score.correct + ' / ' + score.rounds + ' correct · ' + score.rCount + ' scored trade decisions'));
    skills.append(row);
  }
  if (skills.children.length === 1) skills.append(node('p', 'No scored drills recorded yet.'));
  workspace.append(node('p', 'Accuracy, grades and R come from synthetic legacy drills.'), metrics, skills, recent(state, true));
}

function render(focus = false) {
  const page = route();
  navigation.hidden = page === 'entrance' || (!guest && !store.book.active);
  syncNavigation();
  for (const anchor of navigation.querySelectorAll('a')) {
    if (anchor.hash === '#' + page) anchor.setAttribute('aria-current', 'page');
    else anchor.removeAttribute('aria-current');
  }
  workspace.replaceChildren();
  if (page !== 'entrance') workspace.append(node('h1', navigation.querySelector('[href="#' + page + '"]').textContent));
  if (message) {
    const notice = node('p', message, 'notice');
    notice.setAttribute('role', 'status');
    workspace.append(notice);
    message = '';
  }
  if (page === 'entrance') renderEntrance();
  if (page === 'settings') {
    if (navigation.hidden) workspace.append(link('Back to entrance', '#entrance'));
    renderSettings();
    if (guest || store.book.active) renderLearningActivity();
  }
  if (page === 'home') renderHome();
  if (page === 'academy') renderAcademy();
  if (page === 'practice') renderPractice();
  if (page === 'studio') {
    const selected = location.hash.split('/')[1];
    const market = ['gold', 'stocks'].includes(selected) ? selected : activeProfile().market;
    const recordDecision = (profile, command, market) => {
      recordPaperDecision(profile.state, command);
      recordActivity(profile.state.learning, { type: 'studio', market, action: command.type === 'entry' ? command.side : command.type });
    };
    renderStudio(workspace, market, guest ? 'guest' : store.book.active,
      (command, market) => updateProfile(profile => recordDecision(profile, command, market)),
      {
        get: market => activeProfile().portfolio[market],
        save: (market, run, checkpoint, paper, command) => updateProfile(profile => {
          savePortfolioWeek(profile.portfolio[market], run, checkpoint, paper);
          if (command) recordDecision(profile, command, market);
        })
      });
  }
  if (page === 'portfolio') renderPortfolioLab(workspace, () => activeProfile().portfolio,
    update => updateProfile(profile => update(profile.portfolio)));
  if (page === 'performance') renderPerformance();
  status();
  if (focus) workspace.focus();
}

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  workspace.focus();
});
window.addEventListener('hashchange', async () => { await store.flush(); render(true); });
render();
