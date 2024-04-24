const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const komentarSchema = new Schema ({
      
    komentarID: {
        type: mongoose.Schema.Types.ObjectId,
    },
    fotoID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foto'
    },
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    isiKomentar: {
        type: String,
    },
    tanggalKomentar: {
        type: Date,
        default: Date.now   
    },
});

// Tentukan model 'komentar' dengan schema yang telah dibuat
module.exports = mongoose.model('komentar', komentarSchema);


