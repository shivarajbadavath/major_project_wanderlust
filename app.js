// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapAsync.js");

// Models
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

// Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const app = express();
const port = process.env.PORT || 3000;
const dbUrl = process.env.ATLASDB_URL; // MongoDB Atlas URL

// Database connection
main().then(() => {
    console.log("✅ Database connected");
}).catch(err => console.error("❌ DB Connection Error:", err));

async function main() {
    await mongoose.connect(dbUrl);
}

// View engine setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// Mongo Store for Sessions
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "defaultsecret",
    },
    touchAfter: 24 * 3600, // Only update session once per day
});

store.on("error", (err) => {
    console.log("❌ Session Store Error:", err);
});

// Session configuration
const sessionOptions = {
    store,
    secret: process.env.SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport authentication setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash + Current User middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});
// ✅ Global Middleware (so `currUser` is always available in EJS)
app.use((req, res, next) => {
    res.locals.currUser = req.user || null;
    next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Root route (optional for testing)
app.get("/", (req, res) => {
    res.send("🚀 Wanderlust App is Running!");
});

// 404 Error
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!";
    res.status(statusCode).render("error.ejs", { message: err.message });
});

// Start server
app.listen(port, () => {
    console.log(`✅ App is running on port ${port}`);
});
