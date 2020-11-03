angular.module('app').component('subjectList', {
    templateUrl: '/templates/components/subjectList.html',
    controller: subjectListController,
    bindings: {
        subjects: '=',
        onRequest: '&',
        freeOnly: '<'
    }
});

function subjectListController($scope) {
    var ctrl = this;

    if (ctrl.freeOnly == null)
        ctrl.freeOnly = true;

    ctrl.test = function (s) {
        ctrl.onRequest(s);
    };

}

angular.module('app').component('shortenedText', {
    templateUrl: '/templates/components/shortenedText.html',
    controller: shortenedTextController,
    bindings: {
        text: '<',        
        position: '<',
        showText: '<',
        hideText: '<',
        showLink: '<',
        showTooltip: '<'
    }
});

function shortenedTextController() {
    var ctrl = this;

    ctrl.$onInit = function () {
        if (ctrl.position == null)
            ctrl.position = 80;
        if (ctrl.showText == null)
            ctrl.showText = 'Više';
        if (ctrl.hideText == null)
            ctrl.hideText = 'Manje';
        if (ctrl.showLink == null)
            ctrl.showLink = true;
        if (ctrl.showTooltip == null)
            ctrl.showTooltip = true;

        ctrl.displayedText = '';
        ctrl.linkText = '';
        ctrl.textShownFull = false;

        if (ctrl.text.length > ctrl.position) {
            ctrl.displayedText = ctrl.text.substring(0, ctrl.position) + '...';
            ctrl.linkText = ctrl.showText;
        }

        else {
            ctrl.displayedText = ctrl.text;
        }

        if (ctrl.showTooltip && ctrl.text.length > ctrl.position)
            ctrl.toolTip = ctrl.text;
        else
            ctrl.toolTip = ''
    };
        

    ctrl.linkClick = function()
    {
        if(!ctrl.textShownFull)
        {
            ctrl.displayedText = ctrl.text;
            ctrl.linkText = ctrl.hideText;            
        }
        else
        {
            ctrl.displayedText = ctrl.text.substring(0, ctrl.position) + '...';
            ctrl.linkText = ctrl.showText;
        }
        ctrl.textShownFull = !ctrl.textShownFull;
    }
        
}

angular.module('app').component('activitiesList', {
    templateUrl: '/templates/components/activities.html',
    controller: ['$scope','factory',activityListController],
    bindings: {
        activities: '=',
        user: '='
    }
});

function activityListController($scope,factory) {
    var ctrl = this;

    ctrl.getFileUrl = function (f) {
        return factory.getFileUrl(f);
    };

}

angular.module('app').component('newComment', {
    templateUrl: '/templates/components/newComment.html',
    controller: ['$scope','$timeout', 'factory',commentController],
    bindings: {
        requests: '<',
        uploadLimit: '<',
        user: '<',
        onCreate: '&'
    }
});

function commentController($scope,$timeout, factory) {
    var ctrl = this;

    ctrl.$onInit = function () {

        ctrl.uploadSettings = {
            url: factory.getUploadUrl(),
            options: {
                multi_selection: true,
                max_file_size: '20mb',
            filters: [
                
            ]
            },
            callbacks: {
                filesAdded: function (uploader, files) {
                    ctrl.uploader = uploader;

                    files.forEach(function (elem) {
                        if (ctrl.files == null)
                            ctrl.files = [];
                        ctrl.files.push(elem);
                    });
                    $timeout(function () {
                        uploader.start();
                    }, 1);
                },
                uploadProgress: function (uploader, file) {
                    var f = _.find(ctrl.files, { id: file.id });
                    if (f != null)
                        f.progress = file.percent;
                },
                beforeUpload: function (uploader, file) {
                    uploader.settings.multipart_params = { id: file.id };
                },
                fileUploaded: function (uploader, file, response) {
                    if (ctrl.comment != null) {
                        var f = _.find(ctrl.files, { id: file.id });
                        if (f != null)
                            f.progress = 100;
                        if (ctrl.comment.files == null)
                            ctrl.comment.files = [];
                        ctrl.comment.files.push({ name: file.name, file_id: file.id });
                        if (_.every(ctrl.files, { progress: 100 }))
                            ctrl.files = [];
                    }
                },
                error: function (uploader, error) {

                    alert(error.message);
                }
            }
        };

        ctrl.comment = {
            text: ''
        }
        ctrl.sendDb = false;
        ctrl.sendCode = false;

        ctrl.showCheckBox = function (what) {
            if (ctrl.comment.request != null)
            {
                var s = ctrl.comment.request.statusId;
                if (what == 'db') {
                    return s == statuses.SubjectApproved;
                }
                if (what == 'code')
                    return s == statuses.DatabaseApproved;
            }            
            return false;
        };

        ctrl.getFileUrl = function (f) {
            return factory.getFileUrl(f);
        };

        ctrl.removeFile = function (f) {
            _.remove(ctrl.comment.files, { file_id: f.file_id });
        };
    };

    ctrl.$onChanges = function (changesObj) {
        if (ctrl.requests != null)
        {
            ctrl.requests.forEach(function (r) {
                r.description = (r.subject != null ? r.subject.name : r.subjectText) + ' (' + r.course.shortname + ')';
                if (ctrl.user.isAdmin)
                    r.description += ', ' + r.createdBy.name + ' ' + r.createdBy.surname;

            });

            if (ctrl.requests.length > 0)
                ctrl.comment.request = ctrl.requests[0];
        }
        
    };
    

}