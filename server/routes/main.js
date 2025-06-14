const express = require('express');
const { model } = require('mongoose');
const router  = express.Router();

router.get('',(req ,res)=>{
  const locals = {
    title:"Node js Blog",
    description:"Simple Blog created with Nodejs,Express & MongoDb."
  }
  res.render('index',locals);
});

router.get('/about',(req,res)=>{
  
  res.render('about');
});


module.exports = router;