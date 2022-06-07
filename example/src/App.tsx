import { useState, useEffect, ChangeEvent } from 'react';
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

const createResourceWithDelay = async (
  axiosInstance: AxiosInstance,
  delayTimeInSeconds: number,
  handleChangeStorageCallback: CallableFunction
) => {

  const response = axiosInstance.post("posts", {
    title: "foo",
    body: "bar",
    userId: 1,
  }, {
    params: {
      "_delay": delayTimeInSeconds * 1000
    }
  })

  setTimeout(() => {
    handleChangeStorageCallback()
  }, 100) // apply setTimeout because the interceptor takes a while to actually persist the requests

  await response

  handleChangeStorageCallback()

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
  const [delayTime, setDelayTime] = useState(5);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const [localStorageState, setLocalStorageState] = useState(getLocalStorageItems());

  const handleChangeStorage = () => {
    const currentLocalStorageItems = getLocalStorageItems()
    setLocalStorageState(currentLocalStorageItems);
  }

  useEffect(() => {
    const fireRequest = async () => {
      await createResourceWithDelay(axiosInstance, delayTime, handleChangeStorage);
      setRequestInProgress(false)
    }

    if (requestInProgress) {
      fireRequest()
    }
  }, [requestInProgress, delayTime])

  const onDelaySelectChange = (event: ChangeEvent<HTMLInputElement>) => {
    let newDelayTime = 0;
    if (Number.parseInt(event.target.value, 10) >= 0) {
      newDelayTime = Number.parseInt(event.target.value, 10)
    }
    setDelayTime(newDelayTime)
  }

  const replayRequest = async (localStorageKey: string, handleChangeStorageCallback: CallableFunction) => {
    if (!localStorageKey.startsWith('persistedQueue:')) {
      return;
    }
    const requestId = localStorageKey.substr('persistedQueue:'.length)
    const originalRequest = await requestManagerInstance.removeRequestById(requestId)
    if (!originalRequest) {
      return
    }

    handleChangeStorageCallback()

    // cannot use existing axios instance, must use the vanilla one
    // axiosInstance.request(originalRequest.rawRequest)
    axios.request(originalRequest.rawRequest as AxiosRequestConfig)
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1> Persisted Requests - Demo </h1>
        <div>
          <Button disabled={requestInProgress} onClick={() => setRequestInProgress(true)}>Fire A Request!</Button>
          <div>
            <label htmlFor='requestDelaySelect'>Request fulfillment delay (s)</label>
            <input id='requestDelaySelect' value={delayTime} type={"number"} onChange={onDelaySelectChange} />
          </div>
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
                  <td><Button onClick={() => replayRequest(localStorageEntry.key as string, handleChangeStorage)}>Replay Request</Button></td>
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
