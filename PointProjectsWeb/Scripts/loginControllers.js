angular.module('app', ['ngCookies', 'ui.bootstrap','ui.router']);

angular.module('app').config(['$urlRouterProvider', '$stateProvider', function ($urlRouterProvider, $stateProvider) {

    // default route
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: '/templates/login/main.html',
            controller: 'loginCtrl'
        })
        .state('forgotpass', {
            url: '/forgotpass',
            templateUrl: '/templates/login/forgotPassword.html',
            controller: 'loginCtrl'
        })
        .state('passrecovery', {
            url: '/passrecovery/:data',
            templateUrl: '/templates/login/forgotPassword.html',
            controller: 'loginCtrl'
        })
        ;

}]);

angular.module('app')
.controller('loginCtrl', ['$scope', '$state','factory',
function ($scope, $state, factory) {
    $scope.loginData = { username: '', password: '' };
    $scope.registrationButtonText = 'Pošalji kod';
    $scope.verified = false;
    $scope.registration = { code: '', password: '', password2: '', username: '' };
    $scope.recovery = { fromLink: false, email: '', password: '', password2: '' };

    $scope.login = function () {
        factory.login($scope.loginData.username, $scope.loginData.password).then(function (response) {
            if (factory.user != null)
                location.href = '/index.html';
            else
            {
                $scope.errorMessage = 'Neispravno korisničko ime ili lozinka';
            }
        });
    };

    $scope.register = function () {
        if (!$scope.verified)
        {
            factory.register($scope.registration.registrationCode).then(function (response) {
                if (response.data == null)
                    $scope.errorMessageReg = 'Neispravan registracijski kod';
                else
                {
                    var u = response.data;
                    $scope.registration = { id: u.id, username: u.username, registrationCode: u.registrationCode, password: '', password2: '' };
                    $scope.verified = true;
                    $scope.registrationButtonText = 'Završi registraciju';
                }                
            },
            function (response) {
                $scope.errorMessageReg = response.data;
            }
            );
        }
        else
        {
            var obj = { code: $scope.registration.registrationCode, password: $scope.registration.password, password2: $scope.registration.password2 };
            factory.updatePassword(obj).then(function (response) {
                factory.login($scope.registration.username, $scope.registration.password).then(function () {
                    if (factory.user != null)
                        location.href = '/index.html';
                    else
                        $scope.errorMessageReg = 'Nepredviđena pogreška. Obratite se administratoru.';
                });
            },
            function (errResponse) {
                $scope.errorMessageReg = errResponse.data;
            }
            );            
            
        }
        
    };

    $scope.sendRecoveryLink = function () {
        factory.sendRecoveryLink($scope.recovery.email).then(function (response) {
            $scope.recovery.successMessage = response.data;
        },
        function (errResponse) {
            $scope.recovery.errorMessage = errResponse.data.ExceptionMessage;
        });
    };

    if($state.current.name == 'passrecovery')
    {
        $scope.recovery.code = $state.params.data;
        factory.checkRecoveryCode($state.params.data).then(function (response) {
            $scope.recovery.id = response.data.id;
            $scope.recovery.username = response.data.username;
            $scope.recovery.fromLink = true;
        },
        function (errResponse) {
            $scope.recovery.errorMessage = errResponse.data.ExceptionMessage != null ? errResponse.data.ExceptionMessage : errResponse.data;
        });
    }

    $scope.setPassword = function () {
        if ($scope.recovery.password != $scope.recovery.password2)
            $scope.recovery.errorMessage = 'Lozinke se razlikuju!';
        else
        {
            var obj = { id: $scope.recovery.code, password: $scope.recovery.password };
            factory.updatePassword(obj).then(function (response) {
                factory.login($scope.recovery.username, $scope.recovery.password).then(function () {
                    if (factory.user != null)
                        location.href = '/index.html';
                    else
                        $scope.errorMessageReg = 'Nepredviđena pogreška. Obratite se administratoru.';
                });
            });
        }
    };
}]);