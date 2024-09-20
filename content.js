(() => {
    const stopVideoPlayback = () => {
        // Stop any playing video
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
        }

        // Create overlay notification
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.color = '#fff';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '24px';
        overlay.style.zIndex = 9999;
        overlay.innerText = 'Your time limit is over. Please take a break!';

        document.body.appendChild(overlay);

        // Disable scrolling
        document.body.style.overflow = 'hidden';
    };

    // Listen for messages from background.js
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "stopVideo") {
            stopVideoPlayback();
        }
    });
})();
