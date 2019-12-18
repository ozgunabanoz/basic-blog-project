require('dotenv').config();
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const uuidv4 = require('uuid/v4');

const feedRoutes = require('./routes/feed');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + file.filename + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single(
    'image'
  )
);
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serving static images

// middleware for handling CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  next();
});

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  // error handling middleware
  console.log(error);

  const errStatCode = error.statusCode;
  const message = error.message;

  res.status(errStatCode || 500).json({ message });
});

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(process.env.PORT || 8080);
  } catch (err) {
    console.log(err);
  }
})();
