import mongoose from "mongoose";
const connectToDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/ChatterUp");
    console.log("mongodb is connected using mongoose");
  } catch (error) {
    console.log(error);
    console.log("error while connecting to mongoose");
  }
};

export default connectToDB;
