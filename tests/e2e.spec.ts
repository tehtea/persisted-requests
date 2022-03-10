import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import {mountAxiosInterceptor, RequestManager, unmountAxiosInterceptor} from '../src/index';
import {PersistenceTypes} from '../src/enums/PersistenceType';
import {AxiosRequestEnvelope} from '../src/types/AxiosRequestEnvelope';


const BASE_URL = `https://localhost:29126`;

describe('End-to-end tests - make sure: ' +
    'a mounted instance should behave in the same way as a non-mounted one, ' +
    'and the queue should still work after persisting and loading it back again', () => {
  beforeEach(() => {
    const urlRegex = /https:\/\/localhost:29126.*/;
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(
        urlRegex,
    ).andReturn({
      status: 200,
      statusText: 'HTTP/1.1 200 OK',
      contentType: 'application/json;charset=UTF-8',
      responseText: '{ "status": "done" }',
    });
  });

  afterEach(async () => {
    jasmine.Ajax.uninstall();
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    requestManagerInstance.resetCurrentStore();
  });

  beforeAll(() => {
    localStorage.clear();
  });

  it('Works for a DELETE operation with custom headers', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const additionalRequestConfig = {
      headers: {
        someCustomHeader: 'b'.repeat(3),
      },
    };

    await unmountedAxiosInstance.delete('posts', additionalRequestConfig);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);

    await mountedAxiosInstance.delete('posts', additionalRequestConfig);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.delete('posts', additionalRequestConfig);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a GET operation with query parameters passed as object', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const additionalRequestConfig: AxiosRequestConfig = {
      params: {
        varX: [120, 150],
      },
    };
    await unmountedAxiosInstance.get('posts', additionalRequestConfig);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.get('posts', additionalRequestConfig);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.get('posts', additionalRequestConfig);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a GET operation with query parameters passed as URLSearchParams', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const pojoParams = new URLSearchParams([['varX', '123'], ['varX', '456'], ['varY', 'abc']]);
    const additionalRequestConfig: AxiosRequestConfig = {
      params: pojoParams,
    };
    await unmountedAxiosInstance.get('posts', additionalRequestConfig);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.get('posts', additionalRequestConfig);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.get('posts', additionalRequestConfig);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a POST operation with stringified urlEncoded data', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const postDataRaw = new URLSearchParams();
    postDataRaw.append('varX', '100');
    postDataRaw.append('varY', '69');
    const postData = postDataRaw.toString();
    await unmountedAxiosInstance.post('posts', postData);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.post('posts', postData);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.post('posts', postData);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a POST operation with urlEncoded data', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const postData = new URLSearchParams();
    postData.append('varX', '100');
    postData.append('varY', '69');
    await unmountedAxiosInstance.post('posts', postData);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.post('posts', postData);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.post('posts', postData);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a POST operation with JSON data', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const postData = {
      'title': 'Hello World',
      'description': 'Lorem Ipsum',
    };
    await unmountedAxiosInstance.post('posts', postData);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });
    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.post('posts', postData);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.post('posts', postData);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });

  it('Works for a POST operation with multipart formData', async () => {
    const unmountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });

    const postData = new FormData();
    const postFile = new File(['0xfff'], 'rickroll.gif');
    postData.append('someValue', 'lalala');
    postData.append('myFile', postFile);

    const postConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    await unmountedAxiosInstance.post('posts', postData, postConfig);
    const originalRequest = jasmine.Ajax.requests.mostRecent();

    const mountedAxiosInstance = axios.create({
      baseURL: BASE_URL,
      responseType: 'json',
    });

    const requestManagerInstance: RequestManager = new RequestManager({
      persistenceType: PersistenceTypes.LOCAL_STORAGE,
      loadFromStore: true,
      resetRequestManager: true,
    });
    const requestInterceptorForMountedTests =
      applyRequestInterceptorForTesting(requestManagerInstance, mountedAxiosInstance);
    mountAxiosInterceptor(mountedAxiosInstance, requestManagerInstance);
    await mountedAxiosInstance.post('posts', postData);

    const requestWithMountedInstance = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestWithMountedInstance, originalRequest);
    assertQueueState(requestManagerInstance, []);

    unmountAxiosInterceptor(mountedAxiosInstance);
    mountedAxiosInstance.interceptors.request.eject(requestInterceptorForMountedTests);
    await mountedAxiosInstance.post('posts', postData);

    const requestAfterUnmount = jasmine.Ajax.requests.mostRecent();
    assertRequestsEquality(requestAfterUnmount, originalRequest);
    assertQueueState(requestManagerInstance, []);
  });
});

/**
 * Apply an interceptor that applies assertions and re-loads the queue before the request is fired.
 * @param requestManagerInstance {RequestManager}
 * @param axiosInstance {AxiosInstance}
 * @return {number}
 */
const applyRequestInterceptorForTesting = (requestManagerInstance: RequestManager, axiosInstance: AxiosInstance) => {
  const requestInterceptorForMountedTests = axiosInstance.interceptors.request.use(async (requestConfig) => {
    const currentQueue = requestManagerInstance.getCurrentQueue();
    expect(currentQueue.length).toBe(1);
    const queuedRequest = currentQueue[0];
    expect(queuedRequest.rawRequest).toEqual(requestConfig);

    await requestManagerInstance.persistQueue();
    requestManagerInstance.loadQueueFromStore();

    const currentQueueLoadedAgain = requestManagerInstance.getCurrentQueue();
    expect(currentQueueLoadedAgain.length).toBe(1);
    const queuedRequestLoadedAgain = currentQueueLoadedAgain[0];

    requestConfig = queuedRequestLoadedAgain.rawRequest as AxiosRequestConfig;

    return requestConfig;
  });

  return requestInterceptorForMountedTests;
};

const assertRequestsEquality = (actualRequest: JasmineAjaxRequest, expectedRequest: JasmineAjaxRequest) => {
  expect(actualRequest.method).toEqual(expectedRequest.method);
  assertRequestDataEquality(actualRequest.params, expectedRequest.params);
  expect(actualRequest.requestHeaders).toEqual(expectedRequest.requestHeaders);
  expect(actualRequest.url).toEqual(expectedRequest.url);
};

const assertRequestDataEquality = (actualParams: any, expectedParams: any) => {
  if (isFormData(actualParams) && isFormData(expectedParams)) {
    const actualParamsAsObject: { [key: string]: string | File } = {};
    (actualParams as FormData).forEach((value, key) => {
      actualParamsAsObject[key] = value;
    });
    const expectedParamsAsObject: { [key: string]: string | File } = {};
    (expectedParams as FormData).forEach((value, key) => {
      expectedParamsAsObject[key] = value;
    });

    expect(actualParamsAsObject).toEqual(expectedParamsAsObject);
  } else {
    expect(actualParams).toEqual(expectedParams);
  }
};

const assertQueueState = (requestManagerInstance: RequestManager, expectedState: AxiosRequestEnvelope[]) => {
  expect(requestManagerInstance.getCurrentQueue()).toEqual(expectedState);
  requestManagerInstance.loadQueueFromStore();
  expect(requestManagerInstance.getCurrentQueue()).toEqual(expectedState);
};

function isFormData(thing: any) {
  const pattern = '[object FormData]';
  return thing && (
    (typeof FormData === 'function' && thing instanceof FormData) ||
        toString.call(thing) === pattern ||
        (isFunction(thing.toString) && thing.toString() === pattern)
  );
}

function isFunction(val: any) {
  return toString.call(val) === '[object Function]';
}
