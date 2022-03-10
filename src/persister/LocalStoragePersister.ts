import {Persister} from '../interfaces/Persister';
import {SerializedRequest} from '../types/SerializedRequest';

class LocalStoragePersister implements Persister {
  private storageKeyPrefix: string = 'persistedQueue';

  fetchQueue(): SerializedRequest[] {
    const existingRequestsByKey = this.getRequestKeysFromLocalStorage();
    return existingRequestsByKey.map((existingRequestStorageKey) => {
      const stringifiedSerializedRequest = localStorage.getItem(existingRequestStorageKey) as string;
      const serializedRequest = JSON.parse(stringifiedSerializedRequest);
      return serializedRequest;
    });
  }

  persistQueue(newRequests: SerializedRequest[]): void {
    const existingRequestsByKey = this.getRequestKeysFromLocalStorage();
    this.cleanOutOldRequests(existingRequestsByKey);
    this.storeNewRequests(newRequests);
  }

  private storeNewRequests(newRequests: SerializedRequest[]): void {
    newRequests.map((request) => {
      const requestId = request.requestId;
      const stringifiedSerializedRequest = JSON.stringify(request);
      const storageKey = `${this.storageKeyPrefix}:${requestId}`;
      localStorage.setItem(storageKey, stringifiedSerializedRequest);
    });
  }

  private cleanOutOldRequests(existingRequestsByKey: string[]): void {
    existingRequestsByKey.map((existingRequestKey) => localStorage.removeItem(existingRequestKey));
  }

  private getRequestKeysFromLocalStorage(): string[] {
    const requestKeys: string[] = [];
    const localStorageSize = localStorage.length;
    for (let i = 0; i < localStorageSize; i++) {
      const currentKey = localStorage.key(i);
      if (currentKey?.startsWith(this.storageKeyPrefix)) {
        requestKeys.push(currentKey);
      }
    }
    return requestKeys;
  }
}

export default new LocalStoragePersister();
