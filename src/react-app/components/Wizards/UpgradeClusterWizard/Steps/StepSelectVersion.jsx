import React, { useState } from "react";
import { useSnackbar } from "notistack";
import { useWizard } from "../../../../hooks/useWizard";
import { PROVIDER_TYPE } from "../../../../providers";
import { StepWizardWrapper } from "../../../Steps";
import { useForm } from "react-hook-form";
import { InputSelect } from "../../../FormInputs";

export default function StepSelectVersion({ goToNamedStep, ...props }) {
	const [versions, setVersions] = useState([]);
	const wizard = useWizard();
	const { handleSubmit, control } = useForm();
	const snack = useSnackbar().enqueueSnackbar;
	const _goto = goToNamedStep;

	return (
		<StepWizardWrapper
			disableBack
			onLoad={async () => {}}
			onNextClick={handleSubmit(async (fields) => {
				_goto("applyTemplates");
			})}
			title="Yükseltme bilgilerini girin"
			fields={{
				kubVersion: {
					title: "Kubernetes Sürümü",
					type: "select",
					items: versions,
				},
			}}
			{...props}
		>
			<InputSelect name="kubVersion" control={control} items={versions} />
		</StepWizardWrapper>
	);
}
