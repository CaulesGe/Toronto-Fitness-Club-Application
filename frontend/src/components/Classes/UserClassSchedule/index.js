import React, { useState, useEffect } from 'react';
import ScheduleTable from '../ScheduleTable/ScheduleTable';
import { useNavigate } from 'react-router-dom';
import { UserSchedulePagination } from '../Pagination/Pagination';
import { API_BASE_URL } from '../../../config';

const UserSchedule = () => {
	const [classes, setClasses] = useState([]);
	const [offset, setOffset] = useState(0);
	const [totalItem, setTotalItem] = useState(1);
	const [reload, setReload] = useState(false);
	const [studios, setStudios] = useState([]);

	let token = localStorage.getItem('token');
	let navigate = useNavigate();

	useEffect(() => {
		if (token === null) {
			navigate('/login');
		}
		fetch(`${API_BASE_URL}/classes/schedule?offset=${offset}`, {
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
				console.log(classes);
			});

		fetch(
			`${API_BASE_URL}/studios/all/?longitude=${1}&latitude=${1}&offset=${0}&limit=${50}`
		)
			.then((res) => res.json())
			.then((json) => {
				setStudios(json.results);
			});
	}, [offset, token, reload, navigate]);

	return (
		<>
			<h1 className="schedule-title">My Class Schedule</h1>
			<ScheduleTable
				classes={classes}
				isUser={true}
				isHitory={false}
				reload={reload}
				setReload={setReload}
				studios={studios}
				setUserOffset={setOffset}
			/>
			<UserSchedulePagination
				lastpage={Math.ceil(totalItem / 10)}
				offset={offset}
				setOffset={setOffset}
			/>
		</>
	);
};

export default UserSchedule;
