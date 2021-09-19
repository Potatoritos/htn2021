var settings = {};
var default_settings = {
    blockReason: "reason",
    isWhitelist: false,
    softblockEnabled: false,
    softblockPeriod: 300, // seconds
    blockList: ["duckduckgo.com"],
    blockEnabled: false,
    sessionLength: 3600 // seconds
};

function initSettings() {
    // make sure all keys in default_settings are in chrome storage
    // and populate settings with settings
    for (let [key, val] of Object.entries(default_settings)) {
        chrome.storage.sync.get({[key]: val}, function(data) {
            chrome.storage.sync.set({[key]: data[key]}, function() {
                updateSetting(key, data[key]);
            });
        });
    }
}

function updateSetting(key, val, updateStorage = false) {
    settings[key] = val;
    console.log(`[SETTING CHANGE] ${key} = ${val}`);

    if (updateStorage) {
        chrome.storage.sync.set({[key]: val}, function() {});
    }

    // if statement hell
    if ((((key === "blockList" || key === "isWhitelist" || key === "softblockEnabled") && settings.blockEnabled) || (key === "blockEnabled" && val)) && !settings.softblockEnabled && !settings.isWhitelist) {
        console.log("Hard block (blacklist) enabled");
        updateListener(settings.blockList);
    }
    if ((((key === "blockList" || key === "isWhitelist" || key === "softblockEnabled") && settings.blockEnabled) || (key === "blockEnabled" && val)) && !settings.softblockEnabled && settings.isWhitelist) {
        console.log("Hard block (whitelist) enabled");
        updateListener(["<all_urls>"]);
    }
    if ((key === "softblockEnabled" && val) || (key === "blockEnabled" && !val)) {
        console.log("Hard block disabled.");
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
    }

    if (key === "blockEnabled" && val) {
        sessionEndTime = settings.sessionLength;
    }
    if (key === "blockEnabled" && !val) {
        sessionEndTime = -1;
    }
    if (key === "sessionLength" && settings.blockEnabled) {
        sessionEndTime = val;
    }
}

function checkUpdates(changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        updateSetting(key, newValue);
    }
}

chrome.storage.onChanged.addListener(checkUpdates);

chrome.runtime.onInstalled.addListener(function() {
    initSettings();
});

chrome.runtime.onStartup.addListener(function() {
    initSettings();
});

function urlIsWebsite(url) {
    return !url.startsWith("chrome://") && !url.startsWith("chrome-extension://") && !url.startsWith("about:");
}

function getCleanURL(url) {
    url = url.split('/')[2];
    if (url.split('.')[0] === "www") {
        url = url.slice(4);
    }
    return url.toLowerCase();
}

function urlIsDistracting(url) {
    url = getCleanURL(url);
    if (settings.isWhitelist) {
        return !settings.blockList.includes(url);
    } else {
        return settings.blockList.includes(url);
    }
}

function redirect(data) {
    console.log(data);
    if (settings.isWhitelist) {
        var page;
        if (urlIsDistracting(data.url)) {
            page = chrome.extension.getURL("pages/hardblock.html");
        } else {
            page = data.url;
        }
        return {redirectUrl: page};
    } else {
        var page = chrome.extension.getURL("pages/hardblock.html");
        return {redirectUrl: page};
    }
}

function urlToPattern(url) {
    if (url === "<all_urls>") return url;
    if (!url.startsWith("*.") && !url.includes("://")) url = "*." + url;
    if (!url.endsWith("/*")) url = url + "/*";
    if (!url.includes("://")) url = "*://" + url;
    return url;
}

function updateListener(urls) {
    // hard block
    var patterns = [];
    urls.forEach(function(url) {
        patterns.push(urlToPattern(url));
    });

    if (chrome.webRequest.onBeforeRequest.hasListener(redirect)) {
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
    }

    chrome.webRequest.onBeforeRequest.addListener(redirect, {urls: patterns}, ["blocking"]);
}


var doSoftLoop = false;
var softLoopCnt = -1;

var sessionEndTime = -1;
var sessionCnt = -1;

function loop() {
    if (isNaN(sessionEndTime) && settings.blockEnabled) {
        sessionEndTime = settings.sessionLength;
    }
    if (sessionEndTime != -1) {
        sessionCnt++;
        console.log(`sessionCnt/sessionEndTime: ${sessionCnt}/${sessionEndTime}`);
    } else {
        sessionCnt = -1;
    }

    if (sessionEndTime != -1 && sessionCnt >= sessionEndTime) {
        sessionEndTime = -1;
        updateSetting("blockEnabled", false, true);
    }

    if (doSoftLoop && settings.blockEnabled && settings.softblockEnabled) {
        softLoopCnt++;
        console.log(`softLoopCnt: ${softLoopCnt}`);
    } else {
        softLoopCnt = -1;
        doSoftLoop = false;
    }

    if (softLoopCnt != -1 && softLoopCnt >= settings.softblockPeriod) {
        softLoopCnt = 0;

        chrome.tabs.query({}, function(tabs) {
            var b = true;
            tabs.forEach(function(tab) {
                if (urlIsWebsite(tab.url)) {
                    if (urlIsDistracting(tab.url)) {
                        b = false
                    }
                }
            });
            
            if (b) {
                doSoftLoop = false;
                return;
            }

            tabs.forEach(function(tab) {
                if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                    chrome.tabs.remove(tab.id, function() { });
                }
            });
            chrome.tabs.create({ url: "pages/softblock.html" });
        });
    }
}

setInterval(loop, 1000);

function openSoftblockTab() {
    if (doSoftLoop) return;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                chrome.tabs.remove(tab.id, function() { });
            }
        });
    });
    chrome.tabs.create({ url: "pages/softblock.html" });
    doSoftLoop = true;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // soft block
    if (!settings.softblockEnabled || !settings.blockEnabled) return;
    if (typeof changeInfo.url !== "undefined" && urlIsWebsite(changeInfo.url)) {
        if (urlIsDistracting(changeInfo.url)) {
            openSoftblockTab();
        }
    }
});

