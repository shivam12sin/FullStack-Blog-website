require('dotenv').config();
const express = require('express');
const expressLayout = require('express-ejs-layouts');
const methodOverride = require('method-override');
const connectDB = require('./server/config/db');
const cookieParser = require('cookie-parser');
const {isActiveRoute} = require('./server/helpers/routerHelpers');
const app = express();
const PORT = process.env.PORT || 5000;


//connect to DB

connectDB();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());

app.use(express.static('public'));

const jwt = require('jsonwebtoken');

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

app.locals.isActiveRoute = isActiveRoute;




app.use(expressLayout);
app.use(methodOverride('_method'));
app.set('layout', './layouts/main');
app.set('view engine','ejs');

app.use('/',require('./server/routes/main'));
app.use('/',require('./server/routes/auth'));
app.use('/',require('./server/routes/dashboard'));

app.listen(PORT,()=>{
  console.log(`App listening on port ${PORT}`);
})