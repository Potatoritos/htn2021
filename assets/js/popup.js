for(var i = 1; i <= 3; i++){
    (function(){
        var temp = i;
        document.getElementById("showSection"+i).addEventListener('click', function(){showSection(temp)}, false);
    }());

}



function showSection(x){
    for(var i = 1; i <= 3; i++){
        if(i==x) continue;
        document.getElementById("section-" + i).style.display="none";
    }
    document.getElementById("section-" + x).style.display="block";
}
