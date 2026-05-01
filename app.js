// Load environment variables from .env file
require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const cookieParser = require('cookie-parser');
const {isActiveRoute} = require('./server/helpers/routerHelpers');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5050;

// Establish database connection
connectDB();

// Middleware to parse URL-encoded bodies (form submissions) and JSON
app.use(express.urlencoded({extended:true}));
app.use(express.json());

// Middleware to parse cookies (used for JWT auth)
app.use(cookieParser());

// Serve static assets (CSS, images, JS) from the public directory
app.use(express.static(path.join(__dirname, 'public')));

const jwt = require('jsonwebtoken');

// Global middleware to check for authentication state on every request
// Sets variables in res.locals so they are available in all EJS templates
app.use((req, res, next) => {
  res.locals.currentRoute = req.path;
  res.locals.userLoggedIn = false;
  
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.userLoggedIn = true;
      res.locals.userId = decoded.userId;
    } catch (error) {
      // Token invalid or expired
    }
  }
  next();
});

// Make the active route helper available to all templates for highlighting nav links
app.locals.isActiveRoute = isActiveRoute;

// View engine setup (EJS)
app.use(expressLayout);
// Allow HTML forms to emulate PUT/DELETE via the _method query parameter
app.use(methodOverride('_method'));
app.set('views', path.join(__dirname, 'views'));
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Mount the route handlers
app.use('/',require('./server/routes/main'));      // Public routes (home, post, about)
app.use('/',require('./server/routes/auth'));      // Authentication routes (login, register)
app.use('/',require('./server/routes/dashboard')); // Protected routes (dashboard, edit post)

// 404 Catch-all route
app.use((req, res) => {
  res.status(404).render('404', { locals: { title: "404 Not Found", description: "Page not found." }, currentRoute: req.path });
});

// Start the server only if run directly (e.g., node app.js)
// This check prevents the server from binding to a port when imported as a serverless function by Vercel.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
  });
}

// Export the app instance for Vercel serverless deployment
module.exports = app;