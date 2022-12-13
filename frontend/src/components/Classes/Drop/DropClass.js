const DropClass = (
	classID,
	reload,
	setReload,
	navigate,
	setShowSnackbar,
	setUserOffset
) => {
	let token = localStorage.getItem('token');

	fetch(`http://127.0.0.1:8000/classes/drop`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ id: classID.toString() }),
	}).then((response) => {
		console.log('Drop class called');
		if (response.status === 200) {
			console.log('Drop class success');
			setShowSnackbar({ open: true, message: 'Drop', isSuccess: true });
			setUserOffset(0);
		} else if (response.status === 401) {
			console.log('User is not logged in');
			navigate('/login');
		}
		setReload(!reload);
	});
};

export default DropClass;
