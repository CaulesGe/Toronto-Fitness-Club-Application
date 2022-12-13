import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  

	let navigate = useNavigate();

	useEffect(() => {
		fetch(`http://127.0.0.1:8000/studios/${studioId}/details`)
			.then((res) => res.json())
			.then((json) => {
				setInfo(json);
			});
	}, [studioId]);

  getLocation();

  var x = document.getElementById("demo");

    function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
        
      } else { 
        x.innerHTML = "Geolocation is not supported by this browser.";
      }
    }

    function showPosition(position) {
      
      if (x) {
        setLongitude(position.coords.longitude);
        setLatitude(position.coords.latitude);
      }
      
    }

    function showError(error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          x.innerHTML = "User denied the request for Geolocation." + " <a href='https://support.google.com/chrome/answer/142065?hl=en'>Please enable this feature in setting.</a>"
          break;
        case error.POSITION_UNAVAILABLE:
          x.innerHTML = "Location information is unavailable."
          break;
        case error.TIMEOUT:
          x.innerHTML = "The request to get user location timed out."
          break;
        case error.UNKNOWN_ERROR:
          x.innerHTML = "An unknown error occurred."
          break;
      }
    }

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
          <p id="demo"></p>
          


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
							info.images !== [] &&
							info.images.map((x, index) => (
								<ImageListItem key={index}>
									<img key={index} class="center" src={x} alt="" width="500" height="600" />
								</ImageListItem>
								
							))}
						</ImageList>	
					</div>
				</Container>
			</main>

		
		</ThemeProvider>
	);
}
