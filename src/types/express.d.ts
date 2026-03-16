import { ObjectId } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: ObjectId;
        email: string;
        role: "user" | "admin";
        name?: string | undefined;
        isEmailVerified: boolean;
      };
    }
  }
}

export {};