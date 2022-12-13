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

	return (
		<ul className="nav-links">
			<li>
				<NavLink to="/studios" onClick={() => window.location.replace('/studios')}>STUDIOS</NavLink>
			</li>
			<li>
				<NavLink to="/classes/1">CLASSES</NavLink>
			</li>

			<li>
				<NavLink to="/subscription/edit">SUBSCRIPTION</NavLink>
			</li>
			<li>{token ? <MyAccount /> : <NavLink to="/login">LOGIN</NavLink>}</li>
		</ul>
	);
};

export default NavLinks;
