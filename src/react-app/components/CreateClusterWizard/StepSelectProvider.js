import {
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Box
} from '@mui/material';
import { useSnackbar } from "notistack";
import { useEffect, useState } from 'react';
import { translate } from '../../locales';
import StepDigitalOceanSSHkey from "./StepDigitalOceanSSHkey";
import StepKindProviderConfig from "./StepKindProviderConfig";
import React from 'react';
import Wrapper from './Wrapper';
import { useWizard } from '.';


export default function StepSelectProvider(props) {
	const snack = useSnackbar().enqueueSnackbar;
	const [providers, setProviders] = useState([]); 
	const [provider, setProvider] = useState('');
	const wizard = useWizard();
	// const _next = props.nextStep;
	const _back = props.previousStep;
	const _goto = props.goToNamedStep;

	useEffect(() => {
		(async () =>{
			if (props.currentStep === 3) {
				let supportedProviders = await window.providers.getProviders(wizard.data.config);
				setProviders(supportedProviders.map(p => {
					switch (p) {
						case 'docker':
							return {
								key: 'kind',
								step: <StepKindProviderConfig />,
								name: 'Kind - Docker'
							};
						case 'digitalocean':
							return {
								key: 'digitalocean',
								step: <StepDigitalOceanSSHkey />,
								name: 'DigitalOcean'
							};
					}
				}));
			}
		})();
	}, [wizard.data]);

	return (
		<Wrapper onNextClick={() => {
			if (!!provider) {
				_goto(provider)
				return;
			}
			snack(translate('errSelectOperation'), { variant: 'error', autoHideDuration: 2000 });
		}}
			onBackClick={() => {
				_back();
			}}>

			<Typography sx={{
				fontSize: '20px',
				fontWeight: 'bold',
				pb: 2,
				pt: 2
			}}>
				Altyapı sağlayıcısı seçin
			</Typography>
			<Typography>
				Oluşturulacak kümenin hangi altyapı sağlayıcısı kullanılarak oluşturulacağını seçin.<br />Bu altyapı yönetim kümenizin oluşturulmasında kullanılan altyapı ile aynı olmalıdır.
			</Typography>
			<Box sx={{
				mt: '10px',
				mb: '10px'
			}}>
				<FormControl fullWidth>
					<InputLabel>{translate('provider')}</InputLabel>
					<Select
						value={provider}
						label={translate('provider')}
						onChange={(e) => setProvider(e.target.value)}
					>
						{providers.map(x => (
							<MenuItem value={x.key} key={x.key}>{x.name}</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
		</Wrapper>
	);
}