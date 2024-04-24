const express = require('express');
const router = express.Router();

const User = require('../models/user');
const Foto = require('../models/foto');
const Komentar = require('../models/komentar');
const Like = require('../models/like');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const app = express();
const fs = require('fs');
const path = require('path');

// path
app.use(express.static(path.join(__dirname, 'public')));
router.use(express.static(path.join(__dirname, '/imgUpload')));

// cek login
const authMiddleware = (req, res, next) => {
   const token = req.cookies.token;

   // Jika tidak ada token, dan rute bukan "/login" atau "/register",
   // maka izinkan akses sebagai tamu hanya ke /home dan /profile
   if (!token && (req.path !== '/login' && req.path !== '/register' && req.path !== '/home' && req.path !== '/profile')) {
      return res.redirect('/login');
    
   }

   if (!token && (req.path === '/home' || req.path === '/profile')) {
     // Pengguna tanpa token diizinkan mengakses /home dan /profile
     return next();
   }

   if (!token) {
     return res.status(401).json({ message: 'Tidak dikenal' });
   }

   try {
     const decoded = jwt.verify(token, jwtSecret);
     req.userId = decoded.userId;

     // Memeriksa apakah pengguna memiliki akses ke rute terbatas
     if ((req.path === '/edit' || req.path === '/hapus' || req.path === '/view') && !req.userId) {
       return res.status(403).json({ message: 'Akses ditolak' });
     }

     next();
   } catch (error) {
     res.status(401).json({ message: 'Tidak dikenal' });
   }
};
 
