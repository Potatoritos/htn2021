console.log('test');
var prevURL;
chrome.storage.local.get({prevURL: "https://google.com"}, function(data) {
    prevURL = data.prevURL;
    console.log(`prevURL: ${prevURL}`);
});
