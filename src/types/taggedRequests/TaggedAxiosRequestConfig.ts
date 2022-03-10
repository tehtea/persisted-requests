import {AxiosRequestConfig} from 'axios';

export type TaggedAxiosRequestConfig = AxiosRequestConfig & {
    requestQueuePersistenceId?: string
}
