'use strict';

import LocalStoragePersister from './persister/LocalStoragePersister';
import MockPersister from './persister/MockPersister';
import RequestIdGenerator from './RequestIdGenerator';
import AxiosSerializer from './serializer/AxiosSerializer';
import {RequestClientType} from './enums/RequestClientType';
import {Persister} from './interfaces/Persister';
import {AxiosInstance, AxiosRequestConfig} from 'axios';
import {SerializedRequest} from './types/SerializedRequest';
import {PersistenceTypes} from './enums/PersistenceType';
import {RequestManagerSettings} from './types/RequestManagerSettings';
import {TaggedAxiosRequestConfig} from './types/taggedRequests/TaggedAxiosRequestConfig';
import {AxiosRequestEnvelope} from './types/AxiosRequestEnvelope';

let REQUEST_MANAGER_INSTANCE: RequestManager | null = null;

export class RequestManager {
  private queue!: AxiosRequestEnvelope[];
  private persister!: Persister;
  public AXIOS_REQUEST_INTERCEPTOR_ID = -1;
  public AXIOS_RESPONSE_INTERCEPTOR_ID = -1;

  constructor(settings: RequestManagerSettings) {
    if (REQUEST_MANAGER_INSTANCE && !settings.resetRequestManager) {
      return REQUEST_MANAGER_INSTANCE;
    } else if (!REQUEST_MANAGER_INSTANCE && !settings.resetRequestManager) {
      throw new Error('Request manager not initialized!');
    }
    switch (settings.persistenceType) {
      case (PersistenceTypes.LOCAL_STORAGE): {
        this.persister = LocalStoragePersister;
        break;
      }
      case (PersistenceTypes.MOCK): {
        this.persister = MockPersister;
        break;
      }
      default: {
        throw new Error(`Persistence Type '${settings.persistenceType}' not found`);
      }
    }
    if (settings.loadFromStore) {
      this.loadQueueFromStore();
    } else {
      this.setCurrentQueue([]);
    }
    // need to do this to store the request manager locally
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    REQUEST_MANAGER_INSTANCE = this;
  }

  public getCurrentQueue() {
    return this.queue;
  }

  public setCurrentQueue(newQueue: AxiosRequestEnvelope[]) {
    this.queue = newQueue;
  }

  public async persistQueue() {
    const serializedQueue = await this.serializeQueue(this.queue);
    return this.persister.persistQueue(serializedQueue);
  }

  public loadQueueFromStore() {
    const persistedQueue = this.persister.fetchQueue();
    const deserializedQueue = this.deserializeQueue(persistedQueue);
    this.setCurrentQueue(deserializedQueue);
  }

  public async enqueueRequest(
      request: AxiosRequestConfig,
      requestClientType: RequestClientType,
  ): Promise<AxiosRequestEnvelope> {
    const taggedRequest = RequestIdGenerator.tagRequest(request, requestClientType);
    this.queue.push(taggedRequest);
    await this.persistQueue();
    return taggedRequest;
  }

  public async removeRequestById(requestId: string): Promise<AxiosRequestEnvelope | undefined> {
    // TODO: optimize this with binary search
    // findIndex / indexOf uses linear search by default,
    // see https://medium.com/@nathanbell09/binary-search-vs-indexof-63651f91acb7
    const requestIndexInQueue = this.queue.findIndex((taggedRequest) => taggedRequest.requestId === requestId);
    if (requestIndexInQueue === -1) {
      return;
    }

    const removedRequest = this.queue[requestIndexInQueue];

    this.setCurrentQueue(
        [...this.queue.slice(0, requestIndexInQueue), ...this.queue.slice(requestIndexInQueue + 1, this.queue.length)],
    );
    await this.persistQueue();

    return removedRequest;
  }

  public async resetCurrentStore() {
    this.setCurrentQueue([]);
    await this.persistQueue();
  }

  private async serializeQueue(requestEnvelopesQueue: AxiosRequestEnvelope[]): Promise<SerializedRequest[]> {
    return await Promise.all(
        requestEnvelopesQueue.map(
            (requestEnvelope) => AxiosSerializer.serializeRequest(requestEnvelope as AxiosRequestEnvelope),
        ),
    );
  }

  private deserializeQueue(persistedQueue: SerializedRequest[]): AxiosRequestEnvelope[] {
    return persistedQueue.map((serializedRequest) => {
      switch (serializedRequest.originalRequestClientType) {
        case RequestClientType.AXIOS: {
          return AxiosSerializer.deserializeRequest(serializedRequest);
        }
      }
    });
  }
}

export const mountAxiosInterceptor = (axiosInstance: AxiosInstance, requestManagerInstance: RequestManager) => {
  const requestInterceptorId = axiosInstance.interceptors.request.use(
      async (requestConfig: TaggedAxiosRequestConfig) => {
        const taggedRequest = await requestManagerInstance.enqueueRequest(requestConfig, RequestClientType.AXIOS);
        requestConfig.requestQueuePersistenceId = taggedRequest.requestId;
        return requestConfig;
      },
  );

  const responseInterceptorId = axiosInstance.interceptors.response.use(async (response) => {
    const taggedRequestConfig: TaggedAxiosRequestConfig = response.config;
    const requestId = taggedRequestConfig.requestQueuePersistenceId;
    if (!requestId) {
      return response;
    }
    await requestManagerInstance.removeRequestById(String(requestId));
    return response;
  });

  storeInterceptorIdsWithinModule({requestInterceptorId, responseInterceptorId});

  return {
    requestInterceptorId,
    responseInterceptorId,
  };
};

export const unmountAxiosInterceptor = (axiosInstance: AxiosInstance) => {
  if (!REQUEST_MANAGER_INSTANCE) {
    return;
  }
  axiosInstance.interceptors.request.eject(REQUEST_MANAGER_INSTANCE.AXIOS_REQUEST_INTERCEPTOR_ID);
  axiosInstance.interceptors.response.eject(REQUEST_MANAGER_INSTANCE.AXIOS_RESPONSE_INTERCEPTOR_ID);
  REQUEST_MANAGER_INSTANCE = null;
};

const storeInterceptorIdsWithinModule = (
    {requestInterceptorId, responseInterceptorId}: { requestInterceptorId: number, responseInterceptorId: number },
) => {
  if (!REQUEST_MANAGER_INSTANCE) {
    return;
  }
  REQUEST_MANAGER_INSTANCE.AXIOS_REQUEST_INTERCEPTOR_ID = requestInterceptorId;
  REQUEST_MANAGER_INSTANCE.AXIOS_RESPONSE_INTERCEPTOR_ID = responseInterceptorId;
};
