const express = require('express');
const router  = express.Router();
const Post = require('../models/post');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
const dashboardLayout = '../views/layouts/dashboard';

const authMiddleware = (req,res,next)=>{
  const token = req.cookies.token;
  if(!token){
    return res.status(401).json({message:'Unauthorized'});
  }
  try{
    const decoded = jwt.verify(token,jwtSecret);
    req.userId = decoded.userId;
    next();
  }catch(error){
     res.status(401).json({message:'Unauthorized'});
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

module.exports = router;
