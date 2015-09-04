angular.module('NoobTubeApp', ['ui.bootstrap', 'ngSanitize', 'ngCookies', 'NoobTubeApp.controllers', 'NoobTubeApp.services'])

// Run

.run(function () {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})

// Config

.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});
