import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert'
import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';


const Success = () => {

   const [open, setOpen] = React.useState(true);

   return (
      <Box sx={{ width: '100%' }}>
         <Collapse in={open}>
            <Alert
               action={
                  <IconButton
                     aria-label="close"
                     color="inherit"
                     size="small"
                     onClick={() => {
                        setOpen(false);
                     }}
                  >
                     <CloseIcon fontSize="inherit" />
                  </IconButton>
               }
               sx={{ mb: 2 }}
            >
               your changes has been made
            </Alert>
         </Collapse>
      </Box>
   );
}

const theme = createTheme();


export default function Edit() {

   const token = localStorage.getItem('token')

   const [plans, setPlans] = useState()
   const [current, setCurrent] = useState()
   const [select, setSelect] = useState(1)
   const [redirect, setRedirect] = useState(false)
   const [schedule, setSchedule] = useState()
   const [success, setSuccess] = useState()


   useEffect(() => {
      fetch('http://localhost:8000/subscription/plans/', {
         method: 'GET'
      })
         .then(response => response.json())
         .then(json => {
            setPlans(json.results)
         })
   }, [])

   useEffect(() => {
      fetch('http://localhost:8000/subscription/payment/future/', {
         method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      })
         .then(response => response.json())
         .then(json => {
            setSchedule(json)
         })
   }, [current])

   useEffect(() => {
      fetch('http://localhost:8000/subscription/manage/', {
         method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      })
         .then(response => {
            if (response.status !== 200) setRedirect(true)
            else return response.json()
         })
         .then(json => {
            setCurrent(json)
            setSelect(json.plan)
         })
   }, [])


   const handleSubmit = (event) => {
      setSuccess(false)
      event.preventDefault();
      console.log(event.currentTarget)
      const data = new FormData(event.currentTarget);
      data.append('plan', select)
      fetch('http://localhost:8000/subscription/manage/', {
         method: 'PUT', body: data, headers: { 'Authorization': `Bearer ${token}` }
      })
         .then(response => {
            setSuccess(true)
            return response.json()
         })
         .then(json => setCurrent(json))
   }

   const handleSelect = (event) => {
      setSelect(event.target.value)
   }

   const handleClick = () => {
      const confirmBox = window.confirm(
         "Do you really want to delete your subscription?"
      )

      if (confirmBox) {
         setSuccess(true)
         fetch('http://localhost:8000/subscription/manage/', {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
         })
            .then(() => setRedirect(true))
      } else return
   }

   if (!token) return <Navigate to='/login' />
   if (redirect) return <Navigate to='/subscription/add' />
   if (!plans || !current || !schedule) return <center><h1>Loading ...</h1></center>

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

               <h2>Your subscription</h2>
               <h4 style={{ margin: 1 }}>Start date: {current.date}</h4>
               <h4 style={{ margin: 1 }}>Your card: {current.card}</h4>
               <h4 style={{ margin: 1 }}>Your Payment schedule: {schedule.future}</h4>
               <h4>Fill the form below to edit your subscription</h4>

               <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>

                  <InputLabel id="label">Select Plan</InputLabel>
                  <Select
                     labelId="label"
                     fullWidth
                     value={select}
                     onChange={handleSelect}
                  >

                     {plans.map(plan => <MenuItem value={plan.id} key={plan.id}> {plan.amount}$ per {plan.duration}</MenuItem>)}

                  </Select>

                  <TextField
                     margin="normal"
                     required
                     fullWidth
                     id="card"
                     label="card number"
                     name="card"
                     defaultValue={current.card}
                  />

                  <Button
                     type="submit"
                     fullWidth
                     variant="contained"
                     sx={{ mt: 3, mb: 2 }}
                  >
                     Submit
                  </Button>

                  {success ? <Success /> : null}
               </Box>
               <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  color='error'
                  onClick={handleClick}
               >
                  Cancel your subscription
               </Button>
            </Box>
         </Container>
      </ThemeProvider>
   );
}