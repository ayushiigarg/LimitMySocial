let socialMediaTime = 0; // Total time spent on social media in seconds
let timerId;
const socialMediaDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'youtube.com/shorts']; // All blocked domains
const OPENAI_API_KEY = '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'; // Replace with your actual API key

// Check and reset timer if a new day has started
function checkAndResetTimer() {
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

  chrome.storage.sync.get(['lastResetDate', 'socialMediaTime'], (result) => {
    const lastResetDate = result.lastResetDate || '';
    socialMediaTime = result.socialMediaTime || 0; // Load previous time if exists

    if (lastResetDate !== today) {
      socialMediaTime = 0; // Reset the timer
      chrome.storage.sync.set({ lastResetDate: today, socialMediaTime: socialMediaTime }); // Update storage
    }
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndStartTimer(tab.url);
  }
});

// Listen for tab activations
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkAndStartTimer(tab.url);
    }
  });
});

// Check if the URL belongs to blocked social media domains and start the timer
function checkAndStartTimer(url) {
  const domain = new URL(url).hostname;
  if (socialMediaDomains.some(d => url.includes(d))) {
    startTimer();
  } else {
    stopTimerIfNoSocialMedia();
  }
}

// Start the timer
function startTimer() {
  if (!timerId) {
    timerId = setInterval(() => {
      socialMediaTime++;
      chrome.storage.sync.get(['timeLimit'], (result) => {
        if (result.timeLimit && socialMediaTime >= result.timeLimit * 60) {
          blockSocialMedia();
        }
      });
    }, 1000);
  }
}

// Stop the timer if no social media is open
function stopTimerIfNoSocialMedia() {
  chrome.tabs.query({}, (tabs) => {
    const anySocialMediaOpen = tabs.some(tab => socialMediaDomains.some(d => tab.url.includes(d)));
    if (!anySocialMediaOpen) {
      stopTimer();
    }
  });
}

// Stop the timer
function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null; // Reset timerId for future use
  }
}

// Block access to all social media
function blockSocialMedia() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (socialMediaDomains.some(d => tab.url.includes(d))) {
        chrome.tabs.update(tab.id, {url: 'blocked.html'});
      }
    });
    chrome.storage.sync.set({ timeLimitExceeded: true });

    // Show notification when the daily time limit is reached
    showTimeLimitNotification();
    
    stopTimer(); // Stop the timer once blocking is activated
  });
}

// Function to show a notification when time limit is reached
function showTimeLimitNotification() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png', // Replace with your icon path
    title: 'Daily Time Limit Reached',
    message: 'You have completed your daily time limit for social media usage.',
    priority: 2
  });
}

// Analyze video content if requested
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeVideo') {
    analyzeVideoContent(request.videoInfo, sender.tab.id);
  }
});

/// Function to analyze video content
async function analyzeVideoContent(videoInfo, tabId) {
    const prompt = `Analyze the following YouTube video information and determine if it's educational or distracting content:
    Title: ${videoInfo.title}
    Description: ${videoInfo.description}
    Tags: ${videoInfo.tags.join(', ')}

    Is this video likely to be educational content? Respond with 'Yes' or 'No' and provide a brief explanation.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 100
            })
        });

        // Check if response is okay
        if (!response.ok) {
            console.error('Failed to fetch from OpenAI API:', response.status, response.statusText);
            throw new Error('Failed to fetch from OpenAI API');
        }

        const data = await response.json();

        // Check if choices are available in the response
        if (!data.choices || data.choices.length === 0) {
            console.error('No choices found in API response:', data);
            throw new Error('No choices found in API response');
        }

        const aiResponse = data.choices[0].message.content.trim().toLowerCase();

        if (aiResponse.startsWith('no')) {
            chrome.tabs.sendMessage(tabId, { action: 'showWatchLaterPrompt' });
        } else if (aiResponse.startsWith('yes')) {
            // Optional: Handle the case for educational content
            console.log('Video is educational content:', aiResponse);
        } else {
            console.warn('Unexpected response from AI:', aiResponse);
        }
    } catch (error) {
        console.error('Error analyzing video content:', error);
        chrome.tabs.sendMessage(tabId, { action: 'showErrorPrompt', message: 'Error analyzing video content.' });
    }
}

// Run daily check and reset timer on extension load
checkAndResetTimer();
