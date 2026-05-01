const express = require('express');
const router  = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
const dashboardLayout = '../views/layouts/dashboard';

/**
 * GET /login
 * Renders the login/registration form. 
 * If a valid JWT already exists, it auto-redirects to the dashboard.
 */
router.get('/login', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token) {
      try {
        jwt.verify(token, jwtSecret);
        return res.redirect('/dashboard');
      } catch(err) { }
    }
    
    const locals = { title: "Login", description: "Simple Blog created with NodeJs, Express & MongoDb." };
    res.render('login', { locals, layout: dashboardLayout });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /login
 * Authenticates a user by checking the database and verifying the bcrypt hash.
 * On success, issues an HttpOnly JWT cookie.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const locals = { title: "Login", description: "Simple Blog created with NodeJs, Express & MongoDb." };
    const user = await User.findOne({ username });

    if (!user) {
      return res.render('login', { locals, layout: dashboardLayout, error: 'Invalid username or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render('login', { locals, layout: dashboardLayout, error: 'Invalid username or password.' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie('token', token, { httpOnly: true });

    res.redirect('/dashboard');
  } catch (error) {
    console.log(error);
    const locals = { title: "Login", description: "Simple Blog created with NodeJs, Express & MongoDb." };
    res.render('login', { locals, layout: dashboardLayout, error: 'Something went wrong. Please try again.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({ username, password: hashedPassword });
      const token = jwt.sign({ userId: user._id }, jwtSecret);
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
    } catch (error) {
      const locals = { title: "Register", description: "Create an account" };
      if (error.code === 11000) {
        res.render('register', { locals, layout: dashboardLayout, error: 'Username is already taken. Please choose another.' });
      } else {
        res.render('register', { locals, layout: dashboardLayout, error: 'Something went wrong. Please try again.' });
      }
      console.log(error);
    }
  } catch (error) {
    console.log(error);
    const locals = { title: "Register", description: "Create an account" };
    res.render('register', { locals, layout: dashboardLayout, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
