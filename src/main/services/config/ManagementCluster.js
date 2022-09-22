import fs from "fs";
import KubeConfig from "../../k8s/KubeConfig";
import Kubectl from "../Kubectl";
import dirCheck, { DIRS } from "../../utils/dir-checker";
import { PROVIDER_TYPE } from "../../providers";

/**
 * Kümeyi temsil eden nesneyi tanımlar.
 * @typedef {Object} Cluster
 * @property {string} name - Kümenin adı.
 * @property {string} config - Kümenin kubeconfig dosyasının yolu.
 * @property {Number} provider - Kümenin bulunduğu altyapı sağlayıcısının kimlik numarası.
 */

/**
 * Yönetim kümesini temsil eden ve kayıtlı kümeler ile işlem yapmaya yarayan sınıf.
 */
export default class ManagementCluster {
	constructor(name) {
		/**
		 * @type {string}
		 * @public
		 */
		this.name = name ?? "";

		/**
		 * @type {Array<Number>}
		 * @public
		 */
		this.supportedProviders = [];

		/**
		 * @type {Array<Cluster>}
		 * @public
		 */
		this.clusters = [];

		/**
		 * @type {KubeConfig}
		 * @public
		 */
		this.config = new KubeConfig();
	}

	async getClusters() {
		let kctl = new Kubectl();
		let result = [];

		await KubeConfig.tempConfig(
			kctl.config,
			this.config.config,
			async () => {
				let clusterList = await kctl.get("cluster", "json", "-A");
				clusterList = clusterList?.items;

				for (let i of clusterList) {
					let provider = i.spec.infrastructureRef.kind;
					switch (provider) {
						case "DockerCluster":
							provider = PROVIDER_TYPE.DOCKER;
							break;
						case "DOCluster":
							provider = PROVIDER_TYPE.DIGITAL_OCEAN;
							break;
					}
					result.push({
						name: i.metadata.name,
						provider,
					});
				}
			}
		);
		this.clusters = result;
		return result;
	}

	async getSupportedProviders() {
		let kctl = new Kubectl();
		let providers = [];
		await KubeConfig.tempConfig(
			kctl.config,
			this.config.config,
			async () => {
				let pods = await kctl.get("pods", "json", "-A"); // --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}' -A
				for (let i of pods.items) {
					switch (i.metadata.namespace) {
						case "capd-system":
							providers.push(PROVIDER_TYPE.DOCKER);
							break;
						case "capdo-system":
							providers.push(PROVIDER_TYPE.DIGITAL_OCEAN);
							break;
					}
				}
			}
		);
		this.supportedProviders = providers;
		return providers;
	}

	static async getManagementClusters() {
		let dir = await dirCheck(DIRS.managementClusters);
		return new Promise((resolve, reject) => {
			fs.readdir(dir, async (err, files) => {
				if (err) reject(err);
				let configFiles = files.filter((x) =>
					x.endsWith(".kubeconfig")
				);
				let clusterList = [];
				for (const conf of configFiles) {
					try {
						let manCluster = new ManagementCluster(
							conf.split(".").slice(0, -1).join(".")
						);

						await manCluster.config.changePath(`${dir}/${conf}`);
						await manCluster.getClusters();
						await manCluster.getSupportedProviders();
						clusterList.push(manCluster);
					} catch (err) {
						reject(err);
					}
				}
				resolve(clusterList);
			});
		});
	}
}