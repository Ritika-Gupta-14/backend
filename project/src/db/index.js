import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export default async function connect_DB(){
try {
    const connection_instance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MongoDB connected,\n ${connection_instance.connection.host}`)    
} catch (error) {
    console.error("Connection error", error);
    process.exit(1)
    
}
}