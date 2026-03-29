const express = require('express');
const router  = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const dashboardLayout = '../views/layouts/dashboard';

const authMiddleware = (req,res,next)=>{
  const token = req.cookies.token;
  if(!token){
    return res.redirect('/login');
  }
  try{
    const decoded = jwt.verify(token,jwtSecret);
    req.userId = decoded.userId;
    next();
  }catch(error){
     res.redirect('/login');
  }
}

router.get('/dashboard',authMiddleware,async(req,res)=>{
  try {
    const locals = { title: "Dashboard", description: "Simple Blog created with NodeJs, Express & MongoDb." };
    const data = await Post.find({ author: req.userId }).lean();
    res.render('user/dashboard', { locals, data, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
  }
});

router.get('/add-post',authMiddleware,async(req,res)=>{
  try {
    const locals = { title: "Add Post", description: "..." };
    res.render('user/add-post', { locals, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
  }
});

router.post('/add-post',authMiddleware,async(req,res)=>{
  try {
    const newPost = new Post({ title: req.body.title, body: req.body.body, author: req.userId });
    await Post.create(newPost);
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

router.get('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    const locals = { title: "Edit Post", description: "..." };
    const data = await Post.findOne({ _id: req.params.id, author: req.userId }).lean();
    if(!data) return res.redirect('/dashboard');
    res.render('user/edit-post', { locals, data, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
  }
});

router.put('/edit-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.findOneAndUpdate({ _id: req.params.id, author: req.userId }, {
      title: req.body.title, body: req.body.body, updatedAt: Date.now()
    });
    res.redirect(`/edit-post/${req.params.id}`);
  } catch (error) {
    console.log(error);
  }
});

router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.id, author: req.userId });
    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    const locals = { title: "Profile Settings", description: "Manage your author profile" };
    res.render('user/profile', { locals, user, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { bio: req.body.bio });
    res.redirect('/profile');
  } catch (error) {
    console.log(error);
  }
});

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
  }
});

module.exports = router;
