import axios, {AxiosRequestHeaders, Method} from 'axios';
import {RequestClientType} from '../enums/RequestClientType';
import {Header, PostData, SerializedRequest} from '../types/SerializedRequest';
import {AxiosRequestEnvelope} from '../types/AxiosRequestEnvelope';
import {TaggedAxiosRequestConfig} from '../types/taggedRequests/TaggedAxiosRequestConfig';


class AxiosSerializer {
  async serializeRequest(taggedRequest: AxiosRequestEnvelope): Promise<SerializedRequest> {
    const axiosRequest = taggedRequest.rawRequest;
    const serializedRequest: SerializedRequest = {
      requestId: taggedRequest.requestId,
      originalRequestClientType: RequestClientType.AXIOS,
      method: axiosRequest.method as Method,
      url: axios.getUri(axiosRequest), // automatically embeds params inside
      httpVersion: '1.2',
      cookies: [], // TODO
    };

    const defaultRequestTransformer = axios.defaults.transformRequest as any;
    const transformedRequestData = defaultRequestTransformer[0](axiosRequest.data, axiosRequest.headers);

    const flattenedHeaders = this.flattenHeaders(axiosRequest.method as string, axiosRequest.headers as any);

    serializedRequest.headers = this.serializeHeaders(flattenedHeaders as any);

    if (axiosRequest.data) {
      serializedRequest.postData = await this.serializePostData(transformedRequestData);
    }

    // need remediation because content type might need to be inferred from data provided
    if (axiosRequest.headers && flattenedHeaders['Content-Type']) {
      const mimeType = this.inferCorrectContentType(axiosRequest.data);
      axiosRequest.headers['Content-Type'] = mimeType;
    }

    return serializedRequest;
  }

  deserializeRequest(serializedRequest: SerializedRequest): AxiosRequestEnvelope {
    const requestConfig: TaggedAxiosRequestConfig = {
      // need to reconstruct the request using the defaults first otherwise there will be unintended side effects
      // caused by the non-serializable keys being absent, e.g. transformRequest not being present will cause the data
      // to remain untransformed
      // TODO: inject the defaults in case it was mutated on client side
      ...axios.defaults as any,
      url: serializedRequest.url,
      method: serializedRequest.method,
    };
    if (serializedRequest.headers) {
      requestConfig.headers = this.deserializeHeaders(serializedRequest.headers);
    }
    if (serializedRequest.postData) {
      requestConfig.data = this.deserializePostData(serializedRequest.postData);
    }
    requestConfig.requestQueuePersistenceId = serializedRequest.requestId;
    return {
      requestId: serializedRequest.requestId,
      requestClientType: RequestClientType.AXIOS,
      rawRequest: requestConfig,
    };
  }

  private async serializePostData(data: any): Promise<PostData> {
    if (!(data instanceof FormData)) {
      if (typeof data === "string") {
        return {
          rawData: data,
          isFormData: false,
        };
      } else {
        return {
          rawData: JSON.stringify(data),
          isFormData: false,
        };
      }
    }

    const dataAsFormData = data as FormData;

    const formDataAsObject: { [key: string | number | symbol]: File | string } = {};
    dataAsFormData.forEach(async (value, key) => {
      formDataAsObject[key] = value;
    });

    const serializableFormData: any = {};
    for (const [key, value] of Object.entries(formDataAsObject)) {
      if (value instanceof File) {
        const fileBase64Value = await (value as File).text();
        serializableFormData[key] = {
          value: fileBase64Value,
          fileName: (value as File).name,
          isFile: true,
        };
      } else {
        serializableFormData[key] = {
          value,
          isFile: false,
        };
      }
    }

    return {
      rawData: JSON.stringify(serializableFormData),
      isFormData: true,
    };
  }


  private deserializePostData(serializedPostData: PostData): string | object | boolean | number | null {
    const dataRead: { [key: string | number | symbol]: { value: string, fileName: string, isFile: boolean } } =
            JSON.parse(serializedPostData.rawData);
    if (!serializedPostData.isFormData) {
      return dataRead;
    }
    const reconstructedFormData: FormData = new FormData();
    Object.entries(dataRead).forEach(((formEntry) => {
      const formEntryKey = formEntry[0];
      const formEntryValue = formEntry[1];
      if (formEntryValue.isFile) {
        const reconstructedFile = new File([formEntryValue.value], formEntryValue.fileName);
        reconstructedFormData.append(formEntryKey, reconstructedFile);
      } else {
        reconstructedFormData.append(formEntryKey, formEntryValue.value);
      }
    }));
    return reconstructedFormData;
  }

  private serializeHeaders(axiosHeaders: AxiosRequestHeaders): Header[] {
    return Object.entries(axiosHeaders).map(
        ([headerName, headerValue]) => this.serializeHeader(headerName, headerValue),
    );
  }

  private serializeHeader(headerName: string, headerValue: string | number | boolean): Header {
    return {
      name: headerName,
      value: JSON.stringify(headerValue),
      comment: '',
    };
  }

  private deserializeHeaders(serializedHeaders: Header[]) {
    const deserializedHeaders: AxiosRequestHeaders = {};
    serializedHeaders.map((serializedHeader) => this.deserializeHeader(serializedHeader, deserializedHeaders));
    return deserializedHeaders;
  }

  private deserializeHeader(serializedHeader: Header, deserializedHeaders: AxiosRequestHeaders) {
    // this implicitly converts the header value to a string after deserialization
    // but no need to preserve original type because headers are strings at server side
    deserializedHeaders[serializedHeader.name] = JSON.parse(serializedHeader.value);
  }

  // adapted from Axios code
  private inferCorrectContentType(data: any): string {
    // this must be evaluated first before Object evaluation because this is a subtype of Object
    if (data instanceof URLSearchParams) {
      return 'application/x-www-form-urlencoded;charset=utf-8';
    }
    if (data instanceof Object) {
      return 'application/json';
    }
    console.error(`unexpected content type fallthrough, see data: '${data}'. Please create an issue on https://github.com/tehtea/persisted-requests`);
    return 'UNKNOWN';
  }

  // adapted from Axios code too
  private flattenHeaders(originalMethod: string, headers: { [key: string]: string | object }) {
    const combinedHeaders = {
      ...headers.common as object || {},
      ...headers[originalMethod] as object || {},
      ...headers,
    };

    const possibleMethods = ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'];
    possibleMethods.forEach((method: string) => {
      delete combinedHeaders[method];
    });

    return combinedHeaders;
  }
}


export default new AxiosSerializer();
