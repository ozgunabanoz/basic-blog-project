const path = require('path');
const fs = require('fs');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;
  let posts;

  try {
    totalItems = await Post.countDocuments();
    posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!posts) {
      const error = new Error('Could not find any post');
      error.statusCode = 404;

      throw error;
    }

    res
      .status(200)
      .json({ message: 'Posts gathered.', posts, totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  let user;

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
    creator: req.userId,
    imageUrl
  });
  let result;

  try {
    result = await post.save();
    user = await User.findById(req.userId);

    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: 'Post created successfully!',
      post: result,
      creator: { _id: user._id, name: user.name }
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

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;

    throw error;
  }

  const { postId } = req.params;
  let { title, content, image: imageUrl } = req.body;

  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/');
  }

  if (!imageUrl) {
    const error = new Error('No image detected');
    error.statusCode = 422;

    throw error;
  }

  let post;
  let result;

  try {
    post = await Post.findById(postId);

    if (!post) {
      const error = new Error('No post found.');
      error.statusCode = 422;

      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;

      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    result = await post.save();

    res.status(200).json({ message: 'Post updated.', post: result });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  let post;
  let user;

  try {
    post = await Post.findById(postId);

    if (!post) {
      const error = new Error('No post found.');
      error.statusCode = 422;

      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not authorized.');
      error.statusCode = 403;

      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);

    user = await User.findById(req.userId);

    user.posts.pull(postId);
    await user.save();
    res.status(200).json({ message: 'Post deleted.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);

  fs.unlink(filePath, err => {
    if (!err) {
      console.log(err);
    }
  });
};
