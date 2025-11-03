import React, { useState, useEffect } from 'react';
import ScheduleTable from '../ScheduleTable/ScheduleTable';
import { useNavigate } from 'react-router-dom';
import { UserSchedulePagination } from '../Pagination/Pagination';
import { API_BASE_URL } from '../../../config';

const UserClassHistory = () => {
	const [classes, setClasses] = useState([]);
	const [offset, setOffset] = useState(0);
	const [totalItem, setTotalItem] = useState(1);
	const [studios, setStudios] = useState([]);

	let token = localStorage.getItem('token');
	let navigate = useNavigate();

	useEffect(() => {
		if (token === null) {
			navigate('/login');
		}
		fetch(`${API_BASE_URL}/classes/history?offset=${offset}`, {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => response.json())
			.then((json) => {
				setClasses(json.results);
				setTotalItem(json.count);
			});

		fetch(
			`${API_BASE_URL}/studios/all/?longitude=${1}&latitude=${1}&offset=${0}&limit=${50}`
		)
			.then((res) => res.json())
			.then((json) => {
				setStudios(json.results);
				console.log(json.results);
			});
	}, [offset, token, navigate]);

	return (
		<>
			<h1 className="schedule-title">My Class History</h1>

			<ScheduleTable
				classes={classes}
				isUser={true}
				isHitory={true}
				studios={studios}
			/>
			<UserSchedulePagination
				lastpage={Math.ceil(totalItem / 10)}
				setOffset={setOffset}
			/>
		</>
	);
};

export default UserClassHistory;
