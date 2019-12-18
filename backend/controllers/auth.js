const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

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
