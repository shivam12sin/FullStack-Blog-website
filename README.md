# Writer's Network

A modern publishing platform built for focus, designed for reading.
"Quiet publishing for loud ideas."

## Overview

This is a production-grade, full-stack blog application built with Node.js, Express, MongoDB, and EJS. It provides a complete editorial workflow tailored for long-form reading and writing.

The UI follows an elegant, minimalist design system that prioritizes readability, beautiful typography, and distraction-free content consumption.

## Table of Contents
- [Features](#features)
- [Design Philosophy](#design-philosophy)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment](#deployment)
- [Maintainer](#maintainer)

## Features
- **Writer Studio**: A premium, distraction-free markdown editing environment using EasyMDE with live word counts, read-time estimation, and a floating bubble toolbar.
- **Subscription Engine**: Readers can follow their favorite authors. When an author publishes a new post, all followers automatically receive an email notification.
- **Authentication**: Secure JWT-based authentication system stored in http-only cookies, fully compatible with serverless environments.
- **Editorial Workflow**: Full CRUD operations for posts, authors, and comments.
- **Serverless Ready**: Fully configured to deploy seamlessly on Vercel's serverless architecture.

## Design Philosophy
The UI emphasizes a "Living Manuscript" aesthetic:

1. **Focus on Typography**
   - Elegant dual-serif typography tailored for long-form prose.
   - JetBrains Mono is utilized within the Writer Studio for a focused, typewriter-like drafting experience.

2. **Subtle Interactions**
   - Clean, asymmetrical grid layouts.
   - Minimalist navigation that stays out of the way of the content.

## Architecture & Tech Stack
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas / Mongoose
- **View Engine**: EJS templates with `express-ejs-layouts`
- **Security**: JWT + bcrypt for authentication and password hashing
- **Email Delivery**: Nodemailer
- **Styling**: Vanilla CSS enforcing a strict, customized design system
- **Hosting**: Vercel Serverless Functions

## Environment Variables
Create a `.env` file in the project root. At minimum set:

```env
# Server & Database
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string

# Authentication
JWT_SECRET=your_secure_jwt_secret

# Email Notifications (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Deployment URL (Used for generating email links)
SITE_URL=http://localhost:5000
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/shivam12sin/FullStack-Blog-website.git
cd FullStack-Blog-website

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run the server (http://localhost:5000)
npm run dev
```

## Deployment

This project is optimized for deployment on **Vercel**.

1. Import your GitHub repository into Vercel.
2. In the Vercel project settings, add all of your Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and set `SITE_URL` to your Vercel production domain).
3. The included `vercel.json` and `api/index.js` wrapper will automatically handle routing the Express app through Vercel's Serverless Functions.
4. Deploy!

**Live Demo**: [https://nodejs-ledger.vercel.app](https://nodejs-ledger.vercel.app)

## Maintainer
Shivam Singh — [GitHub Profile](https://github.com/shivam12sin)
