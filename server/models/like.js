const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema ({            
    fotoID: {
        type: mongoose.Schema.ObjectId,
        ref: 'foto'
    },
    userID: {
        type: mongoose.Schema.ObjectId,
        ref: 'user'
    },
    tanggalLike: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('like', likeSchema);
