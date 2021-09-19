var settings = {};
var default_settings = {
    blockReason: "reason",
    isWhitelist: false,
    softblockEnabled: false,
    softblockPeriod: 300,
    blockList: ["duckduckgo.com"],
    blockEnabled: false
};

function initSettings() {

    for (let [key, val] of Object.entries(default_settings)) {
        chrome.storage.sync.get({[key]: val}, function(data) {
            chrome.storage.sync.set({[key]: data[key]}, function() {
                updateSetting(key, data[key]);
            });
        });
    }

}

function updateSetting(key, val) {
    settings[key] = val;
    console.log(`${key} changed: ${val}`);
    if (((key === "blockList" && settings.blockEnabled) || (key === "blockEnabled" && val)) && !settings.softblockEnabled) {
        console.log("enabling.");
        updateListener(settings.blockList);
    }
    if ((key === "softblockEnabled" && val) || (key === "blockEnabled" && !val)) {
        console.log("disabling.");
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
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

function redirect(data) {
    var page = chrome.extension.getURL("pages/hardblock.html");
    return {redirectUrl: page};
}

function urlToPattern(url) {
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
var softLoopCnt = 0;

function loop() {
    if (doSoftLoop) {
        softLoopCnt++;
        console.log(`softLoopCnt: ${softLoopCnt}`);
    } else {
        softLoopCnt = -1;
    }

    if (softLoopCnt != -1 && softLoopCnt >= settings.softblockPeriod) {
        softLoopCnt = 0;

        chrome.tabs.query({}, function(tabs) {
            var b = true;
            tabs.forEach(function(tab) {
                if (urlIsWebsite(tab.url)) {
                    var url = getCleanURL(tab.url);
                    if (settings.blockList.includes(url)) {
                        b = false;
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
    if (typeof changeInfo.url !== "undefined" && urlIsWebsite(changeInfo.url)) {

        var url = getCleanURL(changeInfo.url);

        if (settings.blockList.includes(url)) {
            openSoftblockTab();
        }

    }
});

