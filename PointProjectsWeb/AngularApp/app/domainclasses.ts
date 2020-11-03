export class User {
    id: number;
    name: string;
    surname: string;
    username: string;
    password: string;
    password2: string;
    email: string;
    registrationCode: string;
    dateCodeSent: Date | null;
    administeredCourses: Course[] = [];
    enrolledCourses: Course[] = [];
    availableCourses: Course[] = [];
    isAdmin: boolean;
    coursesDict: any = {};
    selected: boolean;
    token: string;
    groups: UserGroup[];

}

export class Group {
    id: number;
    name: string;
    users: User[] = [];
}

export class UserGroup {
    groupId: number;
    userId: number;
    group: Group;
    user: User;
}

export class Course {
    id: number;
    name: string;
    shortname: string;
    selected: boolean;
}

export class Subject {

    id: number;
    name: string;
    description: string;
    createdById: number | null;
    createdBy: User;
    approvedBy: User;
    approvedById: number | null;
    dateCreated: Date | null;
    dateApproved: Date | null;
    courses: Course[];
    requestCount: number;
    approvedRequestCount: number;
}

export class RequestStatus {
    id: number;
    name: string;
    requestStatusChangeText: string;
    seq: number;

    courses: Course[];
}

export enum RequestStatusId {
    RequestCreated= 1,
    SubjectWaitingApproval= 2,
    SubjectApproved= 3,
    DatabaseWaitingApproval= 4,
    DatabaseApproved= 5,
    CodeWaitingApproval= 6,
    CodeApprovedPendingExam= 7,
    ExamTimeSlotDecided= 8,
    FailedExam= 9,
    PassedExam= 10,
    SubjectRejected = 11,
    RequestCancelled = 12,
    RequestReinstated = 13,
    SpecificationWaitingApproval = 14,
    SpecificationApproved = 15
}

export class ProjectRequest {
    id: number;
    courseId: number;
    course: Course;
    subjectId: number | null;
    subjectText: string;
    subject: Subject;
    createdById: number | null;
    createdBy: User;
    approvedBy: User;
    approvedById: number | null;
    dateCreated: Date | null;
    dateApproved: Date | null;
    dateDue: Date | null;
    dateClosed: Date | null;
    statusId: number;
    status: RequestStatus;
    comment: string;
    comments: RequestComment[];
    description: string;
    examDateTime: Date | null;
    examRequests: ExamRequest[];
}

export class RequestComment {
    id: number;
    requestId: number;
    request: ProjectRequest;
    statusChange: boolean | null;

    text: string;
    createdById: number | null;
    createdBy: User;
    dateCreated: Date | null;
    files: CommentFile[];

}

export class CommentFile {
    id: number;
    commentId: number;
    comment: RequestComment;
    name: string;
    data: number[];
    file_id: string;
}

export class RequestLog {
    id: number;
    requestId: number;
    request: ProjectRequest;
    commentId: number | null;
    description: string;
    createdById: number | null;
    createdBy: User;
    requestStatusId: number | null;
    dateCreated: Date | null;
    requestChanged: boolean | null;

    comment: RequestComment;
}

export class Exam {
        id: number;
        name: string;
        examDateTime: Date | null;
        courseId: number | null;
        course: Course;
        requests: ExamRequest[];
        createdById: number;
        createdBy: User;
        dateCreated: Date;

        constructor() {
            // this.examDateTime = new Date();
            // this.examDateTime.setMinutes(0);
        }
    }

    export class ExamRequest {
        examId: number;
        requestId: number;
        dateApplied: Date | null;
        dateCancelled: Date | null;
        attended: boolean | null;
        grade: number | null;
        description: string;
        exam: Exam;
        request: ProjectRequest;
    }

    export class ProjectWorkflow  {
        courseId: number | null;
        statusId: number | null;
        nextStatusId: number | null;
        requestStatusChangeText: string;
        isStart: boolean | null;
    }
