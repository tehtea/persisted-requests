import axios, {AxiosInstance} from 'axios';
import {mountAxiosInterceptor, RequestManager} from '../src/index';
import {PersistenceTypes} from '../src/enums/PersistenceType';


const BASE_URL = `https://jsonplaceholder.typicode.com`;

describe('End-to-end tests - make sure the request to a ' +
  'real server can be replayed', () => {
  afterEach(async () => {
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    requestManagerInstance.resetCurrentStore();
  });

  beforeAll(() => {
    // set 1.5 mins timeout per test for real server tests
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 90000;
    localStorage.clear();
  });

  it('Works for a POST operation', async () => {
    const requestData = {
      title: 'foo',
      body: 'bar',
      userId: 1,
    };
    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    applyRequestInterceptorToPreventRequest(mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    try {
      await mountedAxiosInstance.post('posts', requestData);
    } catch (error) {
      // error is expected because of the interceptor
    }

    // persist and load again from store, to make sure serialization cycle works
    await requestManagerInstance.persistQueue();
    requestManagerInstance.loadQueueFromStore();

    // wait 20 seconds, CORS error shows up sometimes after delay
    return new Promise<void>((res) =>
      setTimeout(async () => {
        const queuedRequest = requestManagerInstance.getCurrentQueue()[0].rawRequest;
        const responseWithMountedInstance = await axios.request(queuedRequest);
        expect(responseWithMountedInstance.status).toEqual(201);
        res();
      }, 20000),
    );
  });
});

/**
 * Apply an interceptor prevents the request from being fired
 * @param requestManagerInstance {RequestManager}
 * @param axiosInstance {AxiosInstance}
 * @return {number}
 */
const applyRequestInterceptorToPreventRequest = (axiosInstance: AxiosInstance) => {
  const requestInterceptorForMountedTests = axiosInstance.interceptors.request.use(async (requestConfig) => {
    return {};
  });

  return requestInterceptorForMountedTests;
};
