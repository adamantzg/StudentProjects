angular.module('app')
.controller('indexCtrl', ['$scope','$location', 'factory',
function ($scope, $location,factory) {
    factory.getCurrentUser().then(
        function () {
            $scope.user = factory.user;
        },
        function () {
            location.href = '/login.html';
        }
    );

    $scope.logout = function () {
        factory.logout();
        location.href = '/login.html';
    };
}]);

var statuses = {
    RequestCreated:1,
    SubjectWaitingApproval:2,
    SubjectApproved:3,
    DatabaseWaitingApproval:4,
    DatabaseApproved:5,
    CodeWaitingApproval:6,
    CodeApprovedPendingExam:7,
    ExamTimeSlotDecided:8,
    FailedExam:9,
    PassedExam:10,
    SubjectRejected: 11,
    RequestCancelled: 12,
    RequestReinstated: 13
}

angular.module('app')
.controller('homeCtrl', ['$scope', '$location', '$uibModal','$q', 'factory','modalService',
function ($scope, $location, $uibModal,$q,factory,modalService) {
    $scope.subjects = [];
    $scope.availableCourses = [];
    factory.getSettings().then(function () {
        $scope.settings = factory.settings;
    });
    $scope.uploadLimit = factory.uploadLimit;
    $scope.$parent.$watch('user', function (user) {
        if(user != null)
        {
            
            factory.getRequestsForCurrentUser().then(function (response) {
                response.data.requests.forEach(function (r) {
                    r.dateDue = moment(r.dateDue).toDate();
                    r.dateCreated = moment(r.dateCreated).toDate();
                    r.dateApproved = moment(r.dateApproved).toDate();
                });
                $scope.requests = response.data.requests;
                response.data.log.forEach(function (l) {
                    l.dateCreated = moment(l.dateCreated).toDate();
                });
                $scope.log = response.data.log;
            },
            function (errResponse) {
                $scope.errorMessage = getErrorFromResponse(errResponse);
            }
            );

            if (!user.isAdmin)

                getAvailableCourses();
                getStatuses();

                factory.getSubjects(false).then(function (response) {
                    $scope.subjects = response.data;
                },
                function(errResponse)
                {
                    $scope.errorMessage = getErrorFromResponse(errResponse);
                }
                );
        }
    });

    function getAvailableCourses()
    {
        factory.getAvailableCoursesForRequest().then(function (response) {
            $scope.availableCourses = response.data;
        });
    }

    function getStatuses() {
        factory.getStatuses().then(function (response) {
            $scope.statuses = response.data;
        });
    }

    $scope.newRequest = function (subject) {
        var request = { subject: subject, statusId: statuses.SubjectWaitingApproval };
        if ($scope.availableCourses.length == 1)
            request.courseId = $scope.availableCourses[0].id;
        if (subject != null)
            request.subjectId = subject.id;
        var instance = $uibModal.open({
            templateUrl: '/templates/request.html',
            controller: requestModalController,
            resolve: {
                params: function () {
                    return {
                        request: request,
                        title: 'Prijavi temu',
                        loggedinUser: factory.user,
                        courses: $scope.availableCourses,
                        okText: 'Prijavi'
                    };
                }
            }
        });
        instance.result.then(function (data) {
            var request = data;
            if (request != null) {
                $scope.requests.push(request);
                getAvailableCourses();
            }

        });
        
    };

    $scope.cancelRequest = function (r) {
        modalService.openDialog('Želite li poništiti prijavu teme ' + getSubjectName(r) + ' za predmet ' + r.course.name + '?' ).then(function (response) {
            if (response == 'ok') {
                factory.cancelRequest(r.id).then(function (response) {
                    r.status = response.data;
                    r.statusId = response.data.id;
                    getAvailableCourses();
                },
                    function (errResponse) {
                        $scope.errorMessage = getErrorFromResponse(errResponse);
                    });
            }
        });
    };
        
    $scope.refreshRequest = function (r) {
        modalService.openDialog('Želite li ponovno aktivirati prijavu teme ' + getSubjectName(r) + ' za predmet ' + r.course.name + '?').then(function (response) {
            if (response == 'ok') {
                factory.refreshRequest(r.id).then(function (response) {
                    r.status = response.data;
                    r.statusId = response.data.id;
                    getAvailableCourses();
                },
                    function (errResponse) {
                        $scope.errorMessage = getErrorFromResponse(errResponse);
                    });
            }
        });
    };

    $scope.approveRequest = function (r) {
        showApproveDialog(r,'Odobri temu', statuses.SubjectApproved, 'Odobri');
    };

    $scope.rejectRequest = function (r) {
        showChangeStatusDialog(r, 'Odbij temu', statuses.SubjectRejected, 'Odbij');
    };

    $scope.changeSubject = function (r) {
        var instance = $uibModal.open({
            templateUrl: '/templates/changesubject.html',
            controller: changeSubjectModalController,
            resolve: {
                params: function () {
                    return {
                        request: r,
                        title: 'Promijeni temu',
                        subjects: $scope.subjects,
                        loggedinUser: factory.user
                    };
                }
            }
        });
        instance.result.then(function (data) {
            var request = data.request;
            if (request != null) {
                r.subjectId = request.subjectId;
                r.subjectText = request.subjectText;
                r.subject = request.subject;
                r.status = request.status;
                r.comment = request.comment;
                addLog(data.log);
            }

        });
    };

    $scope.addComment = function (r) {

    };

    $scope.createComment = function (c) {
        var comment = angular.copy(c);
        comment.requestId = comment.request.id;
        comment.request = null;
        factory.createComment(comment).then(function (response) {
            addLog(response.data);
            var request = _.find($scope.requests, { id: response.data.comment.requestId });
            if (request != null)
                request.status = response.data.comment.request.status;
            c.text = '';
            c.databaseSent = false;
            c.codeSent = false;
            c.files = [];
        });
    };

    $scope.editRequest = function (r) {

        getSubjects().then(function () {
            var instance = $uibModal.open({
                templateUrl: '/templates/request.html',
                controller: requestModalController,
                resolve: {
                    params: function () {
                        return {
                            request: r,
                            title: 'Uredi prijavu',
                            loggedinUser: factory.user,
                            courses: factory.user.administeredCourses,
                            statuses: $scope.statuses,
                            subjects: $scope.subjects,
                            okText: 'Spremi'
                        };
                    }
                }
            });
            instance.result.then(function (data) {
                
                if (data != null) {
                    var request = data.request;
                    r.subject = request.subject;                    
                    r.subjectId = request.subjectId;
                    r.subjectText = request.subjectText;
                    r.course = request.course;
                    r.courseId = request.courseId;
                    r.statusId = request.statusId;
                    r.dateDue = moment(request.dateDue).toDate();
                    r.status = request.status;
                    addLog(data.log);
                }
                

            });
        });
        
        
    };

    function addLog(log)
    {
        log.dateCreated = moment(log.dateCreated).toDate();
        $scope.log.splice(0, 0, log);
    }

    function getSubjects() {
        return $q(function (resolve) {
            if ($scope.subjects == null)
                factory.getSubjects().then(function (response) {
                    $scope.subjects = response.data;
                    resolve();
                });
            else
                resolve();
        });
    };

    function showChangeStatusDialog(request,title, statusId, okText) {
        var instance = $uibModal.open({
            templateUrl: '/templates/comment.html',
            controller: changeStatusModalController,
            resolve: {
                params: function () {
                    return {
                        request: request,
                        statusId: statusId,
                        title: title,
                        okText: okText,
                        loggedinUser: factory.user
                    };
                }
            }
        });
        instance.result.then(function (result) {
            var r = result.request;
            if (r.status != null) {
                request.status = r.status;
                request.statusId = r.status.id;
                request.subject = r.subject;
                if (r.subject != null)
                    request.subjectId = r.subject.id;
                if (r.comment != null)
                {
                    if (request.comments == null)
                        request.comments = [];
                    request.comments.push(r.comment);
                }
                addLog(result.log);
            }

        });
    };

    function showApproveDialog(request, title, statusId, okText) {
        var instance = $uibModal.open({
            templateUrl: '/templates/approve.html',
            controller: approveModalController,
            resolve: {
                params: function () {
                    return {
                        request: request,
                        title: title,
                        subjects: $scope.subjects,
                        okText: okText,
                        loggedinUser: factory.user
                    };
                }
            }
        });
        instance.result.then(function (result) {
            if (result != null) {
                var r = result.request;
                request.status = r.status;
                request.statusId = r.status.id;
                request.subject = r.subject;
                if (r.subject != null)
                    request.subjectId = r.subject.id;
                if (r.comments != null) {                    
                    request.comments.push(r.comments[0]);
                }
                addLog(result.log);
            }

        });
    };

    $scope.checkButtonVisible = function (r, type) {
        var statusList;
        var exclude = true;
        switch (type)
        {
            case 'cancel':
                statusList = [statuses.ExamTimeSlotDecided, statuses.RequestCancelled, statuses.PassedExam];
                break;
            case 'refresh':
                return r.statusId == statuses.RequestCancelled;                
            case 'approve':
            case 'reject':
                statusList = [statuses.RequestCreated, statuses.RequestReinstated, statuses.SubjectWaitingApproval];
                exclude = false;
                break;
            case 'changeSubject':
                statusList = [statuses.SubjectWaitingApproval, statuses.RequestCreated];
                exclude = false;
                break;
            case 'upload':
                statusList = [statuses.RequestCreated, statuses.RequestReinstated, statuses.SubjectWaitingApproval, statuses.RequestCancelled, statuses.SubjectRejected];                
                break;
        }
        return exclude ? statusList.indexOf(r.statusId) < 0 : statusList.indexOf(r.statusId) >= 0;
    };

    $scope.formatDate = function (date, format) {
        return formatDate(date, format);
    };

    

    function getSubjectName(r)
    {
        return r.subject != null ? r.subject.name : r.subjectText;
    }
}]);

