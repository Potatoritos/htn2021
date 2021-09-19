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

if (localStorage.getItem("softblockEnabled") == undefined) localStorage.setItem("softblockEnabled", false);

var isSoftEnabled = localStorage.getItem("softblockEnabled");
var toggleSoft = document.getElementById("toggleSoftBlock"), toggleSoftButton = document.getElementById("toggleSoftBlockButton");
toggleSoft.addEventListener('click', function () {
    if (isSoftEnabled) {
        isSoftEnabled = 0;
        localStorage.setItem("softblockEnabled", false);
        toggleSoft.classList.remove("bg-blue-600");
        toggleSoft.classList.add("bg-gray-200");
        toggleSoftButton.classList.add("translate-x-0");
        toggleSoftButton.classList.remove("translate-x-5");
        console.log(isSoftEnabled);
    } else {
        isSoftEnabled = 1;
        localStorage.setItem("softblockEnabled", true);
        toggleSoft.classList.add("bg-blue-600");
        toggleSoft.classList.remove("bg-gray-200");
        toggleSoftButton.classList.remove("translate-x-0");
        toggleSoftButton.classList.add("translate-x-5");
        console.log(isSoftEnabled);
    }
}, false);

function processForm(e) {
    if (e.preventDefault) e.preventDefault();
    var rawBlocks = document.getElementById("blockedSitesTextArea").value.split("\n");
    var newBlockedSites = rawBlocks.filter((a)=>a);
    chrome.storage.sync.set({blockList: newBlockedSites}, function() {
        console.log("BlockList saved: " + data.blockList);
    });
    return false;
}
var form = document.getElementById('submitBlockedSites');
if (form.attachEvent) {
    form.attachEvent("submit", processForm);
} else {
    form.addEventListener("submit", processForm);
}
