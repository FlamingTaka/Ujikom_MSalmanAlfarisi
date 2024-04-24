const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        mongoose.set('strictQuery',false);

        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`tersambung ke database: ${conn.connection.host}`);
    } catch (error) {
        console.error(`error saat menyambungkan ke database: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;