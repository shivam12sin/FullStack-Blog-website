const express = require('express');
// const { model } = require('mongoose');
const router  = express.Router();
const Post = require('../models/post');


router.get('',async(req ,res)=>{
  try {
     const locals = {
    title:"Node js Blog",
    description:"Simple Blog created with Nodejs,Express & MongoDb."
  }
  let perPage =10;
  let page = req.query.page || 1;

  const data = await Post.aggregate([{$sort:{createdAt:-1}}]).skip(perPage*page-perPage).limit(perPage).exec();

  const count = await Post.countDocuments({});
  const nextPage = parseInt(page)+1;
  const hasNextPage = nextPage <=Math.ceil(count/perPage);



    res.render('index',{
      locals,
      data,
      current:page,
      nextPage:hasNextPage ? nextPage:null
    }); 
  } catch (error) {
    console.log(error);
    
  }  
});

router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById({ _id: slug });

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
    }

    res.render('post', { 
      locals,
      data,
      currentRoute: `/post/${slug}`
    });
  } catch (error) {
    console.log(error);
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
      });

      res.render("search",{data,locals});
      
    } catch (error) {
      console.log(error);
      
    }

})




router.get('/about',(req,res)=>{
  
  res.render('about');
});


module.exports = router;