import { Navigate } from 'react-router-dom';

export default function Logout() {
	if (localStorage.getItem('token')) {
		window.location.reload();
		localStorage.removeItem('token');
	}

	return <Navigate to="/login" />;
}
