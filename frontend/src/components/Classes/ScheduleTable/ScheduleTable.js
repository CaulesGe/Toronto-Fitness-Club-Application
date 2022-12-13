import { useState } from 'react';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import EnrollDialog from '../Enroll/EnrollDialog';
import DropDialog from '../Drop/DropDialog';
import SessionDialog from './SessionDialog';
import ActionSnackbar from './ActionSnackbar';

import './ScheduleTable.css';

const ClassButton = ({
	row,
	isUser,
	isHitory,
	reload,
	setReload,
	setShowSnackbar,
	setUserOffset,
}) => {
	if (isUser) {
		return isHitory ? null : (
			<DropDialog
				session={row}
				reload={reload}
				setReload={setReload}
				setShowSnackbar={setShowSnackbar}
				setUserOffset={setUserOffset}
			/>
		);
	} else {
		return row.enrolled_num < row.classInfo.capacity ? (
			<EnrollDialog
				session={row}
				reload={reload}
				setReload={setReload}
				setShowSnackbar={setShowSnackbar}
			/>
		) : (
			<Button disabled variant="outlined">
				Full
			</Button>
		);
	}
};

export const KeywordsToString = (keywords) => {
	let str = '<p>';
	for (let i = 0; i < keywords.length; i++) {
		str += keywords[i];
		if (i !== keywords.length - 1) {
			str += ` <strong>&#8226;</strong> `;
		}
	}
	str += '</p>';
	return (
		<div className="content" dangerouslySetInnerHTML={{ __html: str }}></div>
	);
};

function ScheduleTable({
	classes,
	isUser,
	isHitory,
	reload,
	setReload,
	studios,
	setUserOffset,
}) {
	const [showDialog, setShowDialog] = useState(false);
	const [session, setSession] = useState(null);
	const [showSnackbar, setShowSnackbar] = useState({
		open: false,
		isSuccess: true,
		message: '',
	});

	return (
		<>
			<TableContainer component={Paper}>
				<Table sx={{ minWidth: 500 }} aria-label="simple table">
					<TableHead>
						<TableRow id="schedule-head-cell">
							<TableCell align="center">Name</TableCell>
							<TableCell align="center">Coach</TableCell>
							<TableCell align="center">Category</TableCell>
							<TableCell align="center">Date</TableCell>
							<TableCell align="center">Time</TableCell>
							<TableCell align="center"></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{classes.map((row) => (
							<TableRow
								key={row.id}
								hover
								onClick={() => {
									setShowDialog(true);
									setSession(row);
								}}
							>
								<TableCell id="schedule-name" align="center">
									{row.classInfo.name}
								</TableCell>
								<TableCell align="center">{row.classInfo.coach}</TableCell>
								<TableCell
									id="schedule-category-cell"
									align="center"
									style={{ width: 200 }}
								>
									{KeywordsToString(row.classInfo.keywords)}
								</TableCell>
								<TableCell id="schedule-date-cell" align="center">
									{row.date}
								</TableCell>
								<TableCell id="schedule-time" align="center">
									{row.start_time.slice(0, -3) +
										' - ' +
										row.end_time.slice(0, -3)}
								</TableCell>
								<TableCell align="center" onClick={(e) => e.stopPropagation()}>
									<ClassButton
										row={row}
										isUser={isUser}
										isHitory={isHitory}
										reload={reload}
										setReload={setReload}
										setShowSnackbar={setShowSnackbar}
										setUserOffset={setUserOffset}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			{showDialog && (
				<SessionDialog
					session={session}
					showDialog={showDialog}
					setShowDialog={setShowDialog}
					isUser={isUser}
					isHitory={isHitory}
					reload={reload}
					setReload={setReload}
					setShowSnackbar={setShowSnackbar}
					studios={studios}
					setUserOffset={setUserOffset}
				/>
			)}
			<ActionSnackbar
				showSnackbar={showSnackbar}
				setShowSnackbar={setShowSnackbar}
			/>
		</>
	);
}

export default ScheduleTable;
