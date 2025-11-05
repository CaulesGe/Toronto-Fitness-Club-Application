import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';

import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
//import { Link } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './Details.css';
import { OpenInBrowser } from '@mui/icons-material';

import { ImageListItem, ImageList } from '@mui/material';

const theme = createTheme();

export default function Details() {
	const studioId = useParams().studioId;
	const [info, setInfo] = useState();
  const [longitude, setLongitude] = useState();
  const [latitude, setLatitude] = useState();
  const [locationError, setLocationError] = useState('');
  

	let navigate = useNavigate();

	// Get user's geolocation on mount
	useEffect(() => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					setLongitude(position.coords.longitude);
					setLatitude(position.coords.latitude);
				},
				(error) => {
					switch(error.code) {
						case error.PERMISSION_DENIED:
							setLocationError("User denied the request for Geolocation. Please enable this feature in settings.");
							break;
						case error.POSITION_UNAVAILABLE:
							setLocationError("Location information is unavailable.");
							break;
						case error.TIMEOUT:
							setLocationError("The request to get user location timed out.");
							break;
						default:
							setLocationError("An unknown error occurred.");
							break;
					}
				}
			);
		} else {
			setLocationError("Geolocation is not supported by this browser.");
		}
	}, []);

	// Fetch studio details when we have coordinates
	useEffect(() => {
		if (longitude !== undefined && latitude !== undefined) {
			fetch(`${API_BASE_URL}/studios/${studioId}/details/?longitude=${longitude}&latitude=${latitude}`)
				.then((res) => res.json())
				.then((json) => {
					setInfo(json);
				});
		}
	}, [studioId, longitude, latitude]);

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };


	return (
		<ThemeProvider theme={theme}>
     
			<CssBaseline />

			<main>
        
				{/* Hero unit */}
				<Box
					sx={{
						bgcolor: 'background.paper',
						pt: 8,
						pb: 6,
					}}
				>
					<Container maxWidth="sm">
						<Typography
							component="h1"
							variant="h2"
							align="center"
							color="text.primary"
							gutterBottom
						>
							{info && info.name}
						</Typography>
						<Typography
							variant="h5"
							align="center"
							color="text.secondary"
							paragraph
						>
							Details about {info && info.name}
						</Typography>
						<Stack
							sx={{ pt: 4 }}
							direction="row"
							spacing={2}
							justifyContent="center"
						>
							<Button
								variant="contained"
								onClick={() => navigate('/classes/' + studioId)}
							>
								Class Schedule
							</Button>
              {info && longitude && latitude && <Button variant="outlined" onClick={() => openInNewTab(`
https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${info.latitude},${info.longitude}&travelmode=Yourmode`)}>
              To this place</Button>}
						</Stack>
  
          
					</Container>

				</Box>

				<Container sx={{ py: 8 }} maxWidth="md">
					{/* End hero unit */}
          
					{/* Show location error if any */}
					{locationError && (
						<Typography variant="body1" color="error" align="center" sx={{ mb: 2 }}>
							{locationError}
						</Typography>
					)}

					{/* Show loading state while fetching location */}
					{!longitude && !latitude && !locationError && (
						<Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
							Getting your location...
						</Typography>
					)}


					<table>
						<thead>
							<tr>
								<th>Studio name</th>
								<th>Address</th>
								<th>Postal Code</th>
								<th>Phone Number</th>
								<th>Distance (km)</th>
							</tr>
						</thead>
						<tbody>
							{info && (
								<>
									<tr>
										<td style={{ margin: 14 }}>{info.name}</td>
										<td>{info.address}</td>
										<td>{info['postal code']}</td>
										<td>{info['phone number']}</td>
										<td>{Math.round(info['distance (km)'] * 100) / 100}</td>
									</tr>
								</>
							)}
						</tbody>
					</table>{' '}
					<br />
					<table>
						<thead>
							<tr>
								<th id="title">Amenities</th>
							</tr>
							<tr className='amenity'>
								<th>Type</th>
								<th>Quantity</th>
							</tr>
						</thead>

						<tbody className='amenity'>
							{info &&
								info.amenities.map((x, index) => (
									<tr key={index}>
										<td>{x.type}</td>
										<td>{x.quantity}</td>
									</tr>
								))}
						</tbody>
					</table>
					<div className="images">
						<ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
						{info &&
								Array.isArray(info.images) &&
								info.images.length > 0 &&
								info.images.map((x, index) => (
									<ImageListItem key={index}>
										<img key={index} className="center" src={x} alt="" width="500" height="600" />
									</ImageListItem>
									
								))}
						</ImageList>	
					</div>
				</Container>
			</main>

		
		</ThemeProvider>
	);
}
