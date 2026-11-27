import { storageLock } from './storage-lock.mjs';
import { openStore } from './store.mjs?v=daily-10';
export { cleanState } from './store.mjs?v=daily-10';

function report(problem) {
  const status = document.querySelector('#trainingStatus');
  status.textContent = problem;
  status.hidden = !problem;
}

export async function connectTraining() {
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  if (window.parent !== window && ['academy', 'practice'].includes(view)) {
    const connection = window.parent.gxbTraining?.connect(window.frameElement, view);
    if (connection) return connection;
  }
  const store = await openStore({
    storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
    locks: storageLock(),
    notify: report
  });
  if (store.problem && !Object.keys(store.book.profiles).length) {
    throw new Error(store.problem + ' Guest practice is available from Arena.');
  }
  return { book: store.book, save: book => store.save(book), get problem() { return store.problem; } };
}
