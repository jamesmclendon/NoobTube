angular.module('NoobTubeApp.services', [])

.factory('VideosService', ['$cookies', '$http', '$window', '$log', function ($cookies, $http, $window, $log) {

    'use strict';

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

    // default favorites
    if (favorites.length < 1) {
        favorites.push({
            id: "MFu66ye6YWM",
            title: "YMO Rydeen Music Cilp",
            author: "Woo200901",
            description: "",
            thumbnail: "https://i.ytimg.com/vi/MFu66ye6YWM/default.jpg"
        },
        {
            id: "yOHGr8r5Cs4",
            title: "W.C. Fields - The Diner Sketch",
            author: "rolko52",
            description: "From \"Kovacs Corner\" on YouTube.com] - William Claude Dukenfield, known professionally as W.C. Fields, with his bizarre and iconoclastic sense of humor, ...",
            thumbnail: "https://i.ytimg.com/vi/yOHGr8r5Cs4/default.jpg"
        },
        {
            id: "gua71Ia7rAU",
            title: "Bimbo's Initiation HD 1080p",
            author: "",
            description: "Someone else tried uploading this cartoon in HD, but the audio was out of sync. Bimbo's Initiation is in the public domain, so I encourage everyone to steal this ...",
            thumbnail: "https://i.ytimg.com/vi/gua71Ia7rAU/default.jpg"
        },
        {
            id: "TbV7loKp69s",
            title: "John Whitney \"Catalog\" 1961",
            author: "crystalsculpture2",
            description: "John Whitney's demo reel of work created with his analog computer/film camera magic machine he built from a WWII anti-aircraft gun sight. Also Whitney and the ...",
            thumbnail: "https://i.ytimg.com/vi/TbV7loKp69s/default.jpg"
        },
        {
            id: "kB7skYEv_EM",
            title: "Be My Wife - David Bowie",
            author: "kamara",
            description: "the video for \"Be My Wife\".",
            thumbnail: "https://i.ytimg.com/vi/kB7skYEv_EM/default.jpg"
        },
        {
            id: "XiBiO66pOqg",
            title: "Noman McLaren - Spheres",
            author: "5imone5",
            description: "Norman McLaren - Spheres (1969)",
            thumbnail: "https://i.ytimg.com/vi/XiBiO66pOqg/default.jpg"
        });
    }

    function onYoutubeReady() {
        $log.info('YouTube Player is ready');
    }

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        bindPlayer('videoPlayer');
        loadPlayer();
    };

    var bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    var loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = createPlayer();
        }
    };

    var createPlayer = function () {
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

    var launchPlayer = function (id, title, author, description, likes, dislikes, thumbnail) {
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

    var listResults = function (data) {
        results.length = 0;
        var i;
        for (i = data.items.length - 1; i >= 0; i -= 1) {
            results.push({
                id: data.items[i].id.videoId,
                title: data.items[i].snippet.title,
                author: data.items[i].snippet.channelTitle,
                description: data.items[i].snippet.description,
                thumbnail: data.items[i].snippet.thumbnails.default.url
            });
        }
        return results;
    };

    this.toggleFavorite = function (id, title, author, description, thumbnail) {

        var found = false;
        var i;
        for (i = favorites.length - 1; i >= 0; i -= 1) {
            // if found in favorites, remove it
            if (favorites[i].id === id) {
                favorites.splice(i, 1);
                $log.info('Unfavorited id: ' + id + ', title:' + title);
                found = true;
                break;
            }
        }
        // otherwise add favorite
        if (!found) {
            favorites.push({
                id: id,
                title: title,
                author: author,
                description: description,
                thumbnail: thumbnail
            });
            $log.info('Favorited id: ' + id + ', title:' + title);
        }

        // set cookie (expire in 30 days)
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 30);
        $cookies.putObject('favorites', favorites, {expires: expireDate});

        return favorites;
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

    // search
    var youtubeKey = 'AIzaSyAD-k8DZ85QM3k1yDnrm1sE_73tHdmAgS8';

    this.search = function (query, location, sortOrder) {
        var latLng = null;
        var radius = null;
        if (location && location.hasOwnProperty('geometry')) {
            latLng = location.geometry.location.lat() + ', ' + location.geometry.location.lng();
            radius = '50km';
        }
        $http.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: youtubeKey,
                type: 'video',
                maxResults: '50',
                part: 'id,snippet',
                fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
                q: query,
                location: latLng,
                locationRadius: radius,
                order: sortOrder
            }
        }).then(function (response) {
            if (sortOrder && sortOrder === 'rating') {
                listResults(response.data);
            } else {
                // reverse 'relevance' and 'date' to place most popular and most recent first
                listResults(response.data).reverse();
            }
            loadPlayer(); // kill video, if loaded
            $log.info(response.data);
        }, function () {
            $log.info('Search error');
        });
    };

    this.launch = function (id, title, author, description, thumbnail) {

        // likes & dislikes
        $http.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: youtubeKey,
                part: 'statistics',
                id: id,
                fields: 'items/statistics/likeCount,items/statistics/dislikeCount'
            }
        }).then(function (result) {
            $log.info(result.data);
            function numberWithCommas(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            var likes = numberWithCommas(result.data.items[0].statistics.likeCount);
            var dislikes = numberWithCommas(result.data.items[0].statistics.dislikeCount);
            launchPlayer(id, title, author, description, likes, dislikes, thumbnail);
            $log.info('Playing id: ' + id + ', title:' + title);
        }, function () {
            $log.info('Likes error');
        });
        // comments
        $http.get('https://www.googleapis.com/youtube/v3/commentThreads', {
            params: {
                key: youtubeKey,
                part: 'snippet',
                videoId: id,
                fields: 'items/snippet/topLevelComment/snippet/authorDisplayName,items/snippet/topLevelComment/snippet/textDisplay,items/snippet/topLevelComment/snippet/publishedAt,items/snippet/topLevelComment/snippet/authorProfileImageUrl'
            }
        }).then(function (result) {
            comments.length = 0;
            var i;
            for (i = result.data.items.length - 1; i >= 0; i -= 1) {
                comments.push({
                    author: result.data.items[i].snippet.topLevelComment.snippet.authorDisplayName,
                    content: result.data.items[i].snippet.topLevelComment.snippet.textDisplay,
                    published: result.data.items[i].snippet.topLevelComment.snippet.publishedAt,
                    thumbnail: result.data.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl
                });
            }
            return comments.reverse();
        }, function () {
            $log.info('Comments error');
        });

    };

    return service;

}]);