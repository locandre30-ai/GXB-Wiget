import { cleanOrder, NAV_ORDER } from './workspace.mjs';

export function setupNavigation(nav, getOrder, save) {
  const anchors = NAV_ORDER.map(id => nav.querySelector('[href="#' + id + '"]'));
  const rows = new Map();
  let order = NAV_ORDER;
  let editing = false;
  let drag;
  const list = document.createElement('div');
  list.className = 'nav-items';
  nav.prepend(list);
  const secondary = document.createElement('div');
  secondary.className = 'nav-secondary';
  secondary.id = 'arena-more-links';
  for (const anchor of nav.querySelectorAll(':scope > a')) {
    if (!anchors.includes(anchor)) secondary.append(anchor);
  }
  const menu = document.createElement('button');
  menu.type = 'button';
  menu.className = 'nav-menu';
  menu.textContent = 'Menu';
  menu.setAttribute('aria-controls', secondary.id);
  const setMenu = open => {
    menu.setAttribute('aria-expanded', String(open));
    secondary.classList.toggle('nav-secondary-open', open);
  };
  setMenu(false);
  menu.onclick = () => setMenu(menu.getAttribute('aria-expanded') !== 'true');
  secondary.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  nav.append(menu, secondary);
  const announcement = document.createElement('span');
  announcement.className = 'sr-only';
  announcement.setAttribute('role', 'status');
  nav.append(announcement);
  const customize = document.createElement('button');
  customize.type = 'button';
  customize.className = 'nav-customize';
  customize.textContent = 'Reorder navigation';
  customize.setAttribute('aria-expanded', 'false');
  customize.onclick = () => {
    editing = !editing;
    customize.setAttribute('aria-expanded', String(editing));
    list.classList.toggle('nav-editing', editing);
    nav.classList.toggle('nav-editing-mode', editing);
  };
  secondary.append(customize);

  function place() {
    for (const id of order) list.append(rows.get(id));
    for (const [index, id] of order.entries()) {
      const [up, down] = rows.get(id).querySelectorAll('.nav-step');
      up.disabled = index === 0;
      down.disabled = index === order.length - 1;
    }
  }
  function move(id, index) {
    const previous = order.indexOf(id);
    if (index === previous || index < 0 || index >= order.length) return;
    order.splice(previous, 1);
    order.splice(index, 0, id);
    place();
    announcement.textContent = rows.get(id).querySelector('a').textContent + ' moved to position ' + (index + 1) + '.';
  }
  function end(event) {
    if (!drag || drag.pointer !== event.pointerId) return;
    clearTimeout(drag.timer);
    drag.handle.classList.remove('dragging');
    drag = undefined;
    for (const row of rows.values()) row.classList.remove('nav-drop');
  }

  for (const anchor of anchors) {
    const id = anchor.hash.slice(1);
    const row = document.createElement('div');
    row.className = 'nav-row';
    const handle = document.createElement('span');
    handle.className = 'nav-grip';
    handle.textContent = '⠿';
    handle.title = 'Hold and drag ' + anchor.textContent;
    handle.setAttribute('aria-hidden', 'true');
    handle.oncontextmenu = event => event.preventDefault();
    handle.onpointerdown = event => {
      if (event.button !== 0 || drag) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      drag = { pointer: event.pointerId, id, handle, x: event.clientX, y: event.clientY, index: undefined };
      drag.timer = setTimeout(() => {
        drag.active = true;
        handle.classList.add('dragging');
        announcement.textContent = 'Drag to move ' + anchor.textContent + '.';
      }, 320);
    };
    handle.onpointermove = event => {
      if (drag?.pointer !== event.pointerId) return;
      if (!drag.active) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 12) end(event);
        return;
      }
      const over = document.elementFromPoint(event.clientX, event.clientY)?.closest('.nav-row');
      const index = order.findIndex(key => rows.get(key) === over);
      const valid = index >= 0 && index !== order.indexOf(id);
      // Reparent only on drop. Moving a captured node can release pointer capture.
      drag.index = valid ? index : undefined;
      for (const entry of rows.values()) entry.classList.toggle('nav-drop', valid && entry === over);
    };
    const drop = (event, commit) => {
      if (drag?.pointer !== event.pointerId) return;
      for (const entry of rows.values()) entry.classList.remove('nav-drop');
      const target = commit && drag.active ? drag.index : undefined;
      if (target !== undefined) {
        const previous = order.indexOf(id);
        end(event);
        move(id, target);
        if (order.indexOf(id) !== previous) save([...order]);
      } else end(event);
    };
    handle.onpointerup = event => drop(event, true);
    handle.onpointercancel = event => drop(event, false);
    handle.onlostpointercapture = event => drop(event, false);
    row.append(anchor, handle);
    for (const [delta, arrow, label] of [[-1, '↑', 'earlier'], [1, '↓', 'later']]) {
      const step = document.createElement('button');
      step.type = 'button';
      step.className = 'nav-step';
      step.textContent = arrow;
      step.setAttribute('aria-label', 'Move ' + anchor.textContent + ' ' + label);
      step.onclick = () => {
        move(id, order.indexOf(id) + delta);
        save([...order]);
        (step.disabled ? customize : step).focus();
      };
      row.append(step);
    }
    rows.set(id, row);
  }
  return () => {
    const next = cleanOrder(getOrder());
    if (!drag && (next.join() !== order.join() || !list.children.length)) {
      order = next;
      place();
    }
  };
}
