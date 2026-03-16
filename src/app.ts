import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import adminRouter from './routes/admin.routes';

const app=express();


app.use(express.json());

app.use(cookieParser());

app.get('/healthcheck',(req,res)=>{
    res.send("Health is Ok!");
})

app.use('/auth',authRouter);
app.use('/user',userRouter);
app.use('/admin',adminRouter)


export default app;