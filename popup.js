document.addEventListener('DOMContentLoaded', () => {
  const setTimeLimitButton = document.getElementById('setTimeLimit');
  const addChannelButton = document.getElementById('addChannel');
  const addDistractingButton = document.getElementById('addDistracting');
  const blockedChannelsList = document.getElementById('blockedChannels');
  const distractingSitesList = document.getElementById('distractingSites');
  const timeSpentDisplay = document.getElementById('timeSpent');

  setTimeLimitButton.addEventListener('click', () => {
    const timeLimit = document.getElementById('timeLimit').value;
    chrome.runtime.sendMessage({action: "setTimeLimit", timeLimit: parseInt(timeLimit)});
  });

  addChannelButton.addEventListener('click', () => {
    const channelUrl = document.getElementById('channelUrl').value;
    if (channelUrl) {
      chrome.runtime.sendMessage({action: "addBlockedChannel", channel: channelUrl});
      updateBlockedChannelsList();
    }
  });

  addDistractingButton.addEventListener('click', () => {
    const site = document.getElementById('distractingSite').value;
    if (site) {
      chrome.runtime.sendMessage({action: "addDistractingSite", site: site});
      updateDistractingSitesList();
    }
  });

  function updateBlockedChannelsList() {
    chrome.runtime.sendMessage({action: "getBlockedChannels"}, (response) => {
      blockedChannelsList.innerHTML = '';
      response.blockedChannels.forEach(channel => {
        const li = document.createElement('li');
        li.textContent = channel;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          chrome.runtime.sendMessage({action: "removeBlockedChannel", channel: channel});
          updateBlockedChannelsList();
        });
        li.appendChild(removeButton);
        blockedChannelsList.appendChild(li);
      });
    });
  }

  function updateDistractingSitesList() {
    chrome.runtime.sendMessage({action: "getDistractingSites"}, (response) => {
      distractingSitesList.innerHTML = '';
      response.distractingSites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
          chrome.runtime.sendMessage({action: "removeDistractingSite", site: site});
          updateDistractingSitesList();
        });
        li.appendChild(removeButton);
        distractingSitesList.appendChild(li);
      });
    });
  }

  function updateTimeSpent() {
    chrome.runtime.sendMessage({action: "getTimeSpent"}, (response) => {
      const timeSpentMinutes = Math.floor(response.timeSpent / 60);
      const timeLimitMinutes = Math.floor(response.timeLimit / 60);
      timeSpentDisplay.textContent = `Time spent today: ${timeSpentMinutes} / ${timeLimitMinutes} minutes`;
    });
  }

  updateBlockedChannelsList();
  updateDistractingSitesList();
  updateTimeSpent();
  setInterval(updateTimeSpent, 60000); // Update every minute
});