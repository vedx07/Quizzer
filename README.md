# Quizzer

Quizzer is an easy-to-use online exam platform built with the MERN stack (MongoDB, Express, React, Node.js). It allows teachers or admins to create tests, and students to take them in a clean, modern, and mobile-friendly interface.

---

## 🎯 What it does

- **For Admins:** You can create tests with different sections, set time limits, and add various types of questions (like Multiple Choice or exact Number answers).
- **For Students:** You can log in, take live tests with a running timer, and instantly see your results and where you stand on the leaderboard.

---

## ✨ Features

- **Admin Dashboard**: Easily create, edit, and publish exams.
- **Different Question Types**: Supports Multiple Choice (MCQ), Multiple Select (MSQ), and Numerical answers.
- **Fair Play**: Students can only take a test once. 
- **Auto-Save**: Exam progress saves automatically in the background, so students don't lose work if their internet drops.
- **Instant Results**: Automatically calculates total scores and section-wise marks right after submission.
- **Leaderboards**: See how you rank against other students who took the test.
- **Mobile Friendly**: The exam screen works perfectly on phones, tablets, and desktops.

---

## 📸 Screenshots

*(Replace placeholders with actual project screenshots)*

* **Admin Dashboard** - `/screenshots/dashboard.png`
* **Test Builder Interface** - `/screenshots/builder.png`
* **Mobile Exam View** - `/screenshots/mobile-exam.png`
* **Detailed Results Analysis** - `/screenshots/results.png`
* **Leaderboard** - `/screenshots/leaderboard.png`

---

## 🛠 Tech Stack & Why We Used It

**Frontend:**
- **React (with Vite)**: To build a fast, interactive user interface. Vite makes the app load and update lightning fast.
- **Tailwind CSS**: For quick, clean, and mobile-responsive styling without messy CSS files.
- **React Router**: To smoothly navigate between pages (like Dashboard to Exam Screen) without reloading the page.
- **React Hot Toast**: For beautiful, modern pop-up notifications (success/error messages).

**Backend:**
- **Node.js & Express.js**: To handle backend logic and API requests simply and efficiently using JavaScript.
- **MongoDB & Mongoose**: A flexible database perfect for saving complex exam structures, questions, and student results.
- **JSON Web Tokens (JWT) & bcrypt**: To securely hash passwords and safely keep users logged in.
- **Node-Cron**: To handle background tasks automatically.

---

## 🚀 How to Run the Project

### 1. Clone the project
```bash
git clone https://github.com/vedx07/Quizzer.git
cd Quizzer
```

### 2. Setup Environment Variables

**Backend (`server` folder)**
Create a `.env` file inside the `server` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@quizzer.com
ADMIN_PASSWORD=Admin@123
```

**Frontend (`client` folder)**
Create a `.env` file inside the `client` folder:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Start the Backend
```bash
cd server
npm install
npm run dev
```

### 4. Start the Frontend
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```
The application will open at `http://localhost:5173`.

---

## 🗄 Database Design

The database uses MongoDB to organize data simply:
- **User**: Stores student and admin accounts.
- **Test**: Basic details about the exam (title, time limit).
- **Section**: Parts of a test with specific marks (like +4 for correct, -1 for wrong).
- **Question**: The actual questions, options, and correct answers.
- **Attempt**: Tracks a student taking a test right now.
- **Result**: Final scores saved after the test is done.

---

## 🛤 How it Works

### 1. Making a Test (Admin)
`Login` → `Dashboard` → `Create Test` → `Add Sections` → `Add Questions` → `Publish Test`. 

### 2. Taking an Exam (Student)
`Login` → `Select Exam` → `Start Exam` → `Answer Questions (saves automatically)` → `Submit` → `Instantly View Result & Leaderboard`.

---

<div align="center">

### 🚀 Built by Vedant

*Crafted with React, Node.js, MongoDB, countless cups of chai ☕, and a passion for building software that makes an impact.*

**Thank you for visiting Quizzer ❤️**

⭐ **If you found this project interesting, consider giving it a star.**

</div>
