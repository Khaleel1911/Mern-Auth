import mongoose, { ObjectId, Schema } from "mongoose";

export interface IUser {
  _id?:ObjectId;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  name?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
  tokenVersion:number,
  resetPasswordToken:string,
  resetPasswordExpires:Date | null


}

const userSchema = new Schema<IUser>(
  {
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default:"user"
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    name: {
      type: String
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret:{
        type:String,
        default: null
    },
    tokenVersion:{
        type:Number,
        default:0
    },
    resetPasswordToken:{
        type:String,
        default: null
    },
    resetPasswordExpires:{
        type:Date,
        default:null
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>("User", userSchema);