document.addEventListener('DOMContentLoaded', function() {
    const setLimitBtn = document.getElementById('setLimitBtn');
    const timeLimitInput = document.getElementById('timeLimit');
    const status = document.querySelector('.status');
    
    setLimitBtn.addEventListener('click', () => {
        const minutes = parseInt(timeLimitInput.value);
        if (!isNaN(minutes)) {
            const limitInMilliseconds = minutes * 60000;
            chrome.storage.local.set({ timeLimit: limitInMilliseconds }, function() {
                status.textContent = `Time limit set to ${minutes} minutes.`;
            });
        } else {
            status.textContent = "Please enter a valid number.";
        }
    });

    const addChannelBtn = document.getElementById('addChannelBtn');
    const addChannelInput = document.getElementById('addChannel');
    const blockedChannels = document.getElementById('blockedChannels');

    // Add YouTube channel to block list
    addChannelBtn.addEventListener('click', () => {
        const channelUrl = addChannelInput.value.trim();
        if (channelUrl) {
            chrome.storage.local.get({ blockedChannels: [] }, function(data) {
                const updatedChannels = [...data.blockedChannels, channelUrl];
                chrome.storage.local.set({ blockedChannels: updatedChannels }, function() {
                    renderBlockedChannels(updatedChannels);
                    addChannelInput.value = '';
                });
            });
        }
    });

    // Load blocked channels from storage
    chrome.storage.local.get({ blockedChannels: [] }, function(data) {
        renderBlockedChannels(data.blockedChannels);
    });

    function renderBlockedChannels(channels) {
        blockedChannels.innerHTML = '';
        channels.forEach(channel => {
            const li = document.createElement('li');
            li.textContent = channel;
            blockedChannels.appendChild(li);
        });
    }
});
