let popSound;

function loadSound() {
    if (popSound) return;
    popSound = new Audio('Pop.wav');
    popSound.preload = 'auto';
    popSound.load();
}

document.addEventListener('click', loadSound, { once: true });
document.addEventListener('touchstart', loadSound, { once: true });

export function PlayPopSound() {
    if (!popSound) {
        loadSound();
    }
    const pop = popSound.cloneNode();
    pop.volume = 0.5;
    pop.play();
}