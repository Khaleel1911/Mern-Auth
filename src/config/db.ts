import mongoose from "mongoose";

export default async function connectDB() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI!);

    console.log("MongoDB connected successfully");

  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}