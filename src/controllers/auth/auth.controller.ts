import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { loginSchema, registerSchema } from "./auth.schema";
import { comparePassword, hashPassword } from "../../lib/hash";
import jwt from 'jsonwebtoken';
import { sendEmail } from "../../lib/email";
import z, { success } from "zod";
import { createAccessToken,createRefreshToken, verifyRefreshToken } from "../../lib/token";
import crypto from 'crypto'


function getAppUrl(){
    return process.env.APP_URL || `http://localhost:${process.env.PORT}`;
}


export async function registerHandler(req: Request, res: Response) {

    try {

        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Invalid data!",
                errors: result.error.flatten()
            });
        }

        const { email, name, password } = result.data;

        const normalizedEmail = email.toLowerCase().trim();

        const isExistingUser = await User.findOne({ email: normalizedEmail });

        if (isExistingUser) {
            return res.status(409).json({
                message: "User already exists!"
            });
        }

        const hashedPassword= await hashPassword(password);

        const newUser=await User.create({
            email:normalizedEmail,
            passwordHash:hashedPassword,
            name: name,
            role:'user',

        })


        //email verification part
        const verifyToken= jwt.sign(
            {
            sub:newUser._id
            },
             process.env.JWT_ACCESS_SECRET!,
             {
                expiresIn:'1d'
             }
    )
    const verifyUrl= `${getAppUrl()}/auth/verify-email?token=${verifyToken}`

    await sendEmail(
        newUser.email,
        "Verify Your Email",
        `<p>Please verify your Email</p>
        <p><a href=${verifyUrl}>${verifyUrl}</a></p>`
    );

    return res.status(201).json({
        message:"Usr registered",
        user:{
            id:newUser._id,
            email:newUser.email,
            role:newUser.role,
            isEmailverified: newUser.isEmailVerified
        }
    })
    } catch (error) {
        console.log("Error while registering,", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }

}


export async function verifyEmailHandler(req:Request,res:Response){
    const token=req.query.token as string

    if(!token){
       return res.status(400).json({
            message: "Verifcation toeken is missing"
        })
    }

    try {
        const payload= jwt.verify(token,process.env.JWT_ACCESS_SECRET!) as {sub:string};
        const user=await User.findById(payload.sub);

        if(!user){
            return res.status(400).json({message:"User not found!"})
        }

        if(user.isEmailVerified){
            return res.json({
                message:"Email is already verified"
            })
        }

        user.isEmailVerified=true;
        await user.save();

        return res.status(201).json({
            success:true,
            message: "Email verified!"
        })

    } catch (error) {
        console.log("Error while verifying the email,", error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


export async function loginHandler(req:Request,res:Response){

    try{
    const result= loginSchema.safeParse(req.body);

    if(!result.success){
      return   res.status(400).json({
        success:false,
        message: "Invalid Data!"
      })
    }

    const{email,password}=result.data;

    const user=await User.findOne({email});

    if(!user){
        return res.status(400).json({
            success:false,
            message:"User not found!"
        })
    }

    const ok=await comparePassword(user.passwordHash,password);

    if(!ok){
        return res.status(400).json({
            success:false,
            message: "Invalid Password",
        })
    }

    if(!user.isEmailVerified){
        return res.status(403).json({
            message:"Please Verify you email before logging in"
        })
    }

    const accessToken= createAccessToken(user._id,user.role,user.tokenVersion);

    const refreshToken=createRefreshToken(user._id,user.tokenVersion);

    const isProd = process.env.NODE_ENV==="production"?true:false;

    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure: isProd,
        sameSite:'lax',
        maxAge: 7 * 24 * 60 *60* 1000
    })

    return res.status(200).json({
    success: true,
    message: "Login Successfull",
    accessToken,
    user:{
        id:user._id,
        email:user.email,
        role: user.role,
        isEmailVerifed: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled
    }
  });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message: "Internal Server Error"
        })
    }
}

export async function refreshHandler(req:Request,res:Response){
    try {
        const token=req.cookies?.refreshToken as string | undefined;
        if(!token){
            return res.status(401).json({
                message:'Refresh token missing.'
            })
        }

        const payload=verifyRefreshToken(token);

        const user=await User.findById(payload.sub);

        if(!user){
            return res.status(401).json({
                message:"User not found!"
            })
        }

        if(user.tokenVersion !== payload.tokenVersion){
             return res.status(401).json({
                message:"Refresh token invalidated."
            })
        }

        const newAccessToken = createAccessToken(
            user._id,
            user.role,
            user.tokenVersion
        )

        const newRefreshToken = createRefreshToken(user._id,user.tokenVersion);

        const isProd = process.env.NODE_ENV==="production"?true:false;

        res.cookie('refreshToken',newRefreshToken,{
            httpOnly:true,
            secure: isProd,
            sameSite:'lax',
            maxAge: 7 * 24 * 60 *60* 1000
        })

        return res.status(200).json({
        success: true,
        message: "Refres Token successfull.",
        newAccessToken,
        user:{
            id:user._id,
            email:user.email,
            role: user.role,
            isEmailVerifed: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled
        }
    });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Internal Server Error!"
        })
    }
}


export async function logoutHandler(req:Request,res:Response){
    const isProd=process.env.NODE_ENV==='production'?true:false;
    res.clearCookie('refreshToken',{
        httpOnly:true,
        secure: isProd,
        sameSite:'lax'
    });
    return res.status(200).json({
        message:"Logout Succesfull",
    })
}

export async function forgotPasswordHandler(req:Request,res:Response){
    const {email}=req.body as {email:string};

    if(!email){
        return res.status(400).json({
            message: "Email is required!"
        })
    }


    try {
        
        const user= await User.findOne({email});
    
        if(!user){
            return res.json({
                message: "If an account exists with this email.You will receive a Reset Email Shortly"
            })}

        const rawToken= crypto.randomBytes(32).toString('hex');

        const tokenHash= crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken=tokenHash;
        user.resetPasswordExpires=new Date(Date.now() + 15 * 60 * 1000);


        await user.save();

        const resetUrl=`${getAppUrl()}/auth/reset-password?token=${rawToken}`

        await sendEmail(
            user.email,
            "Reset Your password",
            `<p>click on link to reset password</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>`
        )

        return res.json({
                message: "If an account exists with this email.You will receive a Reset Email Shortly"})

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Internal Server Error"
        })
    } 
    
}


export async function resetPasswordHandler(req:Request,res:Response){
    const {token,password} = req.body as {token?:string;password?:string};

    if(!token){
        return res.status(400).json({
            message: "Reset token is missing"
        })
    }
    if(!password || password.length < 6){
        return res.status(400).json({
            message: "password must be atleast 6 chars long"
        })
    }

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user= await User.findOne({
            resetPasswordToken:tokenHash,
            resetPasswordExpires: {$gt:Date.now()}//checking for token expiry
        })

        if(!user){
            return res.status(400).json({
                message: "Invalid or expired token"
            })
        }

        const newPasswordHash=await hashPassword(password);

        user.passwordHash=newPasswordHash;
        user.resetPasswordExpires= null;
        user.resetPasswordToken="";

        user.tokenVersion= user.tokenVersion + 1;

        await user.save();

        return res.json({
            message: "Password reset succesfully!"
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Internal Server Error"
        })
    }

    const user=User.findOne({})
}