var messageDeleteRecord = 'Obrisati zapis?';

angular.module('app')
.controller('usersCtrl', ['$scope', '$location', '$uibModal','$state','factory','modalService',
function ($scope, $location, $uibModal, $state, factory,modalService) {
        
    $scope.groups = [];
    $scope.all = { checked: false };

    $scope.dtOptions = {
        pageLength: 50
    }

    $scope.$parent.$watch('user', function (user) {
        if (user != null)
        {
            if (!factory.user.isAdmin)
                location.href = '/index.html';
            factory.getGroups().then(function (response) {
                $scope.groups = response.data;
                $scope.courses = factory.user.administeredCourses;
                prepareUserCourses($scope.groups);
                if ($scope.groups.length > 0)
                    $scope.group = $scope.groups[0];
            });
        }
        
    });
        

    $scope.newUser = function () {
        var instance = $uibModal.open({
            templateUrl: '/templates/user.html',
            controller: userModalController,
            resolve: {
                params: function () {
                    return {
                        user: factory.newUser($scope.group.id),
                        title: 'Kreiraj novog korisnika',
                        loggedinUser : factory.user
                    };
                }
            }
        });

        instance.result.then(function (user) {
            if (user != null)
            {
                $scope.group.users.push(user);
                user.courses = [];
                $scope.user = user;
            }
            
        });
    };

    $scope.sendCode = function(user)
    {
        sendCodes([user.UserId]);
    }

    $scope.sendCodes = function () {
        sendCodes(_.map(_.filter($scope.group.users, { selected: true }),'id'));
    };

    $scope.formatDate = function(date)
    {
        return formatDate(date);        
    }

    function sendCodes(userIds)
    {
        factory.sendCodes(userIds).then(function (response) {
            $scope.successMessage = response.data;
        },
        function (errResponse) {
            $scope.errorMessage = errResponse.data.ExceptionMessage;
        });
    }

    $scope.usersSelected = function () {
        if($scope.group != null)
            return _.filter($scope.group.users, { selected: true }).length > 0;
        return false;
    };

    $scope.checkAll = function () {
        if ($scope.group != null)
            $scope.group.users.forEach(function (u) {
                u.selected = $scope.all.checked;
            });
    };

    $scope.editUser = function (u) {
        var instance = $uibModal.open({
            templateUrl: '/templates/user.html',
            controller: userModalController,
            resolve: {
                params: function () {
                    return {
                        user: u,
                        title: 'Uredi podatke',
                        loggedinUser: factory.user
                    };
                }
            }
        });

        instance.result.then(function (user) {
            if (user != null) {
                u.name = user.name;
                u.surname = user.surname;
                u.email = user.email;
                u.username = user.username;
                u.registrationCode = user.registrationCode;
            }
        });
    };

    if ($state.current.name == 'userdata')
    {
        $scope.user = angular.copy(factory.user);
        $scope.title = 'Korisničke informacije'
        $scope.ok = function () {
            factory.updatePassword({ id: $scope.user.id, password: $scope.user.password, password2: $scope.user.password2 }).then(function () {
                factory.updateUser($scope.user).then(function (response) {
                    $state.go('home');
                },
                function (errResponse) {
                    $scope.errorMessage = errResponse.data;
                });
            },
            function (errResponse) {
                $scope.errorMessage = errResponse.data;
            });            
        };

        $scope.cancel = function () {
            $state.go('home');
        }
    }

    function prepareUserCourses(groups)
    {
        groups.forEach(function (g) {
            g.users.forEach(function (u) {
                prepareCourse(u);
            });
        });
    }
    function prepareCourse(u)
    {
        if (factory.user.administeredCourses != null) {
            u.coursesDict = {}
            factory.user.administeredCourses.forEach(function (c) {
                u.coursesDict[c.id] = _.find(u.courses, { id: c.id }) != null;
            });
        }
    }

    $scope.updateUserCourse = function (user, course) {
        factory.updateUserCourse(user.id, course.id, !user.coursesDict[course.id]);
    };

    $scope.delete = function(user)
    {
        modalService.openDialog(messageDeleteRecord).then(function (response) {
            if(response == 'ok')
            {
                factory.deleteUser(user.id).then(function (response) {
                    _.remove($scope.group.users, { id: user.id });
                },
            function (errResponse) {
                $scope.errorMessage = getErrorFromResponse(errResponse);
            });
            }
        });
        
    }
    
        }]);

angular.module('app')
    .controller('subjectsCtrl', ['$scope', '$location','$uibModal', 'factory','modalService',
        function ($scope, $location,$uibModal, factory,modalService) {
            factory.getSubjects().then(function (response) {
                
                $scope.subjects = response.data;
            },
            function (errResponse) {
                $scope.errorMessage = getErrorFromResponse(errResponse);
            }
            );

            $scope.formatDate = function (d) {
                return formatDate(d);
            };

            $scope.addNew = function () {
                var instance = $uibModal.open({
                    templateUrl: '/templates/subject.html',
                    controller: subjectModalController,
                    resolve: {
                        params: function () {
                            return {
                                subject: factory.newSubject(),
                                title: 'Kreiraj novu temu',
                                courses: factory.user.administeredCourses
                            };
                        }
                    }
                });

                instance.result.then(function (subject) {
                    if (subject != null) {
                        $scope.subjects.push(subject);                                                
                    }

                });
            };

            $scope.edit = function (s) {
                var instance = $uibModal.open({
                    templateUrl: '/templates/subject.html',
                    controller: subjectModalController,
                    resolve: {
                        params: function () {
                            return {
                                subject: s,
                                title: 'Uredi podatke',
                                courses: factory.user.administeredCourses
                            };
                        }
                    }
                });

                instance.result.then(function (subject) {
                    if (subject != null) {
                        s.name = subject.name;
                        s.description = subject.description;
                        s.courseId = subject.courseId;
                    }
                });
            };

            $scope.delete = function (subject) {
                modalService.openDialog(messageDeleteRecord).then(function (response) {
                    if (response == 'ok') {
                        factory.deleteSubject(subject.id).then(function (response) {
                            _.remove($scope.subjects, { id: subject.id });
                        },
                    function (errResponse) {
                        $scope.errorMessage = getErrorFromResponse(errResponse);
                    });
                    }
                });

            }

            $scope.approve = function (subject) {
                modalService.openDialog('Odobriti temu?').then(function (response) {
                    if (response == 'ok') {
                        factory.approveSubject(subject.id).then(function (response) {
                            subject.dateApproved = response.data.dateApproved;
                            subject.approvedById = response.data.approvedById;
                            subject.approvedBy = response.data.approvedBy;
                        },
                            function (errResponse) {
                                $scope.errorMessage = getErrorFromResponse(errResponse);
                            });
                    }
                });
            };

            $scope.getCourses = function (s) {
                return _.map(s.courses, 'shortname').join(',');
            };
        }]);

angular.module('app')
    .controller('requestCtrl', ['$scope', '$location', '$uibModal', 'factory', 'modalService',
        function ($scope, $location, $uibModal, factory, modalService) {
 }]);

function userModalController($uibModalInstance, $scope, params, factory)
{
    $scope.user = angular.copy(params.user);
    $scope.title = params.title;
    $scope.loggedinUser = params.loggedinUser;

    $scope.ok = function () {        
        factory.updateUser($scope.user).then(function (response) {
            $uibModalInstance.close(response.data);
        },
        function (errResponse) {
            $scope.errorMessage = errResponse.data;
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }

    $scope.checkUsername = function () {
        $scope.userNameError = '';
        $scope.userNameSuccess = '';
        
        factory.checkUsername($scope.user.id, $scope.user.username).then(function (response) {
            $scope.userNameSuccess = response.data;
        },
        function (errResponse) {
            $scope.userNameError = errResponse.data;
        });
    };

    $scope.generateCode = function() {
        factory.generateCode().then(function (response) {
            $scope.user.registrationCode = response.data;
        },
        function (errResponse) {
            $scope.errorMessage = errResponse.data.ExceptionMessage;
        });
    };
    
}

function subjectModalController($uibModalInstance, $scope, params, factory) {
    $scope.subject = angular.copy(params.subject);
    $scope.title = params.title;
    $scope.courses = angular.copy(params.courses);
    //$scope.courses.splice(0, 0, { id: null, name: '<Bilo koji>' });
    $scope.courses.forEach(function (c) {
        c.selected = _.find($scope.subject.courses, { id: c.id }) != null;
    });
    
    $scope.ok = function () {
        $scope.subject.courses = _.map(_.filter($scope.courses, { selected: true }), function (elem) {
            return { id: elem.id };
        });
        factory.updateSubject($scope.subject).then(function (response) {
            $uibModalInstance.close(response.data);
        },
        function (errResponse) {
            $scope.errorMessage = getErrorFromResponse(errResponse);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }   

}

function requestModalController($uibModalInstance, $scope, params, factory)
{
    $scope.request = angular.copy(params.request);
    
    $scope.title = params.title;
    $scope.courses = params.courses;
    $scope.popup = { due: false };
    $scope.user = params.loggedinUser;
    $scope.statuses = params.statuses;
    $scope.subjects = params.subjects;
    $scope.okText = params.okText;
    $scope.dateOptions = {
        dateFormat: 'dd.MM.yyyy'
    };

    $scope.comment = { text: '' };
    
    //if (params.subject == null)
    //    $scope.request.subjectText = '';

    $scope.open = function (picker) {
        $scope.popup[picker] = !$scope.popup[picker];
    };
            
    $scope.ok = function () {
        var data = angular.copy($scope.request);
        data.comments = [];
        if ($scope.comment.text.length > 0)
        {
            data.comments.push($scope.comment);
        }
        data.subject = null;
        
        factory.updateRequest(data).then(function (response) {
            $uibModalInstance.close(response.data);
        },
        function (errResponse) {
            $scope.errorMessage = getErrorFromResponse(errResponse);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }

}

function changeSubjectModalController($uibModalInstance, $scope, params, factory)
{
    $scope.request = angular.copy(params.request);
    $scope.subjects = _.filter(params.subjects, function (elem) {
        return elem.id != $scope.request.subjectId;
    });
    $scope.selection = { type: '1' };
    $scope.title = params.title;
    
    

    $scope.ok = function () {
        if ($scope.selection.type == '1')
            $scope.request.subjectText = '';
        else
            $scope.request.subjectId = null;
        $scope.request.statusId = statuses.SubjectWaitingApproval;
        $scope.request.comments = [];
        $scope.request.comments.push({ text: $scope.request.comment });
        factory.updateRequest($scope.request).then(function (response) {
            $uibModalInstance.close(response.data);
        },
        function (errResponse) {
            $scope.errorMessage = getErrorFromResponse(errResponse);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }
}

function changeStatusModalController($uibModalInstance, $scope, params, factory) {
    $scope.request = angular.copy(params.request);
    $scope.title = params.title;
    $scope.okTitle = params.okTitle;
    if (!$scope.okText)
        $scope.okText = 'Potvrdi';
    $scope.comment = { requestId: $scope.request.id, text: '' };           
    
    $scope.ok = function () {
        
        factory.setStatus($scope.request.id, params.statusId, $scope.comment).then(function (response) {
            var result = { status: response.data.status, comment: response.data.comment };
            $uibModalInstance.close(result);
        },
        function (errResponse) {
            $scope.errorMessage = getErrorFromResponse(errResponse);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }
}

function approveModalController($uibModalInstance, $scope, params, factory) {
    $scope.request = angular.copy(params.request);
    $scope.title = params.title;
    $scope.okText = params.okText;
    $scope.subjects = params.subjects;
    $scope.select = { addSubject: false };

    if (!$scope.okText)
        $scope.okText = 'Potvrdi';
    $scope.comment = { requestId: $scope.request.id, text: '' };    
    
    $scope.ok = function () {
        $scope.request.comments = [];
        if ($scope.select.addSubject)
            $scope.request.subject = { name: $scope.request.subjectText, description: $scope.request.comment };
        if ($scope.comment.text.length > 0)
        {
            $scope.request.comments.push($scope.comment);
        }
        factory.approveRequest($scope.request).then(function (response) {
            $uibModalInstance.close(response.data);
        },
        function (errResponse) {
            $scope.errorMessage = getErrorFromResponse(errResponse);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.close();
    }
}





function formatDate(date,format)
{
    if (format == null)
        format = 'DD.MM.YYYY HH:mm';
    return moment(date).format(format);
}

function getErrorFromResponse(response)
{
    if (response.data.ExceptionMessage)
        return response.data.ExceptionMessage;
    return response.data;
}



