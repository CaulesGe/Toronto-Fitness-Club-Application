import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import './NavLinks.css';

function MyAccount() {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const open = Boolean(anchorEl);
	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	const navigate = useNavigate();

	return (
		<div>
			<Button
				id="MyAccount-button"
				variant="text"
				aria-controls={open ? 'basic-menu' : undefined}
				aria-haspopup="true"
				aria-expanded={open ? 'true' : undefined}
				onClick={handleClick}
			>
				My Account
			</Button>
			<Menu
				id="basic-menu"
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					'aria-labelledby': 'basic-button',
				}}
			>
				<MenuItem
					onClick={() => {
						handleClose();
						navigate('/class-schedule');
					}}
				>
					CLASS SCHEDULE
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleClose();
						navigate('/class-history');
					}}
				>
					CLASS HISTORY
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleClose();
						navigate('payment/history');
					}}
				>
					PAYMENT HISTORY
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleClose();
						navigate('/profile');
					}}
				>
					PROFILE
				</MenuItem>
				<MenuItem
					onClick={() => {
						handleClose();
						navigate('/logout');
					}}
				>
					LOG OUT
				</MenuItem>
			</Menu>
		</div>
	);
}

const NavLinks = (props) => {
	let token = localStorage.getItem('token');
	const [firstStudioId, setFirstStudioId] = useState(null);
	const navigate = useNavigate();

	// Fetch the first studio ID on mount
	useEffect(() => {
		// Use Toronto coordinates as default
		fetch(`${process.env.REACT_APP_API_BASE_URL || '/api'}/studios/all/?longitude=${-79.3832}&latitude=${43.6532}&offset=${0}&limit=${1}`)
			.then((res) => res.json())
			.then((json) => {
				if (json.results && json.results.length > 0) {
					setFirstStudioId(json.results[0].id);
				}
			})
			.catch((error) => {
				console.error('Error fetching first studio:', error);
			});
	}, []);

	const handleClassesClick = (e) => {
		if (firstStudioId) {
			navigate(`/classes/${firstStudioId}`);
		} else {
			// Fallback to studios page if no studio found
			navigate('/studios');
		}
		e.preventDefault();
	};

	return (
		<ul className="nav-links">
			<li>
				<NavLink to="/studios" onClick={() => window.location.replace('/studios')}>STUDIOS</NavLink>
			</li>
			<li>
				<NavLink to={firstStudioId ? `/classes/${firstStudioId}` : '/studios'} onClick={handleClassesClick}>
					CLASSES
				</NavLink>
			</li>

			<li>
				<NavLink to="/subscription/edit">SUBSCRIPTION</NavLink>
			</li>
			<li>{token ? <MyAccount /> : <NavLink to="/login">LOGIN</NavLink>}</li>
		</ul>
	);
};

export default NavLinks;
