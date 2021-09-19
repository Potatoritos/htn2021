function getCleanURL(url) {
    url = url.split('/')[2];
    if (url.split('.')[0] === "www") {
        url = url.slice(4);
    }
    return url.toLowerCase();
}

function closeAllDistractions() {
    chrome.storage.sync.get({blockList: []}, function(data) {
        console.log(data.blockList);
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                console.log(tab.url);
                var url = getCleanURL(tab.url);
                if (data.blockList.includes(url)) {
                    chrome.tabs.remove(tab.id, function() { });
                }
            });
        });
    });
}

var button = document.getElementById("closeDistractionsButton");

button.onclick = closeAllDistractions;

