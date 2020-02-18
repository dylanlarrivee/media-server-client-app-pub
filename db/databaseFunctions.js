"use strict";
const Pool = require("pg").Pool;
const fs = require("fs");
var bcrypt = require("bcrypt");
const urlExists = require('url-exists');

// const dbLogin = require("../config/config");

require("dotenv").config();

console.log("env:" + process.env.NODE_ENV);

if (process.env.NODE_ENV === "production") {
  var dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    multipleStatements: true
  };
} else {
  var dbConfig = {
    user: process.env.DB_USER_TEST,
    host: process.env.DB_HOST_TEST,
    database: process.env.DB_DATABASE_TEST,
    password: process.env.DB_PASSWORD_TEST,
    port: process.env.DB_PORT_TEST,
    multipleStatements: true
  };
}

const pool = new Pool(dbConfig);

const loginUser = (req, res, next) => {
  const salt = bcrypt.genSaltSync();
  var db_user_name = req.body.username;
  var db_email = req.body.email;
  var db_user_password = req.body.password;
  var db_profile_data = "profile_data";
  var db_movie_data = "movie_data";

  pool.query(
    "SELECT user_name FROM users where user_name ='" + db_user_name + "'",
    (error, results) => {
      if (error) {
        throw error;
      }
      console.log(results.rows[0]);
      if (results.rows[0] == undefined) {
        console.log("user does not already exists");
        res.redirect('/login-error');
      } else {
        console.log("valid user");
        pool.query(
          "SELECT user_password, user_name FROM users where user_name ='" + db_user_name + "'",
          (error, results) => {
            if (error) {
              throw error;
            }
            console.log(results.rows[0]);
            bcrypt
            .compare(db_user_password, results.rows[0].user_password)
            .then(doMatch => {
              if (doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = results.rows[0].user_name; 
                console.log('correct password')
                return req.session.save(err => {
                  console.log(err);
                  res.redirect('/dashboard');
                });
              }
              res.redirect('/login-error');
              console.log('wrong password')
            })
            .catch(err => {
              console.log(err);
              res.redirect('/login-error');
            });
          }
        );
      }
    }
  );
};

const createNewUser = (req, res, next) => {
  const salt = bcrypt.genSaltSync();
  var db_user_name = req.body.username;
  var db_email = req.body.email;
  var db_user_password = bcrypt.hashSync(req.body.password, salt);
  var db_profile_data = "profile_data";
  var db_movie_data = "movie_data";

  if (!req.body.username || !req.body.password) {
    return res.status(400).json('incorrect form submission')
  }
  pool.query(
    "SELECT user_name FROM users where user_name ='" + db_user_name + "'",
    (error, results) => {
      if (error) {
        throw error;
      }
      console.log(results.rows[0]);
      if (results.rows[0] == undefined) {
        console.log("user does not already exists");
        pool.query(
          "INSERT INTO users (user_name, user_password, email, profile_data,movie_data ) VALUES ($1, $2, $3, $4, $5)",
          [
            db_user_name,
            db_user_password,
            db_email,
            db_profile_data,
            db_movie_data
          ],
          (error, results) => {
            if (error) {
              throw error;
            }
            res.redirect("/login");
            console.log("New User added to the database");
          }
        );
      } else {
        console.log("user already exists");
      }
    }
  );
};

const updateNgrokDynamicUrl = function(url) {
  var dynamicUrl = url;
  var sql = "UPDATE users SET dynamic_url ='" + dynamicUrl + "'where id =1";
  pool.query(sql, (error, results) => {
    if (error) {
      throw error;
    }
    console.log("Dynamic url saved to database");
  });
};

const getNgrokDynamicUrl = (req, res, next) => {
  pool.query("SELECT dynamic_url FROM users where id =1", (error, results) => {
    if (error) {
      throw error;
    }
    urlExists(results.rows[0].dynamic_url, function(err, exists) {
    if (exists) {
          //console.log(JSON.parse(results.rows[0]))
    //return results.rows[0].profile_data
    res.status(200).json(results.rows[0].dynamic_url);
    } else {
      res.status(404).json({"dynamicUrlStatus":false}); 
    }
  });

  });
};

const getUserProfileData = (req, res, next) => {
  pool.query("SELECT * FROM users where id = 1", (error, results) => {
    if (error) {
      throw error;
    }
    console.log("movie_data");
    console.log(JSON.parse(results.rows[0].movie_data));
    //return results.rows[0].profile_data
    res.status(200).json(results.rows[0].profile_data);
  });
};

const getUserMediaData = (req, res, next) => {
  pool.query("SELECT * FROM users where id = 1", (error, results) => {
    if (error) {
      throw error;
    }
    //console.log(results)
    //return results.rows[0].profile_data
    res.status(200).json(JSON.parse(results.rows[0].movie_data));
  });
};

const updateUserData = (req, res) => {
  //const { name, json_in } = req.body;
  console.log("userProfileData");
  var userProfileDataJSON = JSON.parse(req.body.userProfileData);
  var userMediaFolders = userProfileDataJSON["mediaFolders"];

  var idCounter = 0;
  var fileInfo = [];

  var getMediaDataPromise = new Promise(function(resolve, reject) {
    var folderCounter = 1;
    var folderLength = userMediaFolders.length;
    userMediaFolders.forEach(function(userMediaFolder, index) {
      var filePath = userMediaFolder.filePath;
      console.log("filePath1");
      console.log(filePath);
      fs.readdir(filePath, (err, files) => {
        console.log("files");
        console.log(files);
        files.forEach(file => {
          // Other way -- var fileInfoString = '{"' + idCounter + '":{"name":"' + file + '","filePath":"' + userMediaFolder + '"}}'
          var fileInfoString =
            '{"id":' +
            idCounter +
            ',"name":"' +
            file +
            '","filePath":"' +
            filePath +
            "/" +
            file +
            '"}';
          var fileInfoObj = JSON.parse(fileInfoString);
          if (file.endsWith(".mp4")) {
            fileInfo.push(fileInfoObj);
            //console.log(fileInfoObj);
            idCounter += 1;
          }
        });
        console.log("folderCounter");
        console.log(folderCounter);
        if (folderCounter == folderLength) {
          console.log("resoved");
          resolve();
        }
        folderCounter += 1;
      });
      console.log("fileInfo2");
      console.log(fileInfo);
    });
  });
  getMediaDataPromise.then(function() {
    var updatedProfileData = JSON.stringify(req.body.userProfileData);
    var fileInfoString = JSON.stringify(fileInfo);
    var sql =
      "UPDATE users SET profile_data ='" +
      updatedProfileData +
      "', movie_data ='" +
      fileInfoString +
      "'where id =1";
    pool.query(sql, (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`Updated user table`);
    });
  });
};

const insertUserData = (req, res) => {
  //const { name, json_in } = req.body;
  pool.query(
    "INSERT INTO users (id, user_name, user_password, email, profile_data,movie_data ) VALUES ($1, $2, $3, $4, $5, $6)",
    [1, "Dylan", "test", "dlarrivee@shawscott.com", "test", "test"],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`Updated user table`);
    }
  );
};

const createSupp = (req, res) => {
  const { name, json_in } = req.body;
  pool.query(
    "INSERT INTO supp_table_test (name, json_in) VALUES ($1, $2)",
    [name, json_in],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(201).send(`User added with name: ${result.name}`);
    }
  );
};

// this function allows for real time updates of the files within the folder however it will require the funcitons to get run everytime the media dashboard is viewed - Not going to use this method right now since it will make it difficult to add in moviedata
const createUserMediaFiles = (req, res, next) => {
  pool.query("SELECT profile_data FROM users", (error, results) => {
    if (error) {
      throw error;
    }
    profileDataJson = JSON.parse(results.rows[0].profile_data);
    profileDataJson2 = JSON.parse(profileDataJson);
    var usersMediaFolders = profileDataJson2["mediaFolders"];
    // res.status(200).json(results.rows);
    //res.status(200).json(results.rows[0].profile_data);
    var idCounter = 0;
    var fileInfo = [];

    var getMediaDataPromise = new Promise(function(resolve, reject) {
      var folderCounter = 1;
      var folderLength = usersMediaFolders.length;
      usersMediaFolders.forEach(function(usersMediaFolder, index) {
        var filePath = usersMediaFolder.filePath;
        console.log("filePath1");
        console.log(filePath);
        fs.readdir(filePath, (err, files) => {
          console.log("files");
          console.log(files);
          files.forEach(file => {
            // Other way -- var fileInfoString = '{"' + idCounter + '":{"name":"' + file + '","filePath":"' + usersMediaFolder + '"}}'
            var fileInfoString =
              '{"id":' +
              idCounter +
              ',"name":"' +
              file +
              '","filePath":"' +
              filePath +
              "/" +
              file +
              '"}';
            var fileInfoObj = JSON.parse(fileInfoString);
            fileInfo.push(fileInfoObj);
            //console.log(fileInfoObj);
            idCounter += 1;
          });
          console.log("folderCounter");
          console.log(folderCounter);
          if (folderCounter == folderLength) {
            console.log("resoved");
            resolve();
          }
          folderCounter += 1;
        });
        console.log("fileInfo2");
        console.log(fileInfo);
      });
    });
    getMediaDataPromise.then(function() {
      console.log("fileInfo_then");
      console.log(fileInfo);
      return res.status(200).send(fileInfo);
    });
  });
};

// this function allows for real time updates of the files within the folder however it will require the funcitons to get run everytime the media dashboard is viewed
const getUserStreamMedia = (req, res, next) => {
  pool.query("SELECT movie_data FROM users", (error, results) => {
    if (error) {
      throw error;
    }
    var userMovieData = results.rows[0].movie_data;
    var movieDataJson = JSON.parse(userMovieData);
    // res.status(200).json(results.rows);
    //res.status(200).json(results.rows[0].profile_data);
    var id = req.params.id;
    var mediaPath = movieDataJson[id]["filePath"];
    console.log("current media name:" + movieDataJson[id]["name"]);
    
    const stat = fs.statSync(mediaPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    //console.log(req.headers);
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(mediaPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4"
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4"
      };
      res.writeHead(200, head);
      fs.createReadStream(mediaPath).pipe(res);
    }
  });
};

module.exports = {
  createSupp,
  updateUserData,
  insertUserData,
  getUserProfileData,
  getUserMediaData,
  getUserStreamMedia,
  createUserMediaFiles,
  updateNgrokDynamicUrl,
  getNgrokDynamicUrl,
  createNewUser,
  loginUser
};
