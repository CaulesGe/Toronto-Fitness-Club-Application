const EnrollClass = (classID, reload, setReload, navigate, setShowSnackbar) => {
	let token = localStorage.getItem('token');

	fetch(`http://127.0.0.1:8000/classes/enroll`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ id: classID.toString() }),
	}).then((response) => {
		console.log('Enroll class called');
		if (response.status === 200) {
			console.log('Enroll class success');
			setShowSnackbar({ open: true, message: 'Enroll', isSuccess: true });
		} else if (response.status === 401) {
			console.log('User is not logged in');
			navigate('/login');
		} else if (response.status === 403) {
			console.log('User does not have subscription');
			navigate('/subscription/add');
		}
		setReload(!reload);
	});
};

export default EnrollClass;
