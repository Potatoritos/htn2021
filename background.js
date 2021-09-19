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

function updateSetting(key, val) {
    settings[key] = val;
    console.log(`[SETTING CHANGE] ${key} = ${val}`);

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
    if (typeof changeInfo.url !== "undefined" && urlIsWebsite(changeInfo.url)) {
        if (urlIsDistracting(changeInfo.url)) {
            openSoftblockTab();
        }
    }
});
