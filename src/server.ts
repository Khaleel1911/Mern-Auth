import dotenv from 'dotenv';
import app from "./app";
import connectDB from "./config/db";
import http from 'http';


dotenv.config();

const port=process.env.PORT || 5000;

async function startServer(){
    
    await connectDB();

    const server=http.createServer(app);

    server.listen(port,()=>{
        console.log("Sever is running on port,",port);
    })
}


startServer().catch(err=>{
    console.log("Error while starting the server",err);
    process.exit(1);
})