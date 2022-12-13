import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { useEffect, useState } from "react";
import { Navigate } from 'react-router-dom';

const theme = createTheme();

export default function Register() {

   const [login, setLogin] = useState(false)

   const [isusernameError, setIsusernameError] = useState(false)
   const [usernameError, setUsernameError] = useState('')

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

   const handleSubmit = (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      fetch('http://localhost:8000/accounts/register/', {
         method: 'POST', body: data
      })
         .then(response => {
            if (response.status !== 200) {
               return response.json()
            } else {
               setLogin(true)
            }
         })
         .then(json => {
            if (json.username) {
               setUsernameError(json.username)
               setIsusernameError(true)
            } else setIsusernameError(false)

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
      if (password !== password2) {
         setIspassword2Error(true)
         setPassword2Error('passwords do not match')
         return
      }

      setIspassword2Error(false)
      setPassword2Error('')

   }, [password, password2])


   if (login) return <Navigate to='/login' />

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

               <Typography component="h1" variant="h5">
                  Register
               </Typography>

               <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                  <TextField
                     error={isusernameError}
                     helperText={usernameError}
                     size='small'
                     margin="normal"
                     required
                     fullWidth
                     id="username"
                     label="username"
                     name="username"
                  />

                  <TextField
                     error={ispasswordError}
                     helperText={passwordError}
                     size='small'
                     margin="normal"
                     required
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
                     required
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
                  />

                  <TextField
                     size='small'
                     margin="normal"
                     fullWidth
                     id="first_name"
                     label="first name"
                     name="first_name"
                  />

                  <TextField
                     size='small'
                     margin="normal"
                     fullWidth
                     id="last_name"
                     label="last name"
                     name="last_name"
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
                     onChange={handlePhone}
                  />

                  {isavatarError ? <div style={{ color: 'red', margin: 10 }}> {avatarError} </div> : null}

                  <label>Avatar</label>
                  <input required accept="image/*" type="file" name='avatar' id='avatar' />

                  <Button
                     type="submit"
                     fullWidth
                     variant="contained"
                     sx={{ mt: 3, mb: 2 }}
                  >
                     Submit
                  </Button>
                  <Grid container>
                     <Grid item>
                        <Link href="/login" variant="body2">
                           {"Already have account? Login here"}
                        </Link>
                     </Grid>
                  </Grid>
               </Box>
            </Box>
         </Container>
      </ThemeProvider>
   );
}