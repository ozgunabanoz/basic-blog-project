const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('User creation failed. It is not valid.');
    error.statusCode = 422;
    error.data = errors.array();

    throw error;
  }

  const { email, password, name } = req.body;
  let hashedPassword;
  let user;
  let newUser;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
    user = new User({
      email,
      name,
      password: hashedPassword
    });

    newUser = await user.save();

    res
      .status(201)
      .json({ message: 'User created.', userId: newUser._id });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  let user;
  let isEqual;
  let token;

  try {
    user = await User.findOne({ email });

    if (!user) {
      const error = new Error(
        'User with the email could not be found.'
      );
      error.statusCode = 404;

      throw error;
    }

    isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error('Wrong password.');
      error.statusCode = 401;

      throw error;
    }

    token = jwt.sign(
      { email: user.email, id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res
      .status(200)
      .json({
        message: 'User logged in.',
        userId: user._id.toString(),
        token
      });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};
