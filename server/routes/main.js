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
 * Homepage - Retrieves posts sorted by upvote count (most upvoted first).
 * Includes data transformations for UI: excerpt generation (stripping markdown) 
 * and reading time calculation.
 */
router.get('', async (req, res) => {
  try {
    const locals = {
      title: "Candor",
      description: "Discover ideas, stories, and expertise from writers everywhere."
    }
    let perPage = 10;
    let page = parseInt(req.query.page) || 1;

    // Use aggregation to sort by upvote count (most upvoted first)
    const data = await Post.aggregate([
      { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } },
      { $sort: { upvoteCount: -1, createdAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $project: { title: 1, body: 1, tags: 1, upvotes: 1, upvoteCount: 1, createdAt: 1, updatedAt: 1, 'author._id': 1, 'author.username': 1 } }
    ]);

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
    const nextPage = page + 1;
    const hasNextPage = nextPage <= Math.ceil(count / perPage);


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

    // Check if current user has upvoted this post
    let hasUpvoted = false;
    const token = req.cookies.token;
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        currentUserId = decoded.userId;
        hasUpvoted = data.upvotes && data.upvotes.some(id => id.toString() === currentUserId);
      } catch (e) { /* token invalid, ignore */ }
    }

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


    res.render('post', {
      locals,
      content,
      data,
      comments,
      readingTime,
      hasUpvoted,
      upvoteCount: data.upvotes ? data.upvotes.length : 0,
      currentRoute: `/post/${slug}`
    });

  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /post/:id/upvote
 * Toggles the upvote status for a logged-in user on a given post.
 * If the user already upvoted, it removes the upvote. Otherwise, it adds one.
 */
router.post('/post/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    const post = await Post.findById(postId);
    if (!post) return res.redirect('/');

    const alreadyUpvoted = post.upvotes.includes(userId);

    if (alreadyUpvoted) {
      await Post.findByIdAndUpdate(postId, { $pull: { upvotes: userId } });
    } else {
      await Post.findByIdAndUpdate(postId, { $addToSet: { upvotes: userId } });
    }

    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.log(error);
    res.redirect('/');
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