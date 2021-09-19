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
    //document.getElementById("title").innerText = titles[x];
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
		//document.getElementById("onOffButton").style.fill = "green";
        document.getElementById("onOffButton").src = "assets/img/logo256.png";
		//document.getElementById("blockTimeInput").disabled = true;
		document.getElementById("onOffButtonFunction").disabled = true;
		document.getElementById("warningCooldownInput").disabled = true;
		document.getElementById("blockReason").disabled = true;
		document.getElementById("bwSelect").disabled = true;
		document.getElementById("blockedSitesTextArea").disabled = true;
		document.getElementById("toggleSoftBlock").disabled = true;
		document.getElementById("saveBlockChangesButton").disabled = true;
		document.getElementById("saveSettingChangesButton").disabled = true;

        enableCurBtn("plus1h");
        enableCurBtn("plus10m");
        enableCurBtn("plus1m");
        enableCurBtn("minus1h");
        enableCurBtn("minus10m");
        enableCurBtn("minus1m");
	
	} else {
        document.getElementById("onOffButton").src = "assets/img/logooff256.png";
	}
});

chrome.storage.sync.get("sessionEndTime", function(data) {
	sessionEnd = data.sessionEndTime
});

chrome.storage.sync.get("softblockPeriod", function(data) {
    console.log('bing bang bong in the ting in the tang in the bing bang');
    document.getElementById("warningCooldownInput").value = data.softblockPeriod;
});

function loop2() {
	if (sessionEnd != -1) {
		var timeLeft = sessionEnd - parseInt(Date.now()/1000);
        if (timeLeft <= 0) {
            sessionEnd = -1;
            document.getElementById("onOffButtonFunction").disabled = false;
            document.getElementById("warningCooldownInput").disabled = false;
            document.getElementById("blockReason").disabled = false;
            document.getElementById("bwSelect").disabled = false;
            document.getElementById("blockedSitesTextArea").disabled = false;
            document.getElementById("toggleSoftBlock").disabled = false;
            document.getElementById("saveBlockChangesButton").disabled = false;
            document.getElementById("saveSettingChangesButton").disabled = false;
            document.getElementById("onOffButton").src = "assets/img/logooff256.png";

            enableCurBtn("plus1h");
            enableCurBtn("plus10m");
            enableCurBtn("plus1m");
            enableCurBtn("minus1h");
            enableCurBtn("minus10m");
            enableCurBtn("minus1m");
            document.getElementById("blockTimer").innerHTML = "00:00:00";
            return;
        }
		var hours = Math.floor(timeLeft/3600);
		var minutes = Math.floor((timeLeft%3600)/60);
		var seconds = timeLeft%60;
		
		var z = n => n >= 100 ? n : ('0' + n).slice(-2);
		
		document.getElementById("blockTimer").innerHTML = `${z(hours)}:${z(minutes)}:${z(seconds)}`;
		console.log(timeLeft);

        //document.getElementById("blockTimeInput").disabled = true;
        document.getElementById("onOffButtonFunction").disabled = true;
        document.getElementById("warningCooldownInput").disabled = true;
        document.getElementById("blockReason").disabled = true;
        document.getElementById("bwSelect").disabled = true;
        document.getElementById("blockedSitesTextArea").disabled = true;
        document.getElementById("toggleSoftBlock").disabled = true;
        document.getElementById("saveBlockChangesButton").disabled = true;
        document.getElementById("saveSettingChangesButton").disabled = true;

        disableCurBtn("plus1h");
        disableCurBtn("plus10m");
        disableCurBtn("plus1m");
        disableCurBtn("minus1h");
        disableCurBtn("minus10m");
        disableCurBtn("minus1m");

    }
}

setInterval(loop2, 100);

var toggleSoft = document.getElementById("toggleSoftBlock"), toggleSoftButton = document.getElementById("toggleSoftBlockButton");
toggleSoft.addEventListener('click', function () {
    if (!isSoftEnabled) {
        isSoftEnabled = 1;
        toggleSoft.classList.remove("bg-blue-600");
        toggleSoft.classList.add("bg-gray-200");
        toggleSoftButton.classList.add("translate-x-0");
        toggleSoftButton.classList.remove("translate-x-5");

        chrome.storage.sync.set({softblockEnabled: true}, function() {});
    } else {
        isSoftEnabled = 0;
        toggleSoft.classList.add("bg-blue-600");
        toggleSoft.classList.remove("bg-gray-200");
        toggleSoftButton.classList.remove("translate-x-0");
        toggleSoftButton.classList.add("translate-x-5");

        chrome.storage.sync.set({softblockEnabled: false}, function() {});
    }
}, false);

