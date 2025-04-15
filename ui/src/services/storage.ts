import { createInstance } from 'localforage';

export enum StorageKeys {
    NETWORK
}

class NetworkStorage {
    storageCache = new Map<string, any>();
    storageDriver;

    constructor() {
        this.storageDriver = createInstance({
            description: 'Simulation Network storage',
            name: 'SimStore',
        })
    }

    async getNetwork(networkName = 'default') {
        const key = StorageKeys.NETWORK.toString()+' __||__' + networkName;
        if(this.storageCache.has(key)) return this.storageCache.get(key);

        return await this.storageDriver.getItem(key);
    }

    async setNetwork(networkName = 'default', data: Object) {
        const key = StorageKeys.NETWORK.toString()+' __||__' + networkName;

        this.storageCache.set(key, data);
        this.storageDriver.setItem(key, data);
    }
}

export const networkStorage = new NetworkStorage();