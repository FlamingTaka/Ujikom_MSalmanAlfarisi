require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const bodyParser = require('body-parser');

const connectDB = require('./server/config/db');

const app = express();
const PORT = process.env.PORT || 3000; // Adjust the order to prioritize process.env.PORT

// Connect to the database
connectDB();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: mongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

app.use(express.static('public'));

// Templating Engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');


app.use('/', require('./server/routes/main'));

app.listen(PORT, () => {
  console.log(`app listening on port ${PORT}`);
});