// multer untuk upload file
const multer = require('multer');
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'public/imgUpload');
   },
   filename: (req, file, cb) => {
      const fileName = path.parse(file.originalname).name;
      const uniqueFileName = `${fileName}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
   }
});

const fileFilter = (req, file, cb) => {
   if (file.mimetype === 'image/jpeg'|| file.mimetype === 'image/png') {
      cb(null, true);
   } else {
      cb(new Error('hanya jpeg atau png yang diperbolehkan'), false);
   }
};

const upload = multer({
   storage: storage,
   fileFilter: fileFilter
});

// halaman login
router.get('/login', async (req, res) => {
   try {
      const locals = {
         title: 'Login',
         description: "Simple Blog created with NodeJs, Express & MongoDb."
      }

      res.render('index', { locals });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'internal server error' });
   }
});   

router.get('/logout', async (req, res) => {
   res.clearCookie('token');
   res.redirect('/login')

})

// halaman register
router.get('/register', async (req, res) => {
   try {
      const locals = {
         title: 'Login',
         description: "Simple Blog created with NodeJs, Express & MongoDb."
      }

      res.render('index2', { locals });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'internal server error' });
   }
});   

router.post('/login', async (req, res) => {
   try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if(!user) {
         return res.status(401).json({ message: 'Username tidak ditemukan'})
      }

      const validasiPassword = await bcrypt.compare(password, user.password);

      if(!validasiPassword) {
         return res.status(401).json({ message: 'Password salah!'});
      }

      const token = jwt.sign({ userId: user._id}, jwtSecret );
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/home');
   } catch (error) {
      console.log(error);
    }
});

router.post('/register', async (req, res) => {
   try {
      const { username, password,email, namaLengkap, alamat } = req.body;
      const hashPass = await bcrypt.hash(password, 10);

      const user = await User.create({
         username, 
         password: hashPass,
         email, 
         namaLengkap, 
         alamat
      });

      const userID = user._id;

      await User.updateOne({ _id: userID }, {$set: {userID} });

     
      res.redirect('/login');
   } catch (error) {
      console.log(error);

      if(error.name === 'Validasi error') {
      res.status(401).json({ message: 'Input tidak valid', errors: error.errors });
      } else if (error.code === 11000) {
      res.status(401).json({ message: 'Akun sudah ada'});
      } else {
         res.status(500).json({ message: 'Kesalahan internal server' })
      }
   }
});

router.get('/profile', async (req, res) => {
   try {
    
     const userId = req.userId; 
     const data = await Foto.find({userId: userId}).populate('userID', 'username') 
     res.render('profile', { data, userId }); 
   } catch (error) {
     console.error(error);
     res.status(500).send('Internal Server Error');
   }
 });

 


router.get('/home', authMiddleware, async (req, res) => {
   res.render('home')
})


// tambah foto
router.get('/upload', authMiddleware, async (req, res) => {
   try {
     const locals = {
       title: 'Add photo',
       description: 'Simple photo'
     };
 
     // Cek login
     if (req.userId) {
      
       const data = await Foto.find();
       res.render('upload', {
         locals,
         data
       });
     } else {
       res.redirect('/login');
     }
   } catch (error) {
     console.log(error);
     res.status(500).json({ message: 'Internal Server Error' });
   }
 });
 

router.post('/upload',upload.single('lokasiFile'), authMiddleware, async (req, res) => {
   try {
      const userID = req.userId;
      const newFoto = new Foto({
         judulFoto: req.body.judulFoto,
         deskripsiFoto: req.body.deskripsiFoto,
         lokasiFile: req.file.filename,
         userID: userID

      });
      
      await newFoto.save();
      res.redirect('/profile');

   } catch (error) {
      console.log(error);
   }
});

router.get('/foto/:id', async (req, res) => {
   try {
      let slug = req.params.id;
      const data = await Foto.findById(slug).populate('userID', 'username');
      const komen = await Komentar.find({ fotoID: req.params.id}).populate('userID', 'username');
      const like = await Like.find({ fotoID: req.params.id});



      const local = {
         title: data.title,
         description: 'apa saja'
      };

      res.render('view', { local, data, komen, like, currentRoute: `/foto/${slug}`});
   } catch (error) {
      console.log(error);
      res.status(500).send('Kesalahan Internal Server')
   }
});


 router.post('/like' , authMiddleware, async (req, res) => {

   const {fotoID} = req.body;

   try {

     // Cek apakah sudah di like belum
     const existingLike = await Like.findOne({ fotoID: fotoID, userID: req.userId });

     if(existingLike) {
       await Like.findByIdAndDelete(existingLike._id);
       res.redirect(`/foto/${fotoID}`)
     } else {
     
     const newLike = new Like({
       fotoID: fotoID,
       userID: req.userId,
     });

     await newLike.save();
     res.redirect(`/foto/${fotoID}`);
   }
   
   } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Internal Server Error'});
   }  
 });

// POST komentar
router.post('/komentar', authMiddleware, async (req, res) => {
   try {
       try {
         const userID = req.userId;
         const fotoID = req.body.fotoID
           const newKomentar = new Komentar({
               isiKomentar: req.body.isiKomentar,
               fotoID: fotoID,
               userID : userID 
               
           });
 
           await newKomentar.save();       
            res.redirect(`/foto/${fotoID}`);
 
 
       } catch (error) {
           console.log(error);
       }
 
 
 
   } catch (error) {
     console.log(error);
   }
 
 });

 // Mendapatkan semua komentar
router.get('/komentar/:fotoID', async (req, res) => {
   try {
       const komentars = await Komentar.find({ fotoID: req.params.fotoID });
       res.json(komentars);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
 });

 router.delete('/komentar-delete/:id', authMiddleware, async (req, res) => {
   try {
       // Cari komentar berdasarkan id
       const komentar = await Komentar.findById(req.params.id);

       // Cek apakah ada komennya
       if (!komentar) {
           return res.status(404).json({ error: 'Comment not found' });
       }
       if (komentar.userID.toString() !== req.userId) {
           return res.status(403).json({ error: 'Permission denied. You are not allowed to delete this comment.' });
       }

       
       const fotoID = komentar.fotoID;

       await Komentar.findByIdAndDelete(req.params.id);
       res.redirect(`/foto/${fotoID}`);
   } catch (error) {
       res.status(500).json({ error: error.message });
   }
 });


// Halaman edit
router.get('/edit/:id', authMiddleware, async (req, res) => {
   try {
     const locals = {
         judul: "Edit Post",
         deskripsi: "Free NodeJs User Management System",
     };
 
     const data = await Foto.findOne({ _id: req.params.id });
 
     // Periksa apakah pengguna yang saat ini masuk adalah pemilik foto
     if (data.userID.toString() !== req.userId) {
       // Jika bukan, kembalikan pesan error atau lakukan tindakan yang sesuai
       return res.status(403).json({ message: 'Anda tidak diizinkan mengedit foto ini' });
     }
 
     res.render('edit', {
       locals,
       data,
     });
   } catch (error) {
     console.log(error);
   }
 });

 // PUT edit foto
 router.put('/edit/:id', authMiddleware, async (req, res) => {
   try {
    
     await Foto.findByIdAndUpdate(req.params.id, {
       judulFoto: req.body.judulFoto,
       deskripsiFoto: req.body.deskripsiFoto,
       tanggalUnggah: Date.now()
     });
 
     res.redirect('/profile');
 
   } catch (error) {
     console.log(error);
   }
 
 });

 // Hapus foto
 router.delete('/delete/:id', authMiddleware, async (req, res) => {
   try {
     const foto = await Foto.findById(req.params.id);
 
     // Periksa apakah pengguna yang saat ini masuk adalah pemilik foto
     if (foto.userID.toString() !== req.userId) {
       // Jika bukan, kembalikan pesan error atau lakukan tindakan yang sesuai
       return res.status(403).json({ message: 'Anda tidak diizinkan menghapus foto ini' });
     }
 
     await Foto.deleteOne({ _id: req.params.id });
     res.redirect('/profile');
   } catch (error) {
     console.log(error);
   }
 });

//  router.get('/profile', authMiddleware, async (req, res) => {
//  try {
//    let slug = req.params.id;
//    const data = await Foto.find(slug);
//    const dataImg = data.map((foto) => ({
//       ...foto._doc, 
//       imageUrl: path.join('/imgUpload', foto.lokasiFile)
//    }));
 
//    const locals = {
//       title: 'Profile',
//       description: 'Simple blog'
//    };
//    res.render('profile', {
//       locals,
//       data: dataImg,
//    });
//    } catch (error) {
//       console.log(error);
//    }
// });

// router.get('/liked', async (req, res) => {
//    try {
     
//      const userId = req.userId;
 
     
//      const likefotos = await LikeFoto.find({ userid: userId }).populate({
//        path: 'fotoid',
//        populate: { path: 'userid', select: 'username' } 
//      });
//      res.render('liked', { likefotos: likefotos });
//    } catch (error) {
//      console.error(error);
//      res.status(500).send('Internal Server Error');
//    }
//  });


module.exports = router;   