export let pointerdown = false;

document.body.addEventListener('pointerdown', () => {
  pointerdown = true;
});

document.body.addEventListener('pointerup', () => {
    pointerdown = false;
});
