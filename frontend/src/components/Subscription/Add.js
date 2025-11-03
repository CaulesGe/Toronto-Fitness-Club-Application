import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';


const theme = createTheme();

export default function Add() {

    const [plans, setPlans] = useState()

    const token = localStorage.getItem('token')
    const [select, setSelect] = useState(1)
    const [redirect, setRedirect] = useState(false)

    useEffect(() => {
        fetch(`${API_BASE_URL}/subscription/manage/`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.status === 200) setRedirect(true)
                return
            })
    }, [])

    useEffect(() => {
        fetch(`${API_BASE_URL}/subscription/plans/`, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(json => setPlans(json.results))
    }, [])

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(event.currentTarget)
        const data = new FormData(event.currentTarget);
        data.append('plan', select)
        fetch(`${API_BASE_URL}/subscription/manage/`, {
            method: 'POST', body: data, headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                setRedirect(true)
                response.json()
            })
            .then(json => json)
    }

    const handleSelect = (event) => {
        setSelect(event.target.value)
    }


    if (!token) return <Navigate to='/login' />
    if (redirect) return <Navigate to='/subscription/edit' />
    if (!plans) return <center><h1>Loading ...</h1></center>

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
                        You do not have a plan, You can subscribe to a plan here
                    </Typography>

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
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Submit
                        </Button>

                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}