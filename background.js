function initBlockList() {
    console.log("hi");

    var softblockEnabled;

    chrome.storage.sync.get({blockReason: false}, function(data) {
        chrome.storage.sync.set({blockReason: data.blockReason}, function() {
            console.log("blockReason saved: " + data.blockReason);
        });
    });

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
    
    // the time in between each softblock reminder
    chrome.storage.sync.get({softblockPeriod: 300000}, function(data) {
        chrome.storage.sync.set({softblockEnabled: data.softblockPeriod}, function() {
            console.log("softblockPeriod saved: " + data.softblockPeriod);
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

function loopSoftblockTab() {
    var b = false;
    chrome.storage.sync.get({blockList: []}, function(data) {
        chrome.tabs.query({}, function(tabs) {
            isLooping = false;
            for (var i = 0; i < tabs.length; i++) {
                if (urlIsWebsite(tabs[i].url)) {
                
                    var url = getCleanURL(tabs[i].url);


                    if (data.blockList.includes(url)) {
                        isLooping = true;
                        chrome.tabs.query({}, function(tabs) {
                            tabs.forEach(function(tab) {
                                if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                                    chrome.tabs.remove(tab.id, function() { });
                                }
                            });
                        });
                        chrome.tabs.create({ url: "pages/softblock.html" });
                        break;
                    }
                }   
            }
        });
    });

    chrome.storage.sync.get({softblockPeriod: 300000}, function(data) {
        setTimeout(loopSoftblockTab, data.softblockPeriod);
    });
}

function openSoftblockTab() {
    if (isLooping) return;
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
            if (tab.url.startsWith("chrome-extension://") && tab.url.endsWith("/pages/softblock.html")) {
                chrome.tabs.remove(tab.id, function() { });
            }
        });
    });
    chrome.tabs.create({ url: "pages/softblock.html" });

    isLooping = true;
    chrome.storage.sync.get({softblockPeriod: 300000}, function(data) {
        setTimeout(loopSoftblockTab, data.softblockPeriod);
    });
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

