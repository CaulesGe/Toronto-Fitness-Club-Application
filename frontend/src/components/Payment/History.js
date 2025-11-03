import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export default function History() {

    const token = localStorage.getItem('token')
    const [redirect, setRedirect] = useState(false)
    const [data, setData] = useState()


    useEffect(() => {
        fetch(`${API_BASE_URL}/subscription/payment/history/`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.status !== 200) {
                    setRedirect(true)
                    return
                } else return response.json()
            })
            .then(json => setData(json))
    }, [])

    const handleNext = () => {
        fetch(data.next, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.status !== 200) {
                    setRedirect(true)
                    return
                } else return response.json()
            })
            .then(json => setData(json))
    }

    const handlePrev = () => {
        fetch(data.previous, {
            method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => {
                if (response.status !== 200) {
                    setRedirect(true)
                    return
                } else return response.json()
            })
            .then(json => setData(json))
    }

    if (redirect || !token) return <Navigate to='/login' />
    if (!data) return <h1>Loading ...</h1>

    return (
        <>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Payment Amount</TableCell>
                            <TableCell align="center">Payment time</TableCell>
                            <TableCell align="center">Card number</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.results.map((payment, index) => (
                            <TableRow
                                key={index}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {payment.amount}
                                </TableCell>
                                <TableCell align="center">{payment.datetime.replace('T', '  ').slice(0, 17)}</TableCell>
                                <TableCell align="center">{payment.card}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack margin={5} alignItems='center' justifyContent='center' direction="row" spacing={2}>
                {data.previous ? <Button onClick={handlePrev} variant="contained">Prev</Button> : null}
                {data.next ? <Button onClick={handleNext} variant="contained">Next</Button> : null}
            </Stack>
        </>
    );
}