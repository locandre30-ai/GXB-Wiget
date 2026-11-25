const workspace = document.querySelector('#workspace');
const navigation = document.querySelector('#navigation');
const routes = new Set(['entrance', 'home', 'academy', 'practice', 'performance', 'settings']);

function route() {
  const hash = location.hash.slice(1);
  return routes.has(hash) ? hash : 'entrance';
}

function render() {
  const page = route();
  navigation.hidden = page === 'entrance';
  for (const link of navigation.querySelectorAll('a')) {
    if (link.hash === '#' + page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const heading = document.createElement('h1');
  heading.textContent = page === 'entrance' ? 'Enter the Arena' :
    navigation.querySelector('[href="#' + page + '"]').textContent;
  workspace.replaceChildren(heading);
}

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  workspace.focus();
});
window.addEventListener('hashchange', render);
render();
