import { useState, useEffect } from 'react';
import './App.css';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import ReactJson from 'react-json-view';
import { RequestManager, mountAxiosInterceptor, PersistenceTypes } from 'persisted-requests'
import logo from './logo.svg'
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import 'bootstrap/dist/css/bootstrap.min.css'; // needed for bootstrap

const requestManagerInstance: RequestManager = new RequestManager({
  persistenceType: PersistenceTypes.LOCAL_STORAGE,
  loadFromStore: true,
  resetRequestManager: true,
});

const setupAxiosInstance = () => {
  const axiosInstance = axios.create({
    baseURL: "https://persisted-requests-mockserver.herokuapp.com"
  })
  mountAxiosInterceptor(axiosInstance, requestManagerInstance)
  return axiosInstance
}

const createPost = async (
  axiosInstance: AxiosInstance,
  refreshStorageCache: CallableFunction
) => {

  const response = axiosInstance.post("posts", {
    title: "foo",
    body: "bar",
    userId: 1,
  })

  setTimeout(() => {
    refreshStorageCache()
  }, 100) // apply setTimeout because the interceptor takes a while to actually persist the requests

  await response

  refreshStorageCache()

  return response
}

const getLocalStorageItems = () => {
  const localStorageItems = []
  for (let i = 0; i < localStorage.length; i++) {
    const currentKey: string = localStorage.key(i) as string
    const currentItem = localStorage.getItem(currentKey)
    localStorageItems.push({
      key: currentKey,
      item: currentItem
    })
  }
  return localStorageItems
}

const axiosInstance = setupAxiosInstance()

function App() {
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [localStorageState, setLocalStorageState] = useState(getLocalStorageItems());

  const refreshStorageCache = () => {
    const currentLocalStorageItems = getLocalStorageItems()
    setLocalStorageState(currentLocalStorageItems);
  }

  useEffect(() => {
    const fireRequest = async () => {
      try {
        await createPost(axiosInstance, refreshStorageCache);
      } catch (error) {
        console.error('Error while creating post: ', error)
      } finally {
        setRequestInProgress(false)
      }
    }

    if (requestInProgress) {
      fireRequest()
    }
  }, [requestInProgress])

  const replayRequest = async (localStorageKey: string, refreshStorageCache: CallableFunction) => {
    if (!localStorageKey.startsWith('persistedQueue:')) {
      return;
    }
    const requestId = localStorageKey.substr('persistedQueue:'.length)
    const originalRequest = await requestManagerInstance.removeRequestById(requestId)
    if (!originalRequest) {
      return
    }

    refreshStorageCache()

    // cannot use existing axios instance, must use the vanilla one
    // because all the settings are already included in the request config already
    const retryAxiosInstance = axios.create()
    retryAxiosInstance.request(originalRequest.rawRequest as AxiosRequestConfig)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1> Persisted Requests - Demo </h1>
        <div>
          <Button disabled={requestInProgress} onClick={() => setRequestInProgress(true)}>Fire A Request!</Button>
        </div>
        {requestInProgress && (
          <>
            <p>Request In Progress</p>
            <img src={logo} className="App-logo" alt="logo" />
          </>
        )}
      </header>
      <div>
        <h2 style={{ marginTop: '5vh' }}>Local Storage Contents</h2>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>Local Storage Key</th>
              <th>Local Storage Value</th>
              <th>Replay the Request</th>
            </tr>
          </thead>
          <tbody>
            {localStorageState.map((localStorageEntry, key) => {
              return (
                <tr key={key}>
                  <td>{key + 1}</td>
                  <td>{localStorageEntry.key}</td>
                  <td style={{ textAlign: 'left' }}><ReactJson src={JSON.parse(localStorageEntry.item as string)} /></td>
                  <td><Button onClick={() => replayRequest(localStorageEntry.key as string, refreshStorageCache)}>Replay Request</Button></td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default App;
