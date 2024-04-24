const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fotoSchema = new Schema({
    fotoID: {
    type: mongoose.Schema.Types.ObjectId,
    default: new mongoose.Types.ObjectId(),
    },
    judulFoto: {
        type: String,
    },
    deskripsiFoto: {
        type: String,
    },
    tanggalUnggah: {
        type: Date,
        default: Date.now,
    },
    lokasiFile: {
        type: String,
    },
    albumID: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        sparse: true,
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }
}, {
});


// Tentukan model 'foto' dengan schema yang telah dibuat
const Foto = mongoose.model('foto', fotoSchema);

module.exports = Foto;
