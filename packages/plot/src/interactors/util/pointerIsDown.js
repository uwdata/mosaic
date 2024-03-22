export let pointerIsDown = false;

document.body.addEventListener('pointerdown', () => pointerIsDown = true);
document.body.addEventListener('pointerup', () => pointerIsDown = false);
