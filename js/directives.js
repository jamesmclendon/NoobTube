angular.module('NoobTubeApp.directives', [])

.directive('selectOnClick', ['$window', function ($window) {
    // Linker function
    return function (scope, element) {
        element.bind('click', function () {
            if (!$window.getSelection().toString()) {
                this.setSelectionRange(0, this.value.length);
            }
        });
    };
}]);