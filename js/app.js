var app = angular.module('NoobTubeApp', ['ui.bootstrap', 'ngSanitize', 'ngCookies']);

// Run

app.run(function () {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

// Config

app.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// Service

app.service('VideosService', ['$cookies', '$window', '$log', function ($cookies, $window, $log) {

    var service = this;

    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null
    };
    var results = [];
    var comments = [];
    var favorites;
    favorites = $cookies.getObject('favorites', favorites) || [];

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('videoPlayer');
        service.loadPlayer();
    };

    function onYoutubeReady() {
        $log.info('YouTube Player is ready');
    }

    this.bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    this.createPlayer = function () {
        $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
        return new YT.Player(youtube.playerId, {
            playerVars: {
                rel: 0,
                showinfo: 0
            },
            events: {
                onReady: onYoutubeReady
            }
        });
    };

    this.loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = service.createPlayer();
        }
    };

    this.launchPlayer = function (id, title, author, description, likes, dislikes, thumbnail) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        youtube.videoTitle = title;
        youtube.videoAuthor = author;
        youtube.videoDescription = description;
        youtube.videoLikes = likes;
        youtube.videoDislikes = dislikes;
        youtube.videoThumbnail = thumbnail;
        return youtube;
    };

    this.listResults = function (data) {
        results.length = 0;
        data.items.forEach(function (item) {
            results.push({
                id: item.id.videoId,
                title: item.snippet.title,
                author: "by " + item.snippet.channelTitle,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.default.url
            });
        });
        return results.reverse();
    };

    var setCookie = function () {
        // Find tomorrow's date.
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 1);
        $cookies.putObject('favorites', favorites, {expires: expireDate});
    };

    this.favoriteVideo = function (id, title, author, description, thumbnail) {
        if (!((favorites) && (JSON.stringify(favorites).indexOf(id) > -1))) {
            favorites.push({
                id: id,
                title: title,
                author: author,
                description: description,
                thumbnail: thumbnail
            });
            setCookie();
            return favorites;
        }
    };
    
    this.deleteVideo = function (id) {
        var i;
        for (i = favorites.length - 1; i >= 0; i -= 1) {
            if (favorites[i].id === id) {
                favorites.splice(i, 1);
                break;
            }
        }
        setCookie();
    };

    this.listComments = function (data) {
        data.data.items.forEach(function (item) {
            comments.push({
                author: item.snippet.topLevelComment.snippet.authorDisplayName,
                content: item.snippet.topLevelComment.snippet.textDisplay,
                published: item.snippet.topLevelComment.snippet.publishedAt,
                thumbnail: item.snippet.topLevelComment.snippet.authorProfileImageUrl
            });
        });
        return comments.reverse();
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

    this.getfavorites = function () {
        return favorites;
    };

    this.getComments = function () {
        return comments;
    };

}]);

// Controller

app.controller('VideosController', ['$scope', '$http', '$log', '$window', 'VideosService', function ($scope, $http, $log, $window, VideosService) {

    var youtubeKey = 'AIzaSyAD-k8DZ85QM3k1yDnrm1sE_73tHdmAgS8';

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.favorites = VideosService.getfavorites();
        $scope.comments = VideosService.getComments();
    }

    init();

    $scope.launch = function (id, title, author, description, thumbnail) {

        // likes & dislikes
        $http.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: youtubeKey,
                part: 'statistics',
                id: id,
                fields: 'items/statistics/likeCount,items/statistics/dislikeCount'
            }
        })
            .then(function (result) {
                $log.info(result.data);
                function parseJSON() {
                    return JSON.parse(JSON.stringify(result.data)).items[0].statistics;
                }
                var likes = parseJSON().likeCount;
                var dislikes = parseJSON().dislikeCount;
                VideosService.launchPlayer(id, title, author, description, likes, dislikes, thumbnail);
                $log.info('Launched id:' + id + ' and title:' + title);
                $scope.showPlayer = true;
                // scroll to top of page
                $window.scrollTo(0, 0);
            });

        // comments
        $http.get('https://www.googleapis.com/youtube/v3/commentThreads', {
            params: {
                key: youtubeKey,
                part: 'snippet',
                videoId: id,
                fields: 'items/snippet/topLevelComment/snippet/authorDisplayName,items/snippet/topLevelComment/snippet/textDisplay,items/snippet/topLevelComment/snippet/publishedAt,items/snippet/topLevelComment/snippet/authorProfileImageUrl'
            }
        })
            .then(function (data) {
                VideosService.listComments(data);
            });

    };

    // favorites
    $scope.favorite = function (id, title, author, description, thumbnail) {
        VideosService.favoriteVideo(id, title, author, description, thumbnail);
        $log.info('Favorited id:' + id + ' and title:' + title);
    };

    // delete favorites
    $scope.delete = function (id) {
        VideosService.deleteVideo(id);
    };

    // sort order
    $scope.options = ['Relevance', 'Rating', 'Date'];
    $scope.selectedOrder = $scope.options[0];

    // location
    function initialize() {
        var input = document.getElementById('searchTextField');
        var autocomplete = new google.maps.places.Autocomplete(input);
        google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var place = autocomplete.getPlace();
            $scope.coord = (place.geometry.location.lat() + ", " + place.geometry.location.lng());
            $scope.radius = '50km';
        });
    }
    google.maps.event.addDomListener(window, 'load', initialize);

    // search
    $scope.search = function (order) {
        //activate search tab
        $scope.active = {
            search: true
        };
        // if location empty
        if (this.location === "") {
            $scope.coord = null;
            $scope.radius = null;
        }
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: youtubeKey,
                type: 'video',
                maxResults: '50',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: this.query,
                location: $scope.coord,
                locationRadius: $scope.radius,
                order: order
            }
        })
            .success(function (data) {
                VideosService.listResults(data);
                VideosService.loadPlayer(); // kill video, if loaded
                $scope.showPlayer = false; // hide player
                $log.info(data);
            })
            .error(function () {
                $log.info('Search error');
            });
    };

    // auto search
    $scope.search();
}]);
