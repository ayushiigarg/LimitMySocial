chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "block") {
    blockSite();
  } else if (request.action === "suggestWatchLater") {
    suggestWatchLater();
  }
});

function blockSite() {
  const overlay = document.createElement('div');
  overlay.id = 'time-limiter-overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h1>Time's up!</h1>
      <p>You've reached your time limit for distracting websites.</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function suggestWatchLater() {
  const notification = document.createElement('div');
  notification.id = 'watch-later-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <p>This video has been added to your Watch Later list. You can watch it when you have more time.</p>
      <button id="close-notification">Close</button>
    </div>
  `;
  document.body.appendChild(notification);

  document.getElementById('close-notification').addEventListener('click', () => {
    document.body.removeChild(notification);
  });

  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 5000);
}