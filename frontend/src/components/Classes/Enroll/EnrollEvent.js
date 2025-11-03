import { API_BASE_URL } from '../../../config';

function EnrollEvent(eventID, reload, setReload, setShowSnackbar, navigate) {
	let token = localStorage.getItem('token');

	fetch(`${API_BASE_URL}/classes/event/enroll`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ id: eventID.toString() }),
	}).then((response) => {
		console.log('Enroll event called');
		if (response.status === 200) {
			console.log('Enroll event success');
			setShowSnackbar({ open: true, message: 'Enroll', isSuccess: true });
		} else if (response.status === 400) {
			console.log("Can't enroll in event");
			setShowSnackbar({ open: true, message: 'Enroll', isSuccess: false });
		} else if (response.status === 401) {
			console.log('User is not logged in');
			navigate('/login');
		} else if (response.status === 403) {
			console.log('User does not have subscription');
			navigate('/subscription/add');
		}
		setReload(!reload);
	});
}

export default EnrollEvent;
