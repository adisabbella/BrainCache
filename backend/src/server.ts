import mongoose from "mongoose";
import dotenv from "dotenv"; 

dotenv.config();

export const dbConnect = async() => { 
  try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined");
      }
      mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("DB Connected");
      });
  }
  catch(error) {
    console.log("DB Connection failed");
  }
}