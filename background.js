let tabTimers = {};
let totalTimeSpent = 0;
const TOTAL_TIME_LIMIT = 60000; // 1 minute for testing purposes
let siteBlocked = false;

// Track time spent in a tab and update total time spent
function trackTime(tabId) {
    if (!tabTimers[tabId]) {
        tabTimers[tabId] = Date.now();
    }
}

// Calculate total time spent and handle site blocking
function handleTabRemoval(tabId) {
    if (tabTimers[tabId]) {
        const timeSpent = Date.now() - tabTimers[tabId];
        totalTimeSpent += timeSpent;
        delete tabTimers[tabId];

        if (totalTimeSpent >= TOTAL_TIME_LIMIT && !siteBlocked) {
            blockSites();
        }
    }
}

// Block social media sites and stop videos
function blockSites() {
    siteBlocked = true;

    // Block the sites
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
            id: 'blockSocialMedia',
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: '*://*.instagram.com/*|*://*.facebook.com/*|*://*.twitter.com/*|*://*.youtube.com/*',
                resourceTypes: ['main_frame']
            }
        }],
        removeRuleIds: ['blockSocialMedia']
    }, function () {
        console.log("Sites blocked");
    });

    // Notify content scripts to stop playback
    chrome.tabs.query({url: "*://*.youtube.com/*"}, function(tabs) {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { action: "stopVideo" });
        });
    });
}


// Listen for tab updates to track time
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && !siteBlocked) {
        trackTime(tabId);
    }
});

// Handle tab removal to calculate time spent
chrome.tabs.onRemoved.addListener(tabId => {
    handleTabRemoval(tabId);
});
