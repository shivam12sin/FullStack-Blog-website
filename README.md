
# Full Stack Blog Website

Modern publishing platform built with Node.js, Express, MongoDB, and EJS. The current release includes the “Living Manuscript” design system featuring parchment-inspired surfaces, serif typography, and asymmetrical layouts tailored for long-form reading.

## Live Demo

- https://fullstack-blog-website-4.onrender.com

## Key Features

- JWT-based authentication with protected dashboard routes
- Full CRUD workflow for posts, authors, and comments
- Markdown-to-HTML rendering for article bodies
- Living Manuscript UI: layered parchment textures, dual-serif typography, glassmorphic search, sepia-treated media
- MongoDB connection with automatic in-memory fallback when `MONGODB_URI` is not defined (useful for local preview)
- ESLint flat-config setup (`npm run lint`) to enforce consistent style

## Technology Stack

- Node.js 20+
- Express 5
- MongoDB / Mongoose 8
- EJS templates with express-ejs-layouts
- JWT + bcrypt for authentication and password hashing
- mongodb-memory-server for development fallback
- Vanilla CSS for the design system enhancements

## Project Structure

```
├── public/
│   ├── css/
│   ├── img/
│   └── js/
├── server/
│   ├── config/
│   ├── helpers/
│   ├── models/
│   └── routes/
├── views/
│   ├── layouts/
│   ├── partials/
│   └── user/
├── app.js
├── eslint.config.cjs
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the project root. At minimum set:

```
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb_connection_string (optional for local preview)
PORT=5050
EMAIL_USER=sender@example.com (required for support form)
EMAIL_PASS=app_specific_password
```

When `MONGODB_URI` is omitted, the server starts an ephemeral MongoDB instance using `mongodb-memory-server`. Use a real database for production deployments.

## Local Development

```bash
git clone https://github.com/shivam12sin/FullStack-Blog-website.git
cd FullStack-Blog-website
npm install
cp .env.example .env   # create and edit if an example file exists
npm start               # runs on http://localhost:5050
```

### Available Scripts

| Command        | Description                                  |
| -------------- | -------------------------------------------- |
| `npm start`    | Runs the server with the configured database |
| `npm run dev`  | Starts the server with nodemon               |
| `npm run lint` | Lints the project using ESLint flat config   |

## Deployment Notes

- Set the `PORT`, `MONGODB_URI`, `JWT_SECRET`, and email credentials in the hosting environment.
- Disable the in-memory Mongo fallback in production by always providing `MONGODB_URI`.
- The UI relies on hosted texture assets; self-host them if your deployment restricts external requests.

## Maintainer

Shivam Singh — [https://github.com/shivam12sin](https://github.com/shivam12sin)
