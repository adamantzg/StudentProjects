angular.module('app')
.factory('factory', ['$http', '$cookies','$q', function ($http,$cookies,$q) {
    var factory = {user: null};

    factory.login = function (username, password) {
        return $http.post('api/login?username=' + username + '&password=' + password).then(function (response) {
            factory.user = response.data;
            if (factory.user != null)
            {
                //$cookies.put('pprojects_user', JSON.stringify(factory.user));
                //$cookies.put('pprojects_user_token', factory.user.Token);
            }
            
        });
    };

    factory.logout = function () {
        $cookies.remove('pprojects_user');
        $cookies.remove('pprojects_user_token');
    };

    /*factory.testToken = function () {
        return $q(function (resolve, reject) {
            var cookie = $cookies.get('pprojects_user_token');
            if (cookie == null)
            {
                reject();
                factory.user = null;
            }
                
            else
            {
                //cookie = JSON.parse(cookie);
                $http.post('api/testToken', { token: cookie }).then(function (response) {
                    if (response.data != null)
                    {
                        factory.user = response.data;
                        resolve(factory.user);
                    }                        
                    else
                    {
                        factory.user = null;
                        reject();                        
                    }
                });
            }
        });
    };*/

    factory.getCurrentUser = function () {
        return $http.post('api/user/getCurrent').then(function (response) {
            factory.user = response.data;
        });
    };

    factory.getGroups = function () {
        return $http.get('api/user/getGroups', { params: { userId: factory.user.id } });
    };

    factory.newUser = function (groupId) {
        return {
            name: '',
            surname: '',
            email: '',
            username: '',
            registrationCode: '',
            Groups: [{GroupId: groupId}]
        }
    };

    factory.newSubject = function () {
        return { name: '', description: '', courseId: null, createdBy: factory.user };
    };

    factory.register = function (code) {
        return $http.post('api/register/?registrationCode=' + code);
    };

    factory.updateUser = function (user) {
        var url = user.id > 0 ? 'api/user/update' : 'api/user/create';
        return $http.post(url, user);
    };

    factory.deleteUser = function (id) {
        return $http.delete('api/user/delete?id=' + id);
    };

    factory.updatePassword = function (user) {
        return $http.post('api/user/updatePassword', user);
    };

    factory.sendRecoveryLink = function (email) {
        return $http.post('api/recoveryLink?email=' + email);
    };

    factory.checkRecoveryCode = function (data) {
        return $http.post('api/checkRecoveryCode', { data: data });
    };

    factory.sendCodes = function (codes) {
        return $http.post('api/user/sendCodes', codes);
    };

    factory.checkUsername = function (id,username) {
        return $http.post('api/user/checkusername?username=' + username + '&id=' + id);
    };

    factory.generateCode = function () {
        return $http.get('api/user/generateCode');
    };

    factory.getSubjects = function (freeOnly) {
        return $http.get('api/subject/get', { params: { freeOnly: freeOnly } });
    };

    factory.updateUserCourse = function (userId, courseId, remove) {
        return $http.post('api/user/updateCourse?userId=' + userId + '&courseId=' + courseId + '&remove=' + remove);
    };

    factory.updateSubject = function(subject)
    {
        subject.createdBy = null;
        subject.approvedBy = null;
        return $http.post(subject.id == null ? 'api/subject/create' : 'api/subject/update', subject);
    }

    factory.deleteSubject = function (id) {
        return $http.delete('api/subject/delete?id=' + id);
    };

    factory.getRequestsForCurrentUser = function()
    {
        return $http.get('api/request/getRequestsForCurrentUser');
    }

    factory.createRequest = function (r) {
        return $http.post('api/request/create', r);
    };

    factory.getAvailableCoursesForRequest = function () {
        return $http.get('api/request/getAvailableCoursesForRequest');
    };

    factory.cancelRequest = function (requestId) {
        return $http.post('api/request/setStatus?statusId=' + statuses.RequestCancelled + '&requestId=' + requestId);
    };

    factory.refreshRequest = function (requestId) {
        return $http.post('api/request/setStatus?statusId=' + statuses.RequestReinstated + '&requestId=' + requestId);
    };

    factory.setStatus = function (requestId, statusId, comment) {
        return $http.post('api/request/setStatus?statusId=' + statusId + '&requestId=' + requestId, comment);
    };

    factory.updateRequest = function (request) {
        var url = request.id > 0 ? 'api/request/update' : 'api/request/create';
        return $http.post(url, request);
    };

    factory.approveRequest = function (request) {
        return $http.post('api/request/approve', request);
    };

    factory.approveSubject = function (id) {
        return $http.post('api/subject/approve/?id=' + id);
    };

    factory.createComment = function (comment) {
        return $http.post('api/request/createComment', comment);
    };

    factory.getStatuses = function () {
        return $http.get('api/request/statuses');
    };

    factory.getUploadUrl = function () {
        return 'api/request/upload';
    };

    factory.createComment = function (c) {
        return $http.post('api/request/createComment', c);
    };

    factory.getSettings = function () {
        return $q(function (resolve) {
            if (factory.settings == null)
                $http.get('api/settings').then(function (response) {
                    factory.settings = response.data;
                    resolve();
                });
            else
                resolve();

        });
    };    

    factory.getFileUrl = function (f) {
        if (f.file_id != null)
            return 'api/request/getTempUrl/?file_id=' + f.file_id;
        return 'api/request/getFile/?id=' + f.id;
    };

    return factory;
}]);


angular.module('app').factory('modalService', ['$uibModal', function ($uibModal) {
    var service = {};

    service.openDialog = function (message, title) {
        if (title == null)
            title = 'Poruka';

        var instance = $uibModal.open({
            templateUrl: '/templates/modal.html',
            controller: modalController,
            resolve: {
                params: function () {
                    return {
                        title: title,
                        message: message
                    };
                }
            }
        });

        return instance.result;
    }

    return service;

}]);

function modalController($uibModalInstance, $scope, params) {
    $scope.title = params.title;
    $scope.message = params.message;
    $scope.ok = function () {
        $uibModalInstance.close('ok');
    };

    $scope.cancel = function () {
        $uibModalInstance.close('cancel');
    }
}