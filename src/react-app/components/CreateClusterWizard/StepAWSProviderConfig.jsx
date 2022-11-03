import React from "react";
import { kubernetesVersions, machineTypes, regions } from "../../providers/aws";
import { useWizard } from "../../hooks/useWizard";
import StepInput from "../StepInput.jsx";

export default function StepAWSProviderConfig({ goToNamedStep, ...props }) {
	const wizard = useWizard();

	return (
		<StepInput
			onBackClick={() => {
				goToNamedStep("selectAWSClusterType");
			}}
			onNextClick={async (fields) => {
				// TODO: Girdi doğrulama
				for (let field of Object.keys(fields))
					await wizard.updateData(field, fields[field]);
				wizard.updateData('type', 'ec2');
				goToNamedStep("AWSCreateCluster");
			}}
			title="AWS Küme Bilgileri"
			fields={[
				{
					title: "Küme Adı",
					type: "string",
					name: "clusterName",
					size: 6,
				},
				{
					title: "Kubernetes Versiyonu",
					type: "select",
					values: kubernetesVersions,
					name: "kubVersion",
					size: 6,
				},
				{
					title: "Master Makina Sayısı",
					type: "number",
					name: "masterCount",
					size: 6,
				},
				{
					title: "Worker Makina Sayısı",
					type: "number",
					name: "workerCount",
					size: 6,
				},
				{
					title: "SSH Anahtarı",
					type: "string",
					name: "sshKeyName",
					size: 6,
				},
				{
					title: "Bölge",
					type: "select",
					values: regions,
					name: "region",
					size: 6,
				},

				{
					title: "Master Makina Tipi",
					type: "select",
					values: machineTypes.map((x) => x.name),
					name: "masterMachineType",
					size: 6,
				},

				{
					title: "Worker Makina Tipi",
					type: "select",
					values: machineTypes.map((x) => x.name),
					name: "workerMachineType",
					size: 6,
				},
			]}
			width={500}
			{...props}
		/>
	);
}
