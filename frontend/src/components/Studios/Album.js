
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
import {useState, useEffect, useMemo, useRef} from "react";
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './Album.css';
import { useLoadScript } from '@react-google-maps/api';
import TextField from '@mui/material/TextField';

import Button from '@mui/material/Button';

import useAdaptiveMode from '../../hooks/AdaptiveMode';
import Map from './Map';

const theme = createTheme();



export default function Album() {

  const {isLoaded} = useLoadScript({googleMapsApiKey: "AIzaSyA7SCCkx8BeyK13Jo-NDiGPkCDqxjpGt14"});


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
  const [studios, setStudios] = useState();            // page slice (paginated)
  const [allStudios, setAllStudios] = useState([]);    // full set for map markers
  const [locationError, setLocationError] = useState('');
  //const [fps, avgFps] = useFPS(5000);
  //const netWorkInfo = useNetworkInfo();
  const mode = useAdaptiveMode();
  const pageSize = useMemo(() => (mode === 'standard' ? 9 : 6), [mode]);
  //const [probe, setProbe] = useState(null);


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
  
  // Fetch paginated slice
  useEffect(() => {
    if (longitude !== null && latitude !== null) {
      const url = `${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}&offset=${query.page * pageSize}&limit=${pageSize}`;
      fetch(url)
        .then(res => res.json())
        .then(json => {
          setStudios(json.results);
          setTotalItem(json.count);
        });
    }
  }, [longitude, latitude, query.search, query.class_name, query.class_coach, query.amenity_type, query.name, query.page, pageSize]);

  // Fetch full list (for map markers) independent of pagination
  useEffect(() => {
    if (longitude !== null && latitude !== null && mode !== 'standard') {
      // Use a large limit; could be replaced with backend support for no pagination
      const url = `${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}&offset=0&limit=500`;
      fetch(url)
        .then(res => res.json())
        .then(json => {
          setAllStudios(json.results || []);
        });
    }
  }, [longitude, latitude, query.search, query.class_name, query.class_coach, query.amenity_type, query.name, mode]);

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
  

  // Adjust map and page size based on performance
  // async function probeNetwork() {
  //   const start = performance.now();
  //   // Tiny resource (cache-busting)
  //   const url = '/favicon.ico?_probe=' + Math.random();
  //   try {
  //     const res = await fetch(url, { cache: 'no-store' });
  //     const blob = await res.blob(); // read so it's measured
  //     const duration = performance.now() - start; // ms
  //     // Very rough downlink estimate: bytes / seconds
  //     const kb = blob.size / 1024;
  //     const seconds = Math.max(duration / 1000, 0.001);
  //     const kbps = (kb / seconds);
  //     return { duration, kbps };
  //   } catch (err) {
  //     return { error: true, err };
  //   }
  // }

  // useEffect(() => {
  //   async function runProbe() {
  //     const result = await probeNetwork();
  //     setProbe(result);
  //   }

  //   runProbe();
  //   const interval = setInterval(runProbe, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  // const networkPoor = useMemo(() => {
  //   if (!netWorkInfo.supported) return false; // don't punish when unknown
  //   const slowType = netWorkInfo.effectiveType === "slow-2g" || netWorkInfo.effectiveType === "2g" || netWorkInfo.effectiveType === "3g";
  //   const lowDownlink = typeof netWorkInfo.downlink === "number" && netWorkInfo.downlink < 1.5; // Mbps threshold
  //   const highRtt = typeof netWorkInfo.rtt === "number" && netWorkInfo.rtt > 300;
  //   const lowKbps = probe && probe.kbps < 150;
  //   return slowType || lowDownlink || highRtt || lowKbps;
  // }, [netWorkInfo, probe]);

  // useEffect(()  => {
  //   if (mode === 'standard' && (avgFps < 30 || networkPoor)) {
  //     setMode('degraded')
  //     setPageSize(3);
  //   } else if (mode === 'degraded' && (avgFps >= 30 && !networkPoor)) {
  //     setMode('standard')
  //     setPageSize(9);
  //   }
  //   console.log(`Mode: ${mode}, Avg FPS: ${avgFps}, Network Poor: ${networkPoor}`)
  // }, [avgFps, networkPoor, mode])


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
        
        {isLoaded && mode === 'standard' &&
          <Map studios={allStudios} />
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
                        src={mode === 'standard' ? require('./gym.jpg') : require('./gym_low_res.jpg')}
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

        {query.page < Math.ceil(totalItem / pageSize) - 1 ? <Button variant="contained" onClick={() => setQuery({...query, page: query.page + 1})}>
					Next
			  </Button> : <></>}
      </div>
      
    </ThemeProvider>
    
    </>
  );
}

