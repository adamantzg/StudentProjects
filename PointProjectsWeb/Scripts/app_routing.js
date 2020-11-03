angular.module('app', ['ui.bootstrap', 'datatables', 'ui.router', 'ngCookies', 'angular-plupload']);
angular.module('app').config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

    // default route
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: '/templates/home.html',
            controller: 'homeCtrl'
        })
        .state('users', {
            url: '/users',
            templateUrl: '/templates/users.html',
            controller: 'usersCtrl'
        })
        .state('userdata', {
            url: '/userinfo',
            templateUrl: '/templates/user.html',
            controller: 'usersCtrl'
        })
        .state('request', {
            url: '/request/:id',
            templateUrl: '/templates/requestview.html',
            controller: 'requestCtrl'
        })
        .state('subjects', {
        url: '/subjects',
        templateUrl: '/templates/subjects.html',
        controller: 'subjectsCtrl'
        });
        

}]);