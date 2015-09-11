angular.module('NoobTubeApp.controllers', [])

.controller('VideosController', ['$scope','VideosService', function ($scope, VideosService) {

    'use strict';

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.favorites = VideosService.getfavorites();
        $scope.comments = VideosService.getComments();
        // set search to default tab
        $scope.active = {
            search: true
        };
        $scope.locationResult = '';
        $scope.locationDetails = '';
        $scope.locationOptions = {
            watchEnter: true,
            focusId: 'search-button'
        };
        VideosService.search(); // search on page load
    }

    init();

    // search
    $scope.search = function () {
        // reset location if location input empty
        if (!$scope.locationResult) {
            $scope.locationDetails = null;
        }
        VideosService.search($scope.query, $scope.locationDetails, $scope.sortOrder);
        $scope.showPlayer = false;
        // activate search tab
        $scope.active = {}; // reset
        $scope.active.search = true;
        document.activeElement.blur(); // hide iOS keyboard on "Return" key press
    };

    // sort order
    $scope.options = ['relevance', 'rating', 'date'];
    $scope.sortOrder = $scope.options[0];

    // favorites
    $scope.toggleFavorite = function (id, title, author, description, thumbnail) {
        VideosService.toggleFavorite(id, title, author, description, thumbnail);
    };
    $scope.favStatus = function (id) {
        var i;
        for (i = $scope.favorites.length - 1; i >= 0; i -= 1) {
            if ($scope.favorites[i].id === id) {
                return true;
            }
        }
    };

    // launch player
    $scope.launch = function (id, title, author, description, thumbnail) {
        VideosService.launch(id, title, author, description, thumbnail);
        $scope.showPlayer = true;
        window.scroll(0,0);
    };
}]);