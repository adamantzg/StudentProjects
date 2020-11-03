import { ProjectRequest, RequestLog, RequestComment, Exam, ProjectWorkflow } from './domainclasses';

export class PasswordChange {
    id: string;
    code: string;
    password: string;
    password2: string;
}

export class Registration {
    registrationCode: string;
    username: string;
    password: string;
    password2: string;
    id: number;
}

export class LoginData {
    username: string;
    password: string;
}

export class RequestsData {
    requests: ProjectRequest[] = [];
    logs: RequestLog[] = [];
    workflows: ProjectWorkflow[] = [];
}

export class RequestData {
    request: ProjectRequest;
    comment: RequestComment;
    exam: Exam;
    log: RequestLog;

    constructor(r: ProjectRequest, l: RequestLog, c?: RequestComment, e?: Exam) {
        this.request = r;
        this.log = l;
        this.comment = c;
        this.exam = e;
    }
}

export class RequestEventData extends RequestData {
    event: string;

    constructor(e: string, r: ProjectRequest, l: RequestLog, c?: RequestComment) {
        super(r, l, c);
        this.event = e;
    }
}

export class ExamData {
    exam: Exam;
    log: RequestLog;
}

