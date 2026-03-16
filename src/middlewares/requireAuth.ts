import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/token";
import { User } from "../models/user.model";


async function requireAuth(req:Request,res:Response,next:NextFunction){

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message:"You are not authorized!"
        })
    }

    const token=authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Token missing"
        });
        }

    try {
        const payload= verifyAccessToken(token);

        const user= await User.findById(payload.sub);

        if(!user){
            return res.status(401).json({
                message: "User not found!"
            })
        }

        if(user.tokenVersion !== payload.tokenVersion){
            return res.status(401).json({
                message:"Token Invalidated!"
            })
        }

        const authReq=req as any;

        authReq.user={
            id:user._id,
            email: user.email,
            name: user.name,
            role : user.role,
            isEmailVerified: user.isEmailVerified
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            message: "Invalid token or Expired"
        })
    }

}

export default requireAuth;