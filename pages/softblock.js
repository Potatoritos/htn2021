var balls = document.getElementsByClassName("ball");
				  document.onmousemove = function(){
					var x = event.clientX * 100 / window.innerWidth + "%";
					var y = event.clientY * 100 / window.innerHeight + "%";
					//event.clientX => get the horizontal coordinate of the mouse
					//event.clientY => get the Vertical coordinate of the mouse
					//window.innerWidth => get the browser width
					//window.innerHeight => get the browser height
				
					for(var i=0;i<2;i++){
					  balls[i].style.left = x;
					  balls[i].style.top = y;
					  balls[i].style.transform = "translate(-"+x+",-"+y+")";
					}
				  }

chrome.storage.sync.get("blockReason", function(data) {
    document.getElementById("workingon").innerHTML = data.blockReason;
});

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
    close();
}

var button = document.getElementById("closeDistractionsButton");

button.onclick = closeAllDistractions;

