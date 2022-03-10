import {PersistenceTypes} from '../enums/PersistenceType';
import {RequestClientType} from '../enums/RequestClientType';

export type RequestManagerSettings = NewRequestManagerSettings | ExistingRequestManagerSettings;

type NewRequestManagerSettings = {
    resetRequestManager: true,
    persistenceType: PersistenceTypes,
    loadFromStore: boolean,
    defaultRequestClientType?: RequestClientType,
}

type ExistingRequestManagerSettings = {
    resetRequestManager: false,
    persistenceType?: PersistenceTypes,
    loadFromStore?: boolean,
    defaultRequestClientType?: RequestClientType,
}
