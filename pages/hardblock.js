
chrome.storage.sync.get("blockReason", function(data) {
    document.getElementById("workingon").innerHTML = data.blockReason;
});

/*
console.log('test');
var prevURL;
chrome.storage.local.get({prevURL: "https://google.com"}, function(data) {
    prevURL = data.prevURL;
    console.log(`prevURL: ${prevURL}`);
});
*/
