function initBlockList() {
    console.log("hi");

    var softblockEnabled;

    chrome.storage.sync.get({isWhitelist: false}, function(data) {
        chrome.storage.sync.set({isWhitelist: data.isWhitelist}, function() {
            console.log("isWhitelist saved: " + data.isWhitelist);
        });
    });

    chrome.storage.sync.get({softblockEnabled: false}, function(data) {
        chrome.storage.sync.set({softblockEnabled: data.softblockEnabled}, function() {
            console.log("softblockEnabled saved: " + data.softblockEnabled);
            softblockEnabled = data.softblockEnabled;
        });
    });

    chrome.storage.sync.get({blockList: []}, function(data) {
        // actual code
        //chrome.storage.sync.set({blockList: data.blockList}, function() {
          //  console.log("blockList saved");
        //});
        
        // testing code
        chrome.storage.sync.set({blockList: ['duckduckgo.com']}, function() {
            console.log("blockList saved: ");
            console.log(data.blockList);
        });


        //if (softblockEnabled) {
        //for testing purposes:
        if (false) {
            updateListener(data.blockList);
        }
    });

}

function urlIsWebsite(url) {
    return !url.startsWith("chrome://") && !url.startsWith("chrome-extension://") && !url.startsWith("about:");
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
    var page = chrome.extension.getURL("pages/hardblock.html");
    //console.log(data);
    //chrome.storage.local.set({prevURL: data.url}, function() {
    //    console.log("prevURL stored: " + data.url);
    //})
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
    console.log("patterns: " + patterns);

    if (chrome.webRequest.onBeforeRequest.hasListener(redirect)) {
        chrome.webRequest.onBeforeRequest.removeListener(redirect);
    }

    chrome.webRequest.onBeforeRequest.addListener(redirect, {urls: patterns}, ["blocking"]);
}

var isLooping = false;

function isDistractionOpen() {
    chrome.storage.sync.get({blockList: []}, function(data) {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {

                if (urlIsWebsite(tab.url)) {
                
                    var url = getCleanURL(tab.url);

                    console.log("=====");
                    console.log(url);
                    console.log(data.blockList);
                    console.log(data.blockList.includes(url));
                    console.log("=====");

                    if (data.blockList.includes(url)) {
                        return true;
                    }
                }   

            });
        });
    });
    return false;
}

function loopSoftblockTab() {
    console.log("loopSoftblockTab() start");
    if (!isDistractionOpen()) {
        console.log("loopSoftblockTab() wtf");
        isLooping = false;
        return;
    }
    console.log("loopSoftblockTab()");
    
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                chrome.tabs.remove(tab.id, function() { });
            }
        });
    });
    chrome.tabs.create({ url: "pages/softblock.html" });

    setTimeout(loopSoftblockTab, 10000);
}

function openSoftblockTab() {
    if (isLooping) return;
    console.log("openSoftblockTab()");
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                chrome.tabs.remove(tab.id, function() { });
            }
        });
    });
    chrome.tabs.create({ url: "pages/softblock.html" });

    isLooping = true;
    setTimeout(loopSoftblockTab, 10000);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    // soft block
    if (typeof changeInfo.url !== "undefined" && urlIsWebsite(changeInfo.url)) {

        var url = getCleanURL(changeInfo.url);

        chrome.storage.sync.get(['blockList'], function(data) {
            if (data.blockList.includes(url)) {
                openSoftblockTab();
            }
        });

    }
});

