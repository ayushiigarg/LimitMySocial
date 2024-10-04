document.addEventListener('DOMContentLoaded', function() {
    const timeLimitInput = document.getElementById('timeLimit');
    const setTimeLimitButton = document.getElementById('setTimeLimit');
    const aiAnalysisToggle = document.getElementById('aiAnalysisToggle');
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const channelUrlInput = document.getElementById('channelUrl');
    const addChannelButton = document.getElementById('addChannel');
    const blockedChannelsList = document.getElementById('blockedChannels');

    // Check if time limit is exceeded
    chrome.storage.sync.get(['timeLimitExceeded'], (result) => {
        if (result.timeLimitExceeded) {
            document.getElementById('timeLimitModal').style.display = 'block'; // Show the modal
            return;  // Exit early if time limit is exceeded
        }

        // Load saved settings if time limit is not exceeded
        chrome.storage.sync.get(['timeLimit', 'aiAnalysisEnabled', 'apiKey', 'blockedChannels'], function(result) {
            if (result.timeLimit) {
                timeLimitInput.value = result.timeLimit;
            }
            if (result.aiAnalysisEnabled !== undefined) {
                aiAnalysisToggle.checked = result.aiAnalysisEnabled;
            }
            if (result.apiKey) {
                apiKeyInput.value = result.apiKey;
            }
            if (result.blockedChannels) {
                result.blockedChannels.forEach(channel => addChannelToList(channel));
            }
        });
    });

    // Set time limit
    setTimeLimitButton.addEventListener('click', function() {
        const timeLimit = parseInt(timeLimitInput.value);
        if (timeLimit > 0) {
            chrome.storage.sync.set({timeLimit: timeLimit}, function() {
                alert('Time limit set successfully!');
            });
        } else {
            alert('Please enter a valid time limit.');
        }
    });

    // Toggle AI analysis
    aiAnalysisToggle.addEventListener('change', function() {
        chrome.storage.sync.set({aiAnalysisEnabled: aiAnalysisToggle.checked});
    });

    // Save API key
    saveApiKeyButton?.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({apiKey: apiKey}, function() {
                alert('API key saved successfully!');
            });
        } else {
            alert('Please enter a valid API key.');
        }
    });

    // Add blocked channel
    addChannelButton.addEventListener('click', function() {
        const channelUrl = channelUrlInput.value.trim();
        if (channelUrl) {
            chrome.storage.sync.get({blockedChannels: []}, function(result) {
                const blockedChannels = result.blockedChannels;
                if (!blockedChannels.includes(channelUrl)) {
                    blockedChannels.push(channelUrl);
                    chrome.storage.sync.set({blockedChannels: blockedChannels}, function() {
                        addChannelToList(channelUrl);
                        channelUrlInput.value = '';
                    });
                } else {
                    alert('This channel is already blocked.');
                }
            });
        }
    });

    function addChannelToList(channelUrl) {
        const li = document.createElement('li');
        li.textContent = channelUrl;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', function() {
            chrome.storage.sync.get({blockedChannels: []}, function(result) {
                const blockedChannels = result.blockedChannels.filter(url => url !== channelUrl);
                chrome.storage.sync.set({blockedChannels: blockedChannels}, function() {
                    li.remove();
                });
            });
        });
        li.appendChild(removeButton);
        blockedChannelsList.appendChild(li);
    }

    // Close the modal when the close button is clicked
    const closeModalButton = document.getElementById('closeModalButton');
    if (closeModalButton) { // Check if the element exists
        closeModalButton.addEventListener('click', function() {
            document.getElementById('timeLimitModal').style.display = 'none';
        });
    } else {
        console.error('Close modal button not found');
    }
});
