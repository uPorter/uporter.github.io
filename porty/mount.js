import { attachPorty } from './porty-head.js';

// This repository contains a compiled React site. Keep the addition readable
// and separate from its generated bundle until it can be moved to the source app.
function mount() {
  const intro = document.querySelector('.intro');
  const heading = intro?.querySelector('h1');
  if (!heading) return false;
  if (intro.querySelector('.porty-head')) return true;

  const button = document.createElement('button');
  button.className = 'porty-head';
  button.type = 'button';
  button.setAttribute('aria-label', 'Make Porty pull a sad face');
  button.title = 'Hi, I’m Porty. Click me.';
  const sprite = document.createElement('span');
  sprite.className = 'porty-head__sprite';
  sprite.setAttribute('aria-hidden', 'true');
  button.append(sprite);
  intro.dataset.porty = '';
  heading.before(button);
  attachPorty(button);
  return true;
}

if (!mount()) {
  const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
  observer.observe(document.getElementById('root'), { childList: true, subtree: true });
}
