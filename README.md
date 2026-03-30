
# 📝 Full Stack Blog Website

A simple and functional full-stack blog website built using **Node.js**, **Express**, **MongoDB**, and **EJS** templating. It supports full CRUD operations, user authentication with JWT, and an admin dashboard for managing blog posts.

## 🌐 Live Demo

👉 [Visit the live website](https://fullstack-blog-website-4.onrender.com)

## 🚀 Features

- Admin login with secure JWT-based authentication
- Create, Read, Update, Delete (CRUD) blog posts
- EJS templating for dynamic rendering
- Password hashing using bcrypt
- MongoDB Atlas as the database
- Responsive design

## 📸 Screenshots

### 📍 Homepage
![Homepage Screenshot](https://github.com/user-attachments/assets/0e58920d-7735-47a5-a980-a6aa07c48f33)

### 📍 Admin Dashboard
![Admin Dashboard Screenshot](https://github.com/user-attachments/assets/c09fa520-6d0b-4c35-a8c7-8f3e23fef451)

### 📍 Add/Edit Post Views
![Add/Edit Post Screenshot](https://github.com/user-attachments/assets/f8844f9e-d9d5-4491-8d77-8fa37f7674f4)

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB & Mongoose
- EJS
- JWT for authentication
- bcrypt for password hashing
- Bootstrap (or your preferred styling framework)

## 📂 Project Structure

```
├── models/
│   ├── post.js
│   └── user.js
├── routes/
│   └── admin.js
├── views/
│   ├── layouts/
│   ├── admin/
│   └── partials/
├── public/
├── .env
├── app.js
└── README.md
```

## 🔒 Environment Variables

Create a `.env` file in the root directory and add:

```env
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
PORT=10000
```

## 🚀 Getting Started Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/shivam12sin/FullStack-Blog-website.git
   cd FullStack-Blog-website
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your `.env` file** as described above.

4. **Run the application:**

   ```bash
   node app.js
   ```

5. **Visit in browser:**  
   `http://localhost:10000`

---

## 👨‍💻 Author

**Shivam Singh**  
GitHub: [@shivam12sin](https://github.com/shivam12sin)