chrome.storage.sync.get("softblockEnabled", function(data) {
    if (data.softblockEnabled) {
        isSoftEnabled = 1;
        toggleSoft.classList.remove("bg-blue-600");
        toggleSoft.classList.add("bg-gray-200");
        toggleSoftButton.classList.add("translate-x-0");
        toggleSoftButton.classList.remove("translate-x-5");
    } else {
        isSoftEnabled = 0;
        toggleSoft.classList.add("bg-blue-600");
        toggleSoft.classList.remove("bg-gray-200");
        toggleSoftButton.classList.remove("translate-x-0");
        toggleSoftButton.classList.add("translate-x-5");
    }
});

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
    
	// set block reason
    var blockReasonValue = document.getElementById("blockReason").value;
    chrome.storage.sync.set({blockReason: blockReasonValue}, function() {
        console.log("BlockReason saved: ");
        console.log(blockReasonValue);
    });
	
	// set timer
    var blockTime = curTime;
    //if(isSoftEnabled){ //enable softblock //i don tt hink this should be here (?)
	chrome.storage.sync.set({sessionLength: blockTime}, function() {});
	var ddate = Date.now();
	chrome.storage.sync.set({sessionEndTime: parseInt(ddate/1000) + blockTime}, function() {});
	sessionEnd = parseInt(ddate/1000) + blockTime;
    //}
	
	// visually turn on button
	//document.getElementById("onOffButton").style.fill = "green";
    document.getElementById("onOffButton").src = "assets/img/logo256.png";
	
	// turn on blocking
	chrome.storage.sync.set({blockEnabled: true}, function() {});
	
	// disable popup functionality
	//document.getElementById("blockTimeInput").disabled = true;
	document.getElementById("onOffButtonFunction").disabled = true;
	document.getElementById("warningCooldownInput").disabled = true;
	document.getElementById("blockReason").disabled = true;
	document.getElementById("bwSelect").disabled = true;
	document.getElementById("blockedSitesTextArea").disabled = true;
	document.getElementById("toggleSoftBlock").disabled = true;
	document.getElementById("saveBlockChangesButton").disabled = true;
	document.getElementById("saveSettingChangesButton").disabled = true;

    disableCurBtn("plus1h");
    disableCurBtn("plus10m");
    disableCurBtn("plus1m");
    disableCurBtn("minus1h");
    disableCurBtn("minus10m");
    disableCurBtn("minus1m");
	
    return false;
}
var form2 = document.getElementById('startBreak');
if (form2.attachEvent) {
    form2.attachEvent("submit", turnOnBlock);
} else {
    form2.addEventListener("submit", turnOnBlock);
}

function changeSettings(e) {
	if (e.preventDefault) e.preventDefault();
	var warningCooldown = document.getElementById("warningCooldownInput").value;
	chrome.storage.sync.set({softblockPeriod: warningCooldown}, function() {});
	document.getElementById("savedSettings").classList.remove("hidden");
    setTimeout(function() {
        document.getElementById("savedSettings").classList.add("hidden");
    }, 1500);
    return false;
}
var form3 = document.getElementById('submitSettingChanges');
if (form3.attachEvent) {
    form3.attachEvent("submit", changeSettings);
} else {
    form3.addEventListener("submit", changeSettings);
}

var curTime = 0;

function plus1h() { curTime += 3600; updateCur(); }
function plus10m() { curTime += 600; updateCur(); }
function plus1m() { curTime += 60; updateCur(); }
function minus1h() { curTime -= 3600; updateCur(); }
function minus10m() { curTime -= 600; updateCur(); }
function minus1m() { curTime -= 60; updateCur(); }

function updateCur() {
    console.log("wtf");
    var hours = Math.floor(curTime/3600);
    var minutes = Math.floor((curTime%3600)/60);
    var seconds = curTime%60;
    
    var z = n => n >= 100 ? n : ('0' + n).slice(-2);
    
    document.getElementById("blockTimer").innerHTML = `${z(hours)}:${z(minutes)}:${z(seconds)}`;

    if (curTime < 60) {
        disableCurBtn("minus1m");
    } else {
        enableCurBtn("minus1m");
    }
    if (curTime < 600) {
        disableCurBtn("minus10m");
    } else {
        enableCurBtn("minus10m");
    }
    if (curTime < 3600) {
        disableCurBtn("minus1h");
    } else {
        enableCurBtn("minus1h");
    }
}

function disableCurBtn(id) {
    var btn = document.getElementById(id);
    btn.classList.add("text-gray-400");
    btn.classList.add("cursor-not-allowed");
    btn.classList.remove("text-gray-800");
    btn.classList.remove("hover:bg-gray-300");
    btn.disabled = true;
}
function enableCurBtn(id) {
    var btn = document.getElementById(id);
    btn.classList.add("text-gray-800");
    btn.classList.add("hover:bg-gray-300");
    btn.classList.remove("text-gray-400");
    btn.classList.remove("cursor-not-allowed");
    btn.disabled = false;
}

document.getElementById("plus1h").addEventListener("click", plus1h);
document.getElementById("plus10m").addEventListener("click", plus10m);
document.getElementById("plus1m").addEventListener("click", plus1m);
document.getElementById("minus1h").addEventListener("click", minus1h);
document.getElementById("minus10m").addEventListener("click", minus10m);
document.getElementById("minus1m").addEventListener("click", minus1m);

updateCur();

chrome.storage.sync.get("blockReason", function(data) {
    document.getElementById("blockReason").innerHTML = data.blockReason;
});
