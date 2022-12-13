import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import DropEvent from './DropEvent';
import { useNavigate } from 'react-router-dom';

import './DropDialog.css';

function DropDialog({
	session,
	reload,
	setReload,
	setShowSnackbar,
	setUserOffset,
}) {
	const [open, setOpen] = React.useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const navigate = useNavigate();

	return (
		<div>
			<Button variant="outlined" color="error" onClick={handleClickOpen}>
				Drop
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
						Are you sure you want to drop this session?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						variant="contained"
						color="error"
						onClick={() => {
							DropEvent(
								session.id,
								reload,
								setReload,
								navigate,
								setShowSnackbar,
								setUserOffset
							);
							handleClose();
						}}
						autoFocus
					>
						Confirm
					</Button>
					<Button onClick={handleClose}>Cancel</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default DropDialog;
