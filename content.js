// Check if the current page is YouTube
if (window.location.hostname === 'www.youtube.com') {
  // Listen for video player changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        const videoPlayer = document.querySelector('video');
        if (videoPlayer && videoPlayer.duration > 600) { // 10 minutes
          const videoInfo = extractVideoInfo();
          if (videoInfo) {
            chrome.runtime.sendMessage({ action: 'analyzeVideo', videoInfo: videoInfo });
          }
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to extract video information
function extractVideoInfo() {
  const title = document.querySelector('h1.title.style-scope.ytd-video-primary-info-renderer')?.textContent.trim();
  const description = document.querySelector('yt-formatted-string.content.style-scope.ytd-video-secondary-info-renderer')?.textContent.trim();
  const tags = Array.from(document.querySelectorAll('yt-formatted-string.super-title.style-scope.ytd-video-primary-info-renderer a'))
    .map(tag => tag.textContent.trim());

  if (title && description) {
    return { title, description, tags };
  }
  return null;
}

// Listener for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showWatchLaterPrompt') {
    showWatchLaterPrompt();
  }
});

// Function to display the watch later prompt
function showWatchLaterPrompt() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  const promptBox = document.createElement('div');
  promptBox.style.cssText = `
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    text-align: center;
  `;

  promptBox.innerHTML = `
    <h2>Distracting Content Detected</h2>
    <p>This video has been identified as potentially distracting content.</p>
    <p>Would you like to add it to your Watch Later list?</p>
    <button id="addToWatchLater">Add to Watch Later</button>
    <button id="closePrompt">Close</button>
  `;

  overlay.appendChild(promptBox);
  document.body.appendChild(overlay);

  // Event listener for adding to Watch Later
  document.getElementById('addToWatchLater').addEventListener('click', () => {
    const watchLaterButton = document.querySelector('yt-button-shape button[aria-label="Save to Watch later"]');
    if (watchLaterButton) {
      watchLaterButton.click();
    }
    document.body.removeChild(overlay);
  });

  // Event listener for closing the prompt
  document.getElementById('closePrompt').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });
}
