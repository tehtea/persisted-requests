import {Method} from 'axios';
import {RequestClientType} from '../enums/RequestClientType';

export type SerializedRequest = {
    requestId: string
    originalRequestClientType: RequestClientType
    method: Method
    url: string
    httpVersion: HttpVersion
    cookies?: Cookie[]
    headers?: Header[]
    queryString?: string
    postData?: PostData
}

type Cookie = {
    name: string;
    value: string;
    path?: string;
    domain?: string;
    expires?: string;
    httpOnly?: boolean;
    secure?: boolean;
    comment?: string;
}

export type Header = {
    name: string;
    value: string;
    comment: string;
}

export type PostData = {
    rawData: string // this should be a valid JSON
    isFormData: boolean
}

type HttpVersion = '1.2'
