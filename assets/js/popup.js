var titles = ["", "Home", "Blocked Sites", "Settings"];
var sessionEnd = -1;

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
    document.getElementById("title").innerText = titles[x];
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

chrome.storage.sync.get("blockEnabled", function(data) {
	if (data.blockEnabled) {
		document.getElementById("onOffButton").style.fill = "green";
	} else {
		document.getElementById("onOffButton").style.fill = "red";
	}
	
	// timer stuff
});

chrome.storage.sync.get("sessionEndTime", function(data) {
	sessionEnd = data.sessionEndTime
});

function loop2() {
	if (sessionEnd != -1) {
		var timeLeft = sessionEnd - parseInt(Date.now()/1000);
		var hours = Math.floor(timeLeft/3600);
		var minutes = Math.floor((timeLeft%3600)/60);
		var seconds = timeLeft%60;
		
		var z = n => n >= 100 ? n : ('0' + n).slice(-2);
		
		document.getElementById("blockTimer").innerHTML = `${z(hours)}:${z(minutes)}:${z(seconds)}`;
		console.log(timeLeft);
	}
}

setInterval(loop2, 1000);

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


function turnOnBlock(e) {
    if (e.preventDefault) e.preventDefault();
    
    var blockReasonValue = document.getElementById("blockReason").value;
    chrome.storage.sync.set({blockReason: blockReasonValue}, function() {
        console.log("BlockReason saved: ");
        console.log(blockReasonValue);
    });
    var blockTime = document.getElementById("blockTimeInput").value*60;
    if(isSoftEnabled){ //enable softblock
        chrome.storage.sync.set({softblockPeriod: blockTime}, function() {});
    }
	
	chrome.storage.sync.get("sessionEndTime", function(data) {
		sessionEnd = data.sessionEndTime
	});
	
	document.getElementById("onOffButton").style.fill = "green";
	chrome.storage.sync.set({blockEnabled: true}, function() {});
	
    return false;
}
var form2 = document.getElementById('startBreak');
if (form2.attachEvent) {
    form2.attachEvent("submit", turnOnBlock);
} else {
    form2.addEventListener("submit", turnOnBlock);
}

