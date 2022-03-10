import {SerializedRequest} from '../types/SerializedRequest';

export interface Persister {
    fetchQueue(): SerializedRequest[]
    persistQueue(requests: SerializedRequest[]): void
}
