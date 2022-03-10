import {AxiosRequestConfig} from 'axios';
import {v4 as uuidv4} from 'uuid';
import {RequestClientType} from './enums/RequestClientType';
import {AxiosRequestEnvelope} from './types/AxiosRequestEnvelope';

class RequestIdGenerator {
  public tagRequest(request: AxiosRequestConfig, requestClientType: RequestClientType): AxiosRequestEnvelope {
    const requestId = this.generateRequestId();
    if (requestClientType === RequestClientType.AXIOS) {
      return {
        requestId,
        requestClientType: RequestClientType.AXIOS,
        rawRequest: request,
      };
    }
    throw new Error('Unknown Request Client Type');
  }

  private generateRequestId() {
    return `${Date.now()}-${uuidv4()}`; // sortable Request ID
  }
}

export default new RequestIdGenerator();
