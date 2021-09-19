for (var i = 1; i <= 3; i++) {
    (function () {
        var temp = i;
        document.getElementById("showSection" + i).addEventListener('click', function () { showSection(temp) }, false);
    }());

}

function showSection(x) {
    for (var i = 1; i <= 3; i++) {
        if (i == x) continue;
        document.getElementById("section-" + i).style.display = "none";
        document.getElementById("showSection" + i).classList.remove("text-blue-700");
    }
    document.getElementById("section-" + x).style.display = "block";
    document.getElementById("showSection" + x).classList.add("text-blue-700");
}


var isSoftEnabled;
chrome.storage.sync.get("softblockEnabled", function(data) {
    isSoftEnabled = data.softblockEnabled;
    if(isSoftEnabled){
        toggleSoft.classList.add("bg-blue-600");
        toggleSoft.classList.remove("bg-gray-200");
        toggleSoftButton.classList.remove("translate-x-0");
        toggleSoftButton.classList.add("translate-x-5");
    }
});

chrome.storage.sync.get("blockList", function(data) {
    document.getElementById("blockedSitesTextArea").value = data.blockList.join('\n');
});

chrome.storage.sync.get("isWhitelist", function(data){
    var opt = document.getElementById("bwSelect").children;
    console.log(opt);
    opt[0+(data.isWhitelist)].setAttribute("selected", "selected");
});

var toggleSoft = document.getElementById("toggleSoftBlock"), toggleSoftButton = document.getElementById("toggleSoftBlockButton");
toggleSoft.addEventListener('click', function () {
    if (isSoftEnabled) {
        isSoftEnabled = 0;
        toggleSoft.classList.remove("bg-blue-600");
        toggleSoft.classList.add("bg-gray-200");
        toggleSoftButton.classList.add("translate-x-0");
        toggleSoftButton.classList.remove("translate-x-5");
    } else {
        isSoftEnabled = 1;
        toggleSoft.classList.add("bg-blue-600");
        toggleSoft.classList.remove("bg-gray-200");
        toggleSoftButton.classList.remove("translate-x-0");
        toggleSoftButton.classList.add("translate-x-5");
    }
}, false);

function processForm(e) {
    if (e.preventDefault) e.preventDefault();
    var rawBlocks = document.getElementById("blockedSitesTextArea").value.split("\n");
    var newBlockedSites = rawBlocks.filter((a)=>a);
    chrome.storage.sync.set({blockList: newBlockedSites}, function() {
        console.log("BlockList saved: ");
        console.log(newBlockedSites);
    });
    var isWhitelisted = document.getElementById("bwSelect").value==="Whitelisted";
    chrome.storage.sync.set({isWhitelist: isWhitelisted}, function() {
        console.log("isWhitelist saved: " + isWhitelisted);
    });
    chrome.storage.sync.set({softblockEnabled: isSoftEnabled}, function() {
        console.log("softblockEnabled saved: " + isSoftEnabled);
    });
    document.getElementById("savedBlocked").classList.remove("hidden");
    return false;
}
var form = document.getElementById('submitBlockedSites');
if (form.attachEvent) {
    form.attachEvent("submit", processForm);
} else {
    form.addEventListener("submit", processForm);
}
