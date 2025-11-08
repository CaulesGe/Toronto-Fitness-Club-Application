
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, {useState, useEffect, useMemo, useRef} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './Album.css';
import {GoogleMap, useLoadScript, MarkerF} from '@react-google-maps/api';
import TextField from '@mui/material/TextField';

import Button from '@mui/material/Button';

import useFPS from '../../hooks/FPS';

const theme = createTheme();



export default function Album() {

  const {isLoaded} = useLoadScript({googleMapsApiKey: "AIzaSyA7SCCkx8BeyK13Jo-NDiGPkCDqxjpGt14"});
  const navigate = useNavigate();

  const [query, setQuery] = useState({
    search: '', 
    page: 0,
    class_name: '',
    class_coach: '',
    amenity_type: '',
    name: ''
  });

  const [totalItem, setTotalItem] = useState(1);
  const [longitude, setLongitude] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [studios, setStudios] = useState();
  const [locationError, setLocationError] = useState('');
  const [fps, avgFps] = useFPS(5000);
  const [mode, setMode] = useState('standard');

  // ref used to debounce the search input
  const searchTimeout = useRef(null);

  // Get user's location once on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          switch(error.code) {
            case error.PERMISSION_DENIED:
              setLocationError("Location access denied. Please enable in browser settings.");
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Location information unavailable.");
              break;
            case error.TIMEOUT:
              setLocationError("Location request timed out.");
              break;
            default:
              setLocationError("An unknown error occurred.");
          }
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);
  
  useEffect(() => {
    // Only fetch when we have valid coordinates
    if (longitude !== null && latitude !== null) {
      fetch(`${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}&offset=${query.page * 9}&limit=9`)
        .then(res => res.json())
        .then(json => {
          setStudios(json.results)
          setTotalItem(json.count);
        })
    }
  }, [longitude, latitude, JSON.stringify(query)])

  // handler used by TextField (debounced)
  function handleSearchChange(event) {
    const value = event.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setQuery(prev => ({ ...prev, search: value, page: 0 }));
    }, 300); // 300ms debounce
  }

  // clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // 
  useEffect(()  => {
    if (avgFps < 30) {
      setMode('degraded')
    }
  })
    
  if (!studios) return <></>;



  return (
    <>

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
              Studios
            </Typography>
            <Typography variant="h5" align="center" color="text.secondary" paragraph>
              All studios of Toronto Fitness Club
            </Typography>
            <Stack
              sx={{ pt: 4 }}
              direction="row"
              spacing={2}
              justifyContent="center"
            >
             
            </Stack>
                          
          </Container>
        

        </Box>
        
        <Container sx={{ py: 8 }} maxWidth="md">
          {/* End hero unit */}

          {locationError && (
            <Typography color="error" align="center" sx={{ mb: 2 }}>
              {locationError}
            </Typography>
          )}
          {!locationError && latitude !== null && (
            <Typography align="center" sx={{ mb: 2 }}>
              Your location: Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
            </Typography>
          )}
          {!locationError && latitude === null && (
            <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
              Getting your location...
            </Typography>
          )}
        
        {isLoaded && studios && mode === 'standard' &&
            <GoogleMap zoom={10} center={{lat: 44, lng: -80}} mapContainerClassName="map-container">
              
              {          
                    studios.map((studio, index) => {
                     return (
                       <MarkerF
                         key={index}
                         position={{lat: studio.latitude, lng: studio.longitude}}
                         label={studio.name}
                         onClick={() => navigate(`/studios/${studio.id}/details/`)}
                       />
                     )
                    })}
            </GoogleMap>  
        }  
        
              <div className="searching">
                  <h1 id='search'>Search</h1><br />

          <TextField
                      className='input'
                      id="outlined-basic"
                      label="Studio, Amenity, Class, Coach"
                      variant="outlined"
            onChange={handleSearchChange}
                    />

            </div>


          <Grid container spacing={4}>
   
            {isLoaded && studios && studios.map((studio, index) => (
              
              <Grid item key={index} xs={12} sm={6} md={4}>

                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >

              
                  <CardMedia
                        component="img"
                        sx={{
                          // 16:9
                          pt: '16.25%',
                        }}
                        src={require('./gym.jpg')}
                        alt="random"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {studio.name}
                    </Typography>
                    <Typography>
                      
                      Address: {studio.address} <br/>
                      Distance from you (km): {Math.round(studio.distance * 10) / 10}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link to={`${studio.id}/details`} size="small">View</Link>
                  </CardActions>
                </Card>


              </Grid>
            ))}
          </Grid>
        </Container>
      </main>
      
      <div id='page'>
        {query.page > 0 ? 
        <Button variant="contained" onClick={() => setQuery({...query, page: query.page - 1})}>
					Prev
			  </Button> : <></> 
        }

        {query.page < Math.ceil(totalItem / 9) - 1 ? <Button variant="contained" onClick={() => setQuery({...query, page: query.page + 1})}>
					Next
			  </Button> : <></>}
      </div>
      
    </ThemeProvider>
    
    </>
  );
}

