if(process.env.NODE_ENV!="production"){
    require("dotenv").config()
}



const express = require("express");
const app = express();
const mongoose = require("mongoose");
//const mongo_url = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");


const session = require("express-session");
const MongoStore=require("connect-mongo");
const flash = require("connect-flash");
const path = require("path");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const passport=require('passport')
const LocalStrategy=require('passport-local')
const User=require("./models/user.js")

const port = process.env.PORT || 3000;
// Database connection
main().then(() => {
    console.log("db is connected");
}).catch(err => { console.log(err) });

async function main() {
    await mongoose.connect(dbUrl);
}

// View engine setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.json());
const MO = require("method-override");
app.use(MO("_method"));


const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log("Error in MONGO SESSION STORE", err);
});


// Session configuration
const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    },
};

// Session and flash middleware
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// Flash messages middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser=req.user;
    next();
});
// app.get("/demouser",async(req,res)=>{
//     let fakeUser=new User({
//         email:"shiva@gmail.com",
//         username:"shiva123"
//     })
//     let registeredUser=await User.register(fakeUser,"shiva2019d");
//     res.send(registeredUser);
// })

// Routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

// app.get("/", (req, res) => {
//     res.send("root is working");
// });

// Error handling
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message } = err;
    res.status(statusCode).render("error.ejs", { message });
});

app.listen(port, () => {
    console.log(`App is running on port ${port}`);
});