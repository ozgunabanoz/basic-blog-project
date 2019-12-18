const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = async (req, res, next) => {
  let posts;

  try {
    posts = await Post.find();

    if (!posts) {
      const error = new Error('Could not find any post');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json({ posts });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;

    throw error;
  }

  if (!req.file) {
    const error = new Error('No image registered.');
    error.statusCode = 422;

    throw error;
  }

  const imageUrl = req.file.path.replace('\\', '/');
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    creator: { name: 'Ozgun' },
    imageUrl
  });
  let result;

  try {
    result = await post.save();

    res.status(201).json({
      message: 'Post created successfully!',
      post: result
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const { postId } = req.params;
  let post;

  try {
    post = await Post.findById(postId);

    if (!post) {
      const error = new Error('Could not find a post');
      error.statusCode = 404;

      throw error;
    }

    res.status(200).json({ message: 'Post fetched.', post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};
