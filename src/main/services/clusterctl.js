import BaseDownloader from './base/downloader';

class Clusterctl extends BaseDownloader {
    /**
     * @param {string} url
     * @param {string} name
     */
    constructor() {
        const url = 'htpps://api.github.com/repos/kubernetes-sigs/cluster-api/releases/latest';
        const name = 'clusterctl';
        super(url, name);
    }
}