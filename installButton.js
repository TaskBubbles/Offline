let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Save the event, but don't prevent the default prompt from appearing
    deferredPrompt = e;

    // Show the install button to manually trigger the install
    const installButton = document.getElementById('installButton');
    installButton.style.display = 'block';

    installButton.addEventListener('click', () => {
        // Hide the install button
        installButton.style.display = 'none';

        // Show the install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null; // Clear the deferredPrompt after it has been used
            });
        }
    });
});

// Optional: Hide the install button if the app is already installed
window.addEventListener('appinstalled', () => {
    const installButton = document.getElementById('installButton');
    installButton.style.display = 'none';
});
