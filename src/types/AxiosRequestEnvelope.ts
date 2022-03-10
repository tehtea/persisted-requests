import {RequestClientType} from '../enums/RequestClientType';
import {TaggedAxiosRequestConfig} from './taggedRequests/TaggedAxiosRequestConfig';

export type AxiosRequestEnvelope = {
    requestId: string
    requestClientType: RequestClientType.AXIOS
    rawRequest: TaggedAxiosRequestConfig
}
