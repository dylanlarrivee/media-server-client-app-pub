const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require('morgan')
const path = require("path");
var cookieParser = require('cookie-parser');
var session = require('express-session');

const mediaFunctions = require("./controllers/mediaFunctions");
const torrentFunctions = require("./controllers/torrentFunctions");
const db = require("./db/databaseFunctions");

// Used for env files
require('dotenv').config()


// set up morgan for http request logging
// app.use(morgan('combined'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
  key: 'user_sid',
  secret: process.env.EXPRESS_SESSIONS_SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
      expires: 6000003
  }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');        
  }
  next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
      res.redirect('/dashboard');
  } else {
      next();
  }    
};

// middleware function to check for logged-in users to access the dashboard
var dashboardAccessChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    next();
  } else {
    res.redirect('/');  
  }    
};


// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
  res.redirect('/login');
});

// This pulls in static css and image files from the public folder
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/data")));
app.use(express.static(path.join(__dirname, "/js")));
app.use(express.static(path.join(__dirname, "/controllers")));



// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/signup.html');
    })
    .post(db.createNewUser);

// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/login.html');
    })
    .post(db.loginUser);

// re route for user when loggin in with incorrect username or password
app.route('/login-error')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/loginError.html');
    })
    .post(db.loginUser);    

// route for user logout
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      req.session.destroy(err => {
          console.log(err);
          res.redirect('/');
        });
  } else {
      res.redirect('/login');
  }
});

app.get("/dashboard", dashboardAccessChecker, function(req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/admin", dashboardAccessChecker, function(req, res) {
  res.sendFile(path.join(__dirname + "/public/admin.html"));
});


// Save get and update user data to the database
app.get("/user-data", dashboardAccessChecker, db.getUserProfileData);
//app.post("/user-data", db.updateUserData);

app.get("/videos/:id", db.getUserStreamMedia);

// Get dynamic url
app.get("/dynamic-url", db.getNgrokDynamicUrl);

// Get media file info from a users selected folder
app.get("/media-files", db.getUserMediaData);

// Torrent streaming
app.get("/torrent-media/:magnetLink", torrentFunctions.streamTorrent);

// Stream torrent media
app.get("/torrent", dashboardAccessChecker, function(req, res) {
  res.sendFile(path.join(__dirname + "/public/torrentTest.html"));
});

// route for handling 404 requests(unavailable routes)
app.use(function(req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

app.listen(3000, '0.0.0.0', function() {
  console.log("Listening on port 3000!");
 });



