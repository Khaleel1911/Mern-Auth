import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes';


const app=express();


app.use(express.json());

app.use(cookieParser());

app.get('/healthcheck',(req,res)=>{
    res.send("Health is Ok!");
})

app.use('/auth',authRouter)


export default app;