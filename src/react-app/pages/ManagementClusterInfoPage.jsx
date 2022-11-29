import React, { useEffect, useState } from "react";

import {
	Paper,
	Table,
	TableContainer,
	TableHead,
	TableBody,
	TableCell,
	TableRow,
	Typography,
	styled,
	tableCellClasses,
	Button,
	ButtonGroup,
	Fab,
} from "@mui/material";

import {
	Delete as DeleteIcon,
	Upgrade as UpgradeIcon,
	Camera as CameraIcon,
	Add as AddIcon,
	ArrowBack as ArrowBackIcon,
	Replay as ReplayIcon,
} from "@mui/icons-material";

import { providerNames } from "../providers/provider-names";
import { providerLogos } from "../providers/provider-logos";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../hooks/useModal";

import DashboardLayout from "../layouts/DashboardLayout.jsx";
import ProviderChip from "../components/ProviderChip.jsx";
import QuestionModal from "../components/Modals/QuestionModal.jsx";
import Loading from "../components/Snackbars/Loading.jsx";
import clusterConfig from "../api/clusterConfig";
import kubeConfig from "../api/kubeConfig";
import kubectl from "../api/kubectl";
import { useCustomSnackbar } from "../hooks/useCustomSnackbar";
import clusterctl from "../api/clusterctl";
import { logger } from "../logger";

const StyledTableCell = styled(TableCell)(() => ({
	[`&.${tableCellClasses.head}`]: {
		backgroundColor: "#033e8a",
		color: "white",
	},
	[`&.${tableCellClasses.body}`]: {
		fontSize: "16px",
		textAlign: "center",
	},
}));

const StyledTableRow = styled(TableRow)(() => ({
	transition: "all 0.5s",
	"&:hover": {
		boxShadow: "0 0 13px -7px",
	},
}));

function HeaderCell({ children }) {
	return (
		<TableCell>
			<Typography
				sx={{
					fontWeight: "bold",
					fontSize: "18px",
					textDecoration: "italic",
					textAlign: "center",
				}}
			>
				{children}
			</Typography>
		</TableCell>
	);
}

export default function ManagementClusterInfoPage() {
	const [clusters, setClusters] = useState([]);
	const [config, setConfig] = useState("");
	const { enqueueSnackbar: snack, closeSnackbar } = useCustomSnackbar();
	const { name } = useParams();
	const modal = useModal();
	const nav = useNavigate();

	const refreshClusters = async () => {
		let loading = snack("Kümeler yükleniyor", { persist: true }, Loading);
		try {
			const _config = await kubeConfig.loadManagementConfig(name);
			await setConfig(_config);
			await setClusters([...(await clusterConfig.getClusters(_config))]);
		} catch (err) {
			snack(err.message, { variant: "error", autoHideDuration: 5000 });
		}
		closeSnackbar(loading);
	};

	useEffect(() => {
		refreshClusters();
	}, []);

	return (
		<DashboardLayout>
			<div className="flex justify-center flex-col gap-10 p-5">
				<div className="w-full flex">
					<Fab
						color="primary"
						sx={{
							margin: 0,
							top: "auto",
							left: "auto",
						}}
						onClick={() => nav(-1)}
					>
						<ArrowBackIcon />
					</Fab>
				</div>
				<div className="items-center flex justify-between">
					<h4 className="font-sans text-3xl">{name}</h4>
					<Fab
						color="primary"
						variant="contained"
						onClick={() => {
							modal.showModal(QuestionModal, {
								yesButtonColor: "error",
								message: `${name} isimli yönetim kümesini kaldırmak istediğinize emin misiniz? Eğer ilerleyen zamanlarda bu yönetim kümesini KOS ile birlikte kullanmak isterseniz tekrardan eklemeniz gerekecek.`,
								yesButtonText: "Sil",
								noButtonText: "Vazgeç",

								onYesClick: async () => {
									modal.closeModal();
									let loading = snack(
										`${name} yönetim kümesi siliniyor...`,
										{ persist: true },
										Loading
									);
									try {
										await clusterConfig.deleteCluster(name);
										nav("/management-clusters", {
											replace: true,
										});
									} catch (err) {
										logger.error(err.message);
										snack("Bir hata oluştu!", {
											variant: "error",
										});
									}
									closeSnackbar(loading);
								},
								onNoClick: () => modal.closeModal(),
							});
						}}
					>
						<DeleteIcon />
					</Fab>
				</div>
				<div className="flex justify-between items-center ml-1 mr-1">
					<div className="font-sans">İşyükü kümeleri</div>
					<div className="flex gap-5 w-[400px] h-[40px]">
						<Button
							onClick={() => refreshClusters()}
							variant="contained"
						>
							<ReplayIcon />
						</Button>
						<Button
							sx={{
								textTransform: "none",
								fontSize: "20px",
								flexGrow: 1,
							}}
							onClick={() => nav(`/create-cluster/${name}`)}
							variant="contained"
						>
							Yeni küme ekle <AddIcon />
						</Button>
					</div>
				</div>
				<TableContainer
					sx={{
						display: "flex",
						flexDirection: "column",
					}}
					component={Paper}
				>
					<Table>
						<TableHead>
							<TableRow>
								<HeaderCell>İsim</HeaderCell>
								<HeaderCell>Sağlayıcı</HeaderCell>
								<HeaderCell>Durum</HeaderCell>
								<HeaderCell>İşlemler</HeaderCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{clusters.map((x, i) => (
								<StyledTableRow key={i}>
									<StyledTableCell>{x.name}</StyledTableCell>
									<StyledTableCell>
										<ProviderChip
											name={providerNames[x.provider]}
											logo={providerLogos[x.provider]}
											status={x.status}
										/>
									</StyledTableCell>
									<StyledTableCell>
										{(() => {
											if (x.status === "Provisioning")
												return "Sağlanıyor";
											if (x.status === "Provisioned")
												return "Hazırlandı";
											if (x.status === "Deleting")
												return "Siliniyor";
										})()}
									</StyledTableCell>
									<StyledTableCell>
										<ButtonGroup variant="contained">
											<Button
												disabled={
													x.status !== "Provisioned"
												}
												onClick={async () => {
													await navigator.clipboard.writeText(
														await clusterctl.getClusterConfig(
															config,
															x.name
														)
													);
													snack(
														"Kümenin kubeconfig içeriği panoya kopyalandı!",
														{
															variant: "info",
															autoHideDuration: 2000,
														}
													);
												}}
											>
												<CameraIcon />
											</Button>
											<Button
												onClick={() => {
													nav(
														`/upgrade-cluster/${name}/${x.name}`,
														{ replace: true }
													);
												}}
												disabled={
													x.status !== "Provisioned"
												}
											>
												<UpgradeIcon />
											</Button>
											<Button
												disabled={
													x.status === "Deleting"
												}
												onClick={async () => {
													modal.showModal(
														QuestionModal,
														{
															yesButtonColor:
																"error",
															message: `${x.name} isimli kümeyi gerçekten silmek istiyor musunuz? (Bu işlem geri alınamaz)`,
															yesButtonText:
																"Sil",
															noButtonText:
																"Vazgeç",

															onYesClick:
																async () => {
																	modal.closeModal();
																	const info =
																		snack(
																			`"${x.name}" kümesi siliniyor`,
																			{
																				variant:
																					"info",
																				persist: true,
																			}
																		);
																	try {
																		await kubectl.delete_(
																			config,
																			"cluster",
																			x.name
																		);
																	} catch (err) {
																		snack(
																			err.message,
																			{
																				variant:
																					"error",
																				autoHideDuration: 5000,
																			}
																		);
																	} finally {
																		closeSnackbar(
																			info
																		);
																	}
																},
															onNoClick: () =>
																modal.closeModal(),
														}
													);
												}}
											>
												<DeleteIcon />
											</Button>
										</ButtonGroup>
									</StyledTableCell>
								</StyledTableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</div>
		</DashboardLayout>
	);
}
