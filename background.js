let timeSpent = 0;
let timeLimit = 20 * 60; // 20 minutes in seconds
let blockedChannels = [];
let distractingSites = ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com/shorts'];
let lastResetDate = new Date().toDateString();

function checkDailyReset() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    timeSpent = 0;
    lastResetDate = today;
    chrome.storage.local.set({ timeSpent, lastResetDate });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['timeLimit', 'blockedChannels', 'distractingSites', 'lastResetDate', 'timeSpent'], (result) => {
    if (result.timeLimit) timeLimit = result.timeLimit;
    if (result.blockedChannels) blockedChannels = result.blockedChannels;
    if (result.distractingSites) distractingSites = result.distractingSites;
    if (result.lastResetDate) lastResetDate = result.lastResetDate;
    if (result.timeSpent) timeSpent = result.timeSpent;
    checkDailyReset();
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkAndBlockSite(tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkAndBlockSite(tab.url);
  });
});

function checkAndBlockSite(url) {
  checkDailyReset();
  
  if (distractingSites.some(site => url.includes(site))) {
    updateTimeSpent();
    if (timeSpent >= timeLimit) {
      blockSite(url);
    }
  } else if (url.includes('youtube.com/watch')) {
    checkYouTubeVideo(url);
  } else if (blockedChannels.some(channel => url.includes(channel))) {
    blockSite(url);
  }
}

function updateTimeSpent() {
  timeSpent++;
  chrome.storage.local.set({ timeSpent });
}

function blockSite(url) {
  if (distractingSites.some(site => url.includes(site)) || 
      (url.includes('youtube.com') && blockedChannels.some(channel => url.includes(channel)))) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "block"});
    });
  }
}

async function checkYouTubeVideo(url) {
  const videoId = extractVideoId(url);
  if (!videoId) return;

  try {
    const videoInfo = await getVideoInfo(videoId);
    const analysisResult = await analyzeVideoContent(videoInfo);

    if (!analysisResult.isEducational) {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "suggestWatchLater"});
      });
    }
  } catch (error) {
    console.error('Error analyzing video content:', error);
  }
}

function extractVideoId(url) {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

async function getVideoInfo(videoId) {
  const API_KEY = 'AIzaSyDWozcTcrCpZPRCzXpfHgUVB9SfrLduuoM'; // Replace with your YouTube Data API key
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`);
  const data = await response.json();
  return data.items[0].snippet;
}

async function analyzeVideoContent(videoInfo) {
  const AI_ANALYSIS_API_URL = 'https://api.openai.com/v1/completions';;
  const AI_API_KEY = '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';

  const distractionKeywords = [
    'funny', 'comedy', 'movie', 'vlog', 'entertainment', 'prank', 'challenge',
    'music video', 'reaction', 'trailer', 'celebrity', 'gossip', 'drama', 
    'game', 'stream', 'tutorial fail', 'fail', 'how-to', 'unboxing', 'review'
  ];

  // Step 1: Keyword-based pre-filtering
  const lowercaseTitle = videoInfo.title.toLowerCase();
  const lowercaseDescription = videoInfo.description.toLowerCase();
  const lowercaseTags = videoInfo.tags.map(tag => tag.toLowerCase());

  const containsDistractionKeyword = distractionKeywords.some(keyword => 
    lowercaseTitle.includes(keyword) || 
    lowercaseDescription.includes(keyword) || 
    lowercaseTags.includes(keyword)
  );

  if (containsDistractionKeyword) {
    return { isEducational: false, educationalProbability: 0.1 };
  }

  // Step 2: AI-based analysis
  const prompt = `
    Analyze the following YouTube video information and determine if it's likely to be educational content. 
    Consider the title, description, and tags. 
    Respond with a JSON object containing an 'isEducational' boolean and an 'educationalProbability' float between 0 and 1.

    Video Title: ${videoInfo.title}
    Video Description: ${videoInfo.description}
    Video Tags: ${videoInfo.tags.join(', ')}

    Consider the following factors:
    1. Presence of educational keywords (e.g., "tutorial", "course", "lesson")
    2. Subject-specific terminology
    3. Structured content in the description (e.g., lesson outline)
    4. Learning objectives or outcomes
    5. Technical or academic language
    6. Absence of entertainment-focused content

    A video is considered educational if it aims to teach, inform, or explain a topic in depth.
  `;

  try {
    const response = await fetch(AI_ANALYSIS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{"role": "user", "content": prompt}],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const analysisResult = await response.json();
    const aiResponse = JSON.parse(analysisResult.choices[0].message.content);

    return {
      isEducational: aiResponse.educationalProbability > 0.7,
      educationalProbability: aiResponse.educationalProbability
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    // Fallback to keyword-based decision if AI analysis fails
    return { isEducational: !containsDistractionKeyword, educationalProbability: 0.5 };
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setTimeLimit") {
    timeLimit = request.timeLimit * 60;
    chrome.storage.local.set({timeLimit: timeLimit});
  } else if (request.action === "addBlockedChannel") {
    blockedChannels.push(request.channel);
    chrome.storage.local.set({blockedChannels: blockedChannels});
  } else if (request.action === "removeBlockedChannel") {
    blockedChannels = blockedChannels.filter(channel => channel !== request.channel);
    chrome.storage.local.set({blockedChannels: blockedChannels});
  } else if (request.action === "getBlockedChannels") {
    sendResponse({blockedChannels: blockedChannels});
  } else if (request.action === "getTimeSpent") {
    sendResponse({timeSpent: timeSpent, timeLimit: timeLimit});
  } else if (request.action === "addDistractingSite") {
    distractingSites.push(request.site);
    chrome.storage.local.set({distractingSites: distractingSites});
  } else if (request.action === "removeDistractingSite") {
    distractingSites = distractingSites.filter(site => site !== request.site);
    chrome.storage.local.set({distractingSites: distractingSites});
  } else if (request.action === "getDistractingSites") {
    sendResponse({distractingSites: distractingSites});
  }
  return true; // Indicates that the response is sent asynchronously
});
