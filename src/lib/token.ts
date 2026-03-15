import  jwt  from "jsonwebtoken";
import { ObjectId } from "mongoose";

export function createAccessToken(
    userId:ObjectId,
    role:"user" | "admin",
    tokenVersion:number
){
    const payload={sub:userId,role,tokenVersion};

    const token= jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET!,
        {
            expiresIn:'15m'
        }
    )

    return token;
}

export function createRefreshToken(
    userId:ObjectId,
    tokenVersion:number
){
    const payload={sub:userId,tokenVersion};

    return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET!,
        {
            expiresIn:'7d'
        }
    )
}