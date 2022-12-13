import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import EnrollEvent from './EnrollEvent';
import { useNavigate } from 'react-router-dom';

function EnrollDialog({ session, reload, setReload, setShowSnackbar }) {
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<div>
			<Button variant="outlined" onClick={handleClickOpen}>
				Enroll
			</Button>
			<Dialog
				open={open}
				onClose={handleClose}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">{'Confirmation'}</DialogTitle>
				<DialogContent>
					<DialogContentText id="alert-dialog-description">
						Are you sure you want to enroll this session?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						variant="contained"
						onClick={() => {
							EnrollEvent(
								session.id,
								reload,
								setReload,
								setShowSnackbar,
								navigate
							);
							handleClose();
						}}
						autoFocus
					>
						Confirm
					</Button>
					<Button color="error" onClick={handleClose}>
						Cancel
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default EnrollDialog;
