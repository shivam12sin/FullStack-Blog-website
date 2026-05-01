const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const jwtSecret = process.env.JWT_SECRET;
const dashboardLayout = '../views/layouts/dashboard';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.redirect('/login');
  }
}

/**
 * GET /dashboard
 * Protected route that fetches and displays the currently logged-in user's posts.
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const locals = { title: "Dashboard", description: "Simple Blog created with NodeJs, Express & MongoDb." };
    const data = await Post.find({ author: req.userId }).lean();
    res.render('user/dashboard', { locals, data, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * GET /add-post
 * Renders the markdown editor to create a new post.
 */
router.get('/add-post', authMiddleware, async (req, res) => {
  try {
    const locals = { title: "Add Post", description: "..." };
    res.render('user/add-post', { locals, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * POST /add-post
 * Handles new post submission. Creates the post in the database.
 * If the author has followers, triggers the asynchronous email notification pipeline
 * to alert subscribers of the new content.
 */
router.post('/add-post', authMiddleware, async (req, res) => {
  try {
    if (!req.body.title || !req.body.body || req.body.title.trim() === '' || req.body.body.trim() === '') {
      return res.status(400).send('Title and body content are required.');
    }
    const rawTags = req.body.tags || '';
    const tagsArray = rawTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);

    const newPost = new Post({ title: req.body.title, body: req.body.body, author: req.userId, tags: tagsArray });
    await Post.create(newPost);

    // NOTIFICATION PIPELINE
    const author = await User.findById(req.userId).populate('followers', 'email username');
    if (author && author.followers && author.followers.length > 0) {
      const bccEmails = author.followers.map(f => f.email).filter(e => e && e.trim() !== '');
      if (bccEmails.length > 0) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        const mailOptions = {
          from: `"Writer's Network" <${process.env.EMAIL_USER}>`,
          bcc: bccEmails,
          subject: `${author.username} published a new post: ${newPost.title}`,
          text: `Hi there!\n\nThe author ${author.username} just published a highly anticipated new article titled "${newPost.title}".\n\nRead their latest thoughts here:\n${process.env.SITE_URL || 'http://localhost:5050'}/post/${newPost._id}\n\nHappy reading,\nWriter's Network Team`,
        };
        // Run asynchronously so it doesn't block the routing sequence
        transporter.sendMail(mailOptions).catch(err => console.error('Email dispatch failed:', err));
      }
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /edit-post/:id
 * Fetches a specific post by ID and verifies the current user is the author.
 * Renders the markdown editor pre-filled with the post data.
 */
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const locals = { title: "Edit Post", description: "..." };
    const data = await Post.findOne({ _id: req.params.id, author: req.userId }).lean();
    if (!data) return res.redirect('/dashboard');
    res.render('user/edit-post', { locals, data, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * PUT /edit-post/:id
 * Updates an existing post in the database.
 * Ensures that the requester is the original author of the post.
 */
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const rawTags = req.body.tags || '';
    const tagsArray = rawTags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);

    await Post.findOneAndUpdate({ _id: req.params.id, author: req.userId }, {
      title: req.body.title, body: req.body.body, tags: tagsArray, updatedAt: Date.now()
    });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * DELETE /delete-post/:id
 * Removes a post from the database, verifying the user is the author.
 */
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id, author: req.userId });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /profile
 * Renders the user profile settings page where they can update bio and email.
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    const locals = { title: "Profile Settings", description: "Manage your author profile" };
    res.render('user/profile', { locals, user, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * PUT /profile
 * Updates the current user's profile settings (bio, email) in the database.
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      bio: req.body.bio,
      email: req.body.email
    });
    res.redirect('/profile');
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

/**
 * POST /subscribe/:authorId
 * Toggles the subscription status between the current user and an author.
 * Modifies both the 'following' array of the user and the 'followers' array of the author.
 */
router.post('/subscribe/:authorId', authMiddleware, async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const subscriberId = req.userId;

    if (authorId === subscriberId) {
      return res.redirect('back');
    }

    const user = await User.findById(subscriberId);
    const isSubscribed = user.following.includes(authorId);

    if (isSubscribed) {
      await User.findByIdAndUpdate(subscriberId, { $pull: { following: authorId } });
      await User.findByIdAndUpdate(authorId, { $pull: { followers: subscriberId } });
    } else {
      await User.findByIdAndUpdate(subscriberId, { $addToSet: { following: authorId } });
      await User.findByIdAndUpdate(authorId, { $addToSet: { followers: subscriberId } });
    }

    res.redirect(`/author/${authorId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;
