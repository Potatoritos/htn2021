function initBlockList() {
    console.log("hi");

    chrome.storage.sync.get({blockList: []}, function(data) {
        //chrome.storage.sync.set({blockList: data.blockList}, function() {
          //  console.log("blockList saved");
        //});
        chrome.storage.sync.set({blockList: ['duckduckgo.com']}, function() {
            console.log("blockList saved");
        });
    });

}

chrome.runtime.onInstalled.addListener(function() {
    initBlockList();
//    chrome.storage.sync.set({ test });
//    chrome.tabs.query({}, tabs => {
//        tabs.forEach(tab => {
//            console.log(tab.url);
//        });
//    });
});

chrome.runtime.onStartup.addListener(function() {
    initBlockList();
});

function getCleanURL(url) {
    url = url.split('/')[2];
    if (url.split('.')[0] === "www") {
        url = url.slice(4);
    }
    return url.toLowerCase();
}

function redirect(data) {
    var page = chrome.extension.getURL("redirect.html");
    console.log(data);
    chrome.storage.local.set({prevURL: data.url}, function() {
        console.log("prevURL stored: " + data.url);
    })
    return {redirectUrl: page};
}

function updateListener(urls) {
    if (chrome.webRequest.onBeforeRequest.hasListener(redirect)) {
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
    }

    chrome.webRequest.onBeforeRequest.addListener(redirect, {urls: urls}, ["blocking"]);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (typeof changeInfo.url !== "undefined" // improve how redirect page is detected later(?)
            && changeInfo.url.startsWith("chrome-extension://")
            && changeInfo.url.endsWith("/redirect.html")) {
        console.log(changeInfo);
        // find a way to edit the page so that it can go back to the distracting site
    }
});

updateListener(["https://duckduckgo.com/*"]);
