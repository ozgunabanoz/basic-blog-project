const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'First Post',
        content: 'This is the first post!',
        imageUrl: 'images/duck.jpg',
        creator: {
          name: 'Ozgun'
        },
        createdAt: new Date()
      }
    ]
  });
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array()
    });
  }

  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    creator: { name: 'Ozgun' },
    imageUrl: 'images/duck.jpg'
  });
  let result;

  try {
    result = await post.save();

    res.status(201).json({
      message: 'Post created successfully!',
      post: result
    });
  } catch (err) {
    console.log(err);
  }
};
