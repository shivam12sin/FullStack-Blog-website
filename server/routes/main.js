const express = require('express');
// const { model } = require('mongoose');
const router  = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const marked = require('marked');



router.get('',async(req ,res)=>{
  try {
     const locals = {
    title:"Node js Blog",
    description:"Simple Blog created with Nodejs,Express & MongoDb."
  }
  let perPage =10;
  let page = req.query.page || 1;

  const data = await Post.find().sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage).populate('author', 'username').lean().exec();

  const count = await Post.countDocuments({});
  const nextPage = parseInt(page)+1;
  const hasNextPage = nextPage <=Math.ceil(count/perPage);



    res.set('Cache-Control', 'public, max-age=60'); // Keep in cache for 60 seconds
    res.render('index',{
      locals,
      data,
      current:page,
      nextPage:hasNextPage ? nextPage:null,
      currentRoute:'/'
    }); 
  } catch (error) {
    console.log(error);
    
  }  
});

router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById(slug).populate('author', 'username').lean();

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
      currentRoute: `/post/${slug}`
    };

    // Parse Markdown into HTML
    const content = marked.parse(data.body);

    res.set('Cache-Control', 'public, max-age=300'); // Cache static content for 5 minutes
    res.render('post', { 
      locals,
      content, // pass HTML content
      data,
      currentRoute: `/post/${slug}`
    });

  } catch (error) {
    console.log(error);
  }
});

router.get('/author/:id', async (req, res) => {
  try {
    const authorId = req.params.id;
    const author = await User.findById(authorId).lean();
    if (!author) return res.redirect('/');

    const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).lean();
    const locals = { 
      title: `${author.username}'s Profile`, 
      description: "Author profile", 
      currentRoute: `/author/${authorId}` 
    };

    res.render('author', { locals, author, posts });
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});


router.post('/search',async(req,res)=>{
   const locals = {
      title: "Search",
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    }
    try {

      let searchTerm = req.body.searchTerm;
      const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");


      const data = await Post.find({
        $or:[
          {title:{$regex:new RegExp(searchNoSpecialChar,'i')}},
          {body:{$regex:new RegExp(searchNoSpecialChar,'i')}}
        ]
      }).populate('author', 'username').lean();

      res.render("search",{data,locals});
      
    } catch (error) {
      console.log(error);
      
    }

})



router.get('/about',(req,res)=>{
  
  res.render('about',{
    currentRoute:`/about`
  });
});


router.get('/contact', (req, res) => {
  res.render('contact');
});

router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      text: `You received a new message from your blog contact form:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    };

    await transporter.sendMail(mailOptions);

    res.send('✅ Message sent successfully!');
  } catch (error) {
    console.error('❌ Email send failed:', error);
    res.status(500).send('Something went wrong. Please try again later.');
  }
});


module.exports = router;