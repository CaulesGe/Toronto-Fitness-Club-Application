import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
	return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ActionSnackbar({ showSnackbar, setShowSnackbar }) {
	const handleClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}

		setShowSnackbar({ ...showSnackbar, open: false });
	};

	return (
		<Snackbar
			open={showSnackbar.open}
			autoHideDuration={1500}
			onClose={handleClose}
		>
			{showSnackbar.isSuccess ? (
				<Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
					{showSnackbar.message} Success!
				</Alert>
			) : (
				<Alert onClose={handleClose} severity="info" sx={{ width: '100%' }}>
					You already enrolled!
				</Alert>
			)}
		</Snackbar>
	);
}
