function initBlockList() {
    console.log("hi");

    chrome.storage.sync.get({blockList: []}, function(data) {
        // actual code
        //chrome.storage.sync.set({blockList: data.blockList}, function() {
          //  console.log("blockList saved");
        //});
        
        // testing code
        chrome.storage.sync.set({blockList: ['duckduckgo.com']}, function() {
            console.log("blockList saved: " + data.blockList);
        });

        updateListener(data.blockList)
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
    var page = chrome.extension.getURL("pages/redirect.html");
    console.log(data);
    chrome.storage.local.set({prevURL: data.url}, function() {
        console.log("prevURL stored: " + data.url);
    })
    return {redirectUrl: page};
}

function urlToPattern(url) {
    if (!url.startsWith("*.") && !url.includes("://")) url = "*." + url;
    if (!url.endsWith("/*")) url = url + "/*";
    if (!url.includes("://")) url = "*://" + url;
    return url;
}

function updateListener(urls) {
    var patterns = [];
    urls.forEach(function(url) {
        patterns.push(urlToPattern(url));
    });
    console.log(patterns);

    if (chrome.webRequest.onBeforeRequest.hasListener(redirect)) {
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
    }

    chrome.webRequest.onBeforeRequest.addListener(redirect, {urls: patterns}, ["blocking"]);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
});

