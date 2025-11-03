
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
import React, {useState, useEffect, useMemo} from "react";
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import './Album.css';
import {GoogleMap, useLoadScript, MarkerF} from '@react-google-maps/api';
import TextField from '@mui/material/TextField';

import Button from '@mui/material/Button';

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
    const [longitude, setLongitude] = useState(0);
    const [latitude, setLatitude] = useState(0);
    const [studios, setStudios] = useState();
    const [whetherGetLocation, setWhetherGetLocation] = useState(false);
    //const [info, setInfo] = useState();
    
  
    getLocation();

    useEffect(() => {
      getLocation();
    }, [longitude, latitude, whetherGetLocation])
    
    useEffect(() => {
         fetch(`${API_BASE_URL}/studios/all/?search=${query.search}&class_name=${query.class_name}&class_coach=${query.class_coach}&amenity_type=${query.amenity_type}&longitude=${longitude}&latitude=${latitude}&name=${query.name}&offset=${query.page * 9}&limit=9`)
        .then(res => res.json())
        .then(json => {setStudios(json.results)
          setTotalItem(json.count);
        })
      
        
    }, [longitude, latitude, query, whetherGetLocation])


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
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setWhetherGetLocation(true);
       
        x.innerHTML = "Your location:" + "<br>Latitude: " + position.coords.latitude +
      "<br>Longitude: " + position.coords.longitude;
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
        
      <p id="demo"></p>
        <Container sx={{ py: 8 }} maxWidth="md">
          {/* End hero unit */}

        
        
        {isLoaded && studios &&
            <GoogleMap zoom={10} center={{lat: 44, lng: -80}} mapContainerClassName="map-container">
              
              {          
              studios.map((studio, index) => {
               return <MarkerF key={index} position={{lat: studio.latitude, lng: studio.longitude}} label={studio.name} ></MarkerF>     
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
                      onChange={(event) => {
                        
                          setQuery({...query, search: event.target.value, page: 0});
                      }}
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

