import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { useState } from 'react';

const theme = createTheme()

export default function Login() {
	const [error, setError] = useState([]);
	const [profile, setProfile] = useState(false);

	const handleSubmit = (event) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		fetch('http://localhost:8000/accounts/login/', {
			method: 'POST',
			body: data,
		})
			.then(function (response) {
				if (response.status === 401) {
					setError('No active account found with the given credentials');
					return;
				} else if (response.status !== 200) {
					setError('The given fields are required');
					return;
				} else {
					return response.json();
				}
			})
			.then((json) => {
				localStorage.setItem('token', json.access);
				setProfile(true);
			})
			.catch(() => {});
	};

	if (profile) {
		window.location.replace('/profile');
	}

	return (
		<ThemeProvider theme={theme}>
			<Container component="main" maxWidth="xs">
				<CssBaseline />
				<Box
					sx={{
						marginTop: 8,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
						<LockOutlinedIcon />
					</Avatar>
					<Typography component="h1" variant="h5">
						Login
					</Typography>
					<Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
						<TextField
							margin="normal"
							required
							fullWidth
							id="username"
							label="username"
							name="username"
						/>
						<TextField
							margin="normal"
							required
							fullWidth
							name="password"
							label="Password"
							type="password"
							id="password"
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							sx={{ mt: 3, mb: 2 }}
                     color='primary'
						>
							Submit
						</Button>
						<Grid container>
							<Grid item>
								<Link href="/register" variant="body2">
									{"Don't have an account? Register here"}
								</Link>
							</Grid>
						</Grid>
					</Box>
					<div style={{ color: 'red', margin: 50 }}> {error} </div>
				</Box>
			</Container>
		</ThemeProvider>
	);
}
