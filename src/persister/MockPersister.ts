import {Persister} from '../interfaces/Persister';
import {SerializedRequest} from '../types/SerializedRequest';

let MOCK_QUEUE: SerializedRequest[] = [];

class MockPersister implements Persister {
  fetchQueue(): SerializedRequest[] {
    return MOCK_QUEUE;
  }
  persistQueue(requests: SerializedRequest[]): void {
    MOCK_QUEUE = requests;
  }
}

export default new MockPersister();
