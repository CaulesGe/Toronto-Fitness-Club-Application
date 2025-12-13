
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
import MapWrapper from './MapWrapper';

const theme = createTheme();



export default function Album() {

  //const {isLoaded} = useLoadScript({googleMapsApiKey: "AIzaSyA7SCCkx8BeyK13Jo-NDiGPkCDqxjpGt14"});


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
  const mode = useAdaptiveMode();
  //const [fps, avgFps] = useFPS(5000);
  //const netWorkInfo = useNetworkInfo();
  const [effectivePageSize, setEffectivePageSize] = useState(9);
  const [pageUrl, setPageUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const [showMap, setShowMap] = useState(false);
  //const [probe, setProbe] = useState(null);

  useEffect(() => {
    if (mode && mode === 'standard') {
      setShowMap(true);
    }
    console.log("Adaptive mode in Album.js:", mode);
  }, [mode]);

  const normalizePageUrl = (u) => {
    if (!u) return null;
    // If DRF returns an absolute URL to internal service, replace origin with API_BASE_URL
    try {
      const parsed = new URL(u);
      return `${API_BASE_URL}${parsed.pathname}${parsed.search}`;
    } catch {
      // If it's already a relative path like "/api/...", make it absolute
      return u.startsWith("/") ? `${API_BASE_URL}${u}` : u;
    }
  };

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
  
  // Fetch paginated slice (backend-driven pagination via next/previous URLs)
  useEffect(() => {
    if (longitude !== null && latitude !== null) {
      // Build the first-page URL whenever filters/location/page changes.
      // (page changes will be handled by next/prev buttons; keeping query.page in deps is fine.)
      const firstUrl = `${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}`;
      setPageUrl(firstUrl);
    }
  }, [longitude, latitude, query.search, query.class_name, query.class_coach, query.amenity_type, query.name]);

  useEffect(() => {
    if (!pageUrl) return;

    fetch(pageUrl)
      .then(res => res.json())
      .then(json => {
        setStudios(json.results);
        setTotalItem(json.count);

        // backend-provided pagination links
        setNextUrl(normalizePageUrl(json.next));
        setPrevUrl(normalizePageUrl(json.previous));

        // For your existing UI message (6 vs 9), infer server limit from URLs if present.
        // Fallback to results length only when limit is absent.
        const urlToParse = json.next || json.previous || pageUrl;
        try {
          const u = new URL(urlToParse);
          const lim = u.searchParams.get("limit");
          setEffectivePageSize(lim ? Number(lim) : (json.results?.length || 9));
        } catch {
          setEffectivePageSize(json.results?.length || 9);
        }
      });
  }, [pageUrl]);

  // Fetch full list (for map markers) independent of pagination
  useEffect(() => {
    if (longitude !== null && latitude !== null && mode === 'standard') {
      // Use a large limit; could be replaced with backend support for no pagination
      const url = `${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}&offset=0&limit=500`;
      fetch(url)
        .then(res => res.json())
        .then(json => {
          setAllStudios(json.results || []);
        });
    } else if (mode === 'degraded') {
      // optional: free memory / avoid stale heavy state
      setAllStudios([]);
    }
  }, [longitude, latitude, query.search, query.class_name, query.class_coach, query.amenity_type, query.name, mode]);

  // handler used by TextField (debounced)
  function handleSearchChange(event) {
    let debountTime = 300;
    if (mode === 'degraded') {
      debountTime = 1000;
    }
    const value = event.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setQuery(prev => ({ ...prev, search: value, page: 0 }));
    }, debountTime); // debounce
  }

  // clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

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
        
          {/* {isLoaded && mode === 'standard' &&
            <Map studios={allStudios} mode={mode} />
          }   */}
          {showMap && (
            <MapWrapper
              studios={mode === 'standard' ? allStudios : (studios || [])}
              mode={mode}
              longitude={longitude}
              latitude={latitude}
            />
          )}
        
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

          {effectivePageSize== 6 &&
            <Typography align="center" sx={{ mt: 2, mb: 2 }}>
              Page size is reduced due to high workload.
            </Typography>
          }

          <Grid container spacing={4}>
   
            {studios && studios.map((studio, index) => (
              
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
        {prevUrl ? 
        <Button variant="contained" onClick={() => setPageUrl(prevUrl)}>
					Prev
			  </Button> : <></> 
        }

        {nextUrl ? 
        <Button variant="contained" onClick={() => setPageUrl(nextUrl)}>
					Next
			  </Button> : <></>}
      </div>
      
    </ThemeProvider>
    
    </>
  );
}

