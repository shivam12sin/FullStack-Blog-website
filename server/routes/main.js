const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/Comment');
const nodemailer = require('nodemailer');
const marked = require('marked');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

/**
 * Authentication Middleware
 * Checks for a valid JWT token in cookies. If missing or invalid, redirects to login.
 */

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
 * GET /
 * Homepage - Retrieves paginated lists of posts.
 * Includes data transformations for UI: excerpt generation (stripping markdown) 
 * and reading time calculation.
 */
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "Node js Blog",
      description: "Simple Blog created with Nodejs,Express & MongoDb."
    }
    let perPage = 10;
    let page = req.query.page || 1;

    const data = await Post.find().sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage).populate('author', 'username').lean().exec();

    // Enrich each post with reading time and excerpt
    data.forEach(post => {
      // Reading time: ~200 words per minute
      const wordCount = post.body ? post.body.split(/\s+/).length : 0;
      post.readingTime = Math.max(1, Math.ceil(wordCount / 200));

      // Excerpt: strip markdown/HTML, truncate to 160 chars
      const plainText = post.body
        ? post.body
            .replace(/[#*_~`>\[\]()!|\\-]/g, '') // strip markdown chars
            .replace(/<[^>]*>/g, '')               // strip HTML tags
            .replace(/\n+/g, ' ')                  // collapse newlines
            .trim()
        : '';
      post.excerpt = plainText.length > 160
        ? plainText.substring(0, 160).replace(/\s+\S*$/, '') + '...'
        : plainText;
    });

    const count = await Post.countDocuments({});
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);



    res.set('Cache-Control', 'public, max-age=60'); // Keep in cache for 60 seconds
    res.render('index', {
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: '/'
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});


/**
 * GET /post/:id
 * Single Post - Fetches a post by its ID, parses its Markdown body to HTML, 
 * calculates reading time, and fetches associated comments.
 */
router.get('/post/:id', async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Post.findById(slug).populate('author', 'username').lean();
    if (!data) return res.status(404).render('404', { locals: { title: "404 Not Found", description: "Post not found." }, currentRoute: `/post/${slug}` });

    const comments = await Comment.find({ post: slug }).populate('author', 'username').sort({ createdAt: -1 }).lean();

    const locals = {
      title: data.title,
      description: "Simple Blog created with NodeJs, Express & MongoDb.",
      currentRoute: `/post/${slug}`
    };

    // Parse Markdown into HTML
    const content = marked.parse(data.body);

    // Reading time: ~200 words per minute
    const wordCount = data.body ? data.body.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    res.set('Cache-Control', 'public, max-age=300'); // Cache static content for 5 minutes
    res.render('post', {
      locals,
      content, // pass HTML content
      data,
      comments,
      readingTime,
      currentRoute: `/post/${slug}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /post/:id/comment
 * Adds a new comment to a specific post. Protected by authMiddleware.
 */
router.post('/post/:id/comment', authMiddleware, async (req, res) => {
  try {
    const newComment = new Comment({
      content: req.body.content,
      author: req.userId,
      post: req.params.id
    });
    await Comment.create(newComment);
    res.redirect(`/post/${req.params.id}`);
  } catch (error) {
    console.log(error);
    res.redirect(`/post/${req.params.id}`);
  }
});

/**
 * GET /tag/:tag
 * Fetches and paginates posts associated with a specific tag.
 */
router.get('/tag/:tag', async (req, res) => {
  try {
    const rawTag = req.params.tag;
    const tag = rawTag.toLowerCase();

    const locals = {
      title: `Posts tagged: ${tag}`,
      description: `Articles and posts about ${tag}`
    };

    let perPage = 10;
    let page = req.query.page || 1;

    const query = { tags: tag };
    const data = await Post.find(query).sort({ createdAt: -1 }).skip(perPage * page - perPage).limit(perPage).populate('author', 'username').lean().exec();

    // Enrich posts with reading time and excerpt
    data.forEach(post => {
      const wordCount = post.body ? post.body.split(/\s+/).length : 0;
      post.readingTime = Math.max(1, Math.ceil(wordCount / 200));
      const plainText = post.body
        ? post.body
            .replace(/[#*_~`>\[\]()!|\\-]/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\n+/g, ' ')
            .trim()
        : '';
      post.excerpt = plainText.length > 160
        ? plainText.substring(0, 160).replace(/\s+\S*$/, '') + '...'
        : plainText;
    });

    const count = await Post.countDocuments(query);
    const nextPage = parseInt(page) + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);

    res.render('index', {
      locals,
      data,
      current: page,
      nextPage: hasNextPage ? nextPage : null,
      currentRoute: `/tag/${rawTag}`
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * GET /author/:id
 * Fetches an author's profile and all their published posts.
 */
router.get('/author/:id', async (req, res) => {
  try {
    const authorId = req.params.id;
    const author = await User.findById(authorId).lean();
    if (!author) return res.redirect('/');

    const posts = await Post.find({ author: authorId }).sort({ createdAt: -1 }).lean();

    // Enrich posts with reading time and excerpt
    posts.forEach(post => {
      const wordCount = post.body ? post.body.split(/\s+/).length : 0;
      post.readingTime = Math.max(1, Math.ceil(wordCount / 200));
      const plainText = post.body
        ? post.body
            .replace(/[#*_~`>\[\]()!|\\-]/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\n+/g, ' ')
            .trim()
        : '';
      post.excerpt = plainText.length > 160
        ? plainText.substring(0, 160).replace(/\s+\S*$/, '') + '...'
        : plainText;
    });
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


/**
 * POST /search
 * Executes a basic regex-based text search across post titles and bodies.
 */
router.post('/search', async (req, res) => {
  const locals = {
    title: "Search",
    description: "Simple Blog created with NodeJs, Express & MongoDb.",
  }
  try {

    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");


    const data = await Post.find({
      $or: [
        { title: { $regex: new RegExp(searchNoSpecialChar, 'i') } },
        { body: { $regex: new RegExp(searchNoSpecialChar, 'i') } }
      ]
    }).populate('author', 'username').lean();

    res.render("search", { data, locals });

  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }

})



router.get('/about', (req, res) => {

  res.render('about', {
    currentRoute: `/about`
  });
});


router.get('/support', (req, res) => {
  res.render('support');
});

/**
 * POST /support
 * Handles contact form submissions using Nodemailer to send emails.
 */
router.post('/support', async (req, res) => {
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