const CLIENT_ID = encodeURIComponent('430129932757-pfr8s5p3mugu0vagjjr11umrjgkatkim.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://poiapdlnaldpfbobdpglompfhmbegkbi.chromiumapp.org/')
const SCOPE = encodeURIComponent('openid');
const STATE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));
const PROMPT = encodeURIComponent('consent');

let user_signed_in = false;

function is_user_signed_in() {
    return user_signed_in;
}

function create_auth_endpoint() {
    let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

    let openId_endpoint_url =
        `https://accounts.google.com/o/oauth2/v2/auth
?client_id=${CLIENT_ID}
&response_type=${RESPONSE_TYPE}
&redirect_uri=${REDIRECT_URI}
&scope=${SCOPE}
&state=${STATE}
&nonce=${nonce}
&prompt=${PROMPT}`;

    console.log(openId_endpoint_url);
    return openId_endpoint_url;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'login') {
        if (user_signed_in) {
            console.log("User is already signed in.");
        } else {
            chrome.identity.launchWebAuthFlow({
                'url': create_auth_endpoint(),
                'interactive': true
            }, function (redirect_url) {
                if (chrome.runtime.lastError) {
                    // problem signing in
                } else {
                    let id_token = redirect_url.substring(redirect_url.indexOf('id_token=') + 9);
                    id_token = id_token.substring(0, id_token.indexOf('&'));
                    const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(id_token.split(".")[1]));

                    if ((user_info.iss === 'https://accounts.google.com' || user_info.iss === 'accounts.google.com')
                        && user_info.aud === CLIENT_ID) {
                        console.log("User successfully signed in.");
                        alert("pog");
                        user_signed_in = true;
                        chrome.browserAction.setPopup({ popup: './popup.html' }, () => {
                            sendResponse('success');
                        });
                    } else {
                        // invalid credentials
                        console.log("Invalid credentials.");
                    }
                }
            });

            return true;
        }
    } else if (request.message === 'logout') {
        user_signed_in = false;
        chrome.browserAction.setPopup({ popup: './popup.html' }, () => {
            sendResponse('success');
        });

        return true;
    } else if (request.message === 'isUserSignedIn') {
        sendResponse(is_user_signed_in());
    }
});


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

