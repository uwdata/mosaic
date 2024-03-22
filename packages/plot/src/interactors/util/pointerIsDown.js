export let pointerIsDown = false;

if (typeof document !== 'undefined') {
  document.body.addEventListener('pointerdown', () => pointerIsDown = true);
  document.body.addEventListener('pointerup', () => pointerIsDown = false);
}
