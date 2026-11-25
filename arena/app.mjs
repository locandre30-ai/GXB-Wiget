import { exportBook, importBook, newProfile, openStore, PALETTES } from './store.mjs';
import { LocalIdentity } from './identity.mjs';

const workspace = document.querySelector('#workspace');
const navigation = document.querySelector('#navigation');
const storageStatus = document.querySelector('#storage');
const routes = new Set(['entrance', 'home', 'academy', 'practice', 'performance', 'settings']);

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
  const requested = location.hash.slice(1);
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
      const saved = creating ? await identity.create(input.value, experience) : await identity.select(choice, experience);
      if (saved) {
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

function download() {
  const url = URL.createObjectURL(new Blob([exportBook(store.book)], { type: 'application/json' }));
  const anchor = link('Download backup', url);
  anchor.download = 'gxb-arena-backup.json';
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
  if (!guest) backup.append(action('Export backup', download));
  const form = node('form', undefined, 'stack');
  const field = node('label', 'Arena JSON backup', 'field');
  const file = node('input');
  file.type = 'file';
  file.accept = '.json,application/json';
  file.required = true;
  field.append(file);
  const replace = node('input');
  replace.type = 'checkbox';
  const confirmation = node('label', ' Restore matching profile snapshots from this backup. Export current data first.');
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

function renderTraining(view) {
  frame = node('iframe', undefined, 'training');
  frame.dataset.view = view;
  frame.title = 'Free Practice training';
  frame.src = './practice.html?view=' + view;
  workspace.append(frame);
}

function render(focus = false) {
  const page = route();
  navigation.hidden = page === 'entrance' || (!guest && !store.book.active);
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
  }
  if (page === 'practice') renderTraining('practice');
  status();
  if (focus) workspace.focus();
}

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  workspace.focus();
});
window.addEventListener('hashchange', async () => { await store.flush(); render(true); });
render();
