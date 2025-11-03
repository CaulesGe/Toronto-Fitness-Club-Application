import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import * as React from 'react';
import { API_BASE_URL } from '../../config';

import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar'
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CloseIcon from '@mui/icons-material/Close';

import { createTheme, ThemeProvider } from '@mui/material/styles';


const theme = createTheme();

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

const Edit = ({ account }) => {


   const [success, setSuccess] = useState(false)

   const [user, setUser] = useState(account)

   const [ispasswordError, setIspasswordError] = useState(false)
   const [passwordError, setPasswordError] = useState('')

   const [ispassword2Error, setIspassword2Error] = useState(false)
   const [password2Error, setPassword2Error] = useState('')

   const [isemailError, setIsemailError] = useState(false)
   const [emailError, setEmailError] = useState('')

   const [isphoneError, setIsphoneError] = useState(false)
   const [phoneError, setPhoneError] = useState('')

   const [isavatarError, setIsavatarError] = useState(false)
   const [avatarError, setAvatarError] = useState(false)

   const [password, setPassword] = useState('')
   const [password2, setPassword2] = useState('')

   
   const handlePhone = (event) => {
      if (isNaN(event.target.value) || event.target.value.length !== 10) {
         setIsphoneError(true)
         setPhoneError('phone number is invalid')
         return
      }
      setIsphoneError(false)
      setPhoneError('')
   }

   const updatePassword = (event) => { setPassword(event.target.value) }

   const updatePassword2 = (event) => { setPassword2(event.target.value) }

   useEffect(() => {
      if (password !== password2 && password && password2) {
         setIspasswordError(true)
         setPasswordError('Passwords do not match')
         return
      }

      setIspasswordError(false)
      setPasswordError('')

   }, [password, password2])

   const handleSubmit = (event) => {

      setSuccess(false)
      const token = localStorage.getItem('token')
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      fetch(`${API_BASE_URL}/accounts/profile/`, {
         method: 'PUT', body: data, headers: { 'Authorization': `Bearer ${token}` }
      })
         .then(response => response.json())
         .then(json => {

            if (json.username) {
               setSuccess(true)
               setUser(json)

               setIspasswordError(false)
               setIspassword2Error(false)
               setIsemailError(false)
               setIsphoneError(false)
               setIsavatarError(false)

               setPasswordError('')
               setPassword2Error('')
               setEmailError('')
               setPhoneError('')
               setAvatarError('')
               return
            }

            setSuccess(false)

            if (json.password) {
               setIspasswordError(true)
               setPasswordError(json.password)
            } else setIspasswordError(false)

            if (json.password2 || json.passwords) {
               setIspassword2Error(true)
               if (json.password2) {
                  setPassword2Error(json.password2)
               } else if (json.passwords) {
                  setPassword2Error(json.passwords)
               }
            } else setIspassword2Error(false)

            if (json.email) {
               setIsemailError(true)
               setEmailError(json.email)
            } else setIsemailError(false)

            if (json.phone) {
               setIsphoneError(true)
               setPhoneError(json.phone)
            } else setIsphoneError(false)

            if (json.avatar) {
               setIsavatarError(true)
               setAvatarError(json.avatar)
            } else {
               setIsavatarError(false)
               setAvatarError('')
            }
         })
         .catch(() => { })
   };

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
               <h1> Welcome, {user.username}</h1>
               <span>Fill the form below to edit your profile</span>

               <Avatar src={user.avatar}></Avatar>

               <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>

                  <TextField
                     error={ispasswordError}
                     helperText={passwordError}
                     size='small'
                     margin="normal"
                     fullWidth
                     name="password"
                     label="password"
                     type="password"
                     id="password"
                     onChange={updatePassword}
                  />

                  <TextField
                     error={ispassword2Error}
                     helperText={password2Error}
                     size='small'
                     margin="normal"
                     fullWidth
                     name="password2"
                     label="repeat password"
                     type="password"
                     id="password2"
                     onChange={updatePassword2}
                  />

                  <TextField
                     error={isemailError}
                     helperText={emailError}
                     size='small'
                     margin="normal"
                     fullWidth
                     name="email"
                     label="email"
                     type="email"
                     id="email"
                     defaultValue={user.email}
                  />

                  <TextField
                     size='small'
                     margin="normal"
                     fullWidth
                     id="first_name"
                     label="first name"
                     name="first_name"
                     defaultValue={user.first_name}
                  />

                  <TextField
                     size='small'
                     margin="normal"
                     fullWidth
                     id="last_name"
                     label="last name"
                     name="last_name"
                     defaultValue={user.last_name}
                  />

                  <TextField
                     error={isphoneError}
                     helperText={phoneError}
                     size='small'
                     margin="normal"
                     required
                     fullWidth
                     id="phone"
                     label="phone number - exactly 10 integers"
                     name="phone"
                     defaultValue={user.phone}
                     onChange={handlePhone}
                  />

                  {isavatarError ? <div style={{ color: 'red', margin: 10 }}> {avatarError} </div> : null}

                  <label>Select new avatar</label>
                  <input accept="image/*" type="file" name='avatar' id='avatar' />

                  <Button
                     type="submit"
                     fullWidth
                     variant="contained"
                     sx={{ mt: 3, mb: 2 }}
                  >
                     Click to change your profile
                  </Button>

                  {success ? <Success /> : null}
               </Box>
            </Box>
         </Container>
      </ThemeProvider>
   );
}


export default function Profile() {

   const [data, setData] = useState()
   const [redirect, setRedirect] = useState(false)

   const token = localStorage.getItem('token')

   useEffect(() => {
      fetch(`${API_BASE_URL}/accounts/profile/`, {
         method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      })
         .then(response => {
            if (response.status == 200) return response.json()
            else setRedirect(true)
         })
         .then(json => setData(json))

   }, [])

   if (redirect) return <Navigate to='/login' />

   if (!data) return <center><h1>Loading ...</h1></center>

   return <>
      <Edit account={data} />
   </>
}