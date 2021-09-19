document.querySelector('#sign-in')
  .addEventListener('click', function () {
     chrome.runtime.sendMessage({ message: 'login' }, function 
       (response) {
         if (response === 'success') window.close();
     });
});
document.getElementById('userstatus')
  .addEventListener('click', function () {
     chrome.runtime.sendMessage({ message: 'isUserSignedIn' }, 
       function (response) {
         alert(response);
    });
});
