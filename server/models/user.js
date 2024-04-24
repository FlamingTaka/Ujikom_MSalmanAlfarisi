const bcrypt = require('bcrypt');
const { default: mongoose } = require('mongoose');

const Schema = mongoose.Schema;
const userSchema = new Schema ({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    namaLengkap: {
        type: String,
        required: true,
    },
    alamat: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('user', userSchema);