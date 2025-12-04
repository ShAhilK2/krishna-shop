import mongoose from "mongoose";
import {ENV} from "./env.js"


export const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(ENV.DB_URL);
        console.log("✅ MongoDB Connection Estabished " + conn.connection.host)
    }catch(error){
        console.log("💣 MongoDB Connection Error ", error.message)
        process.exit(1) // process success is 0 and process failure is 1
    }
}