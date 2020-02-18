"use strict";
const fs = require("fs");
const db = require("../db/databaseFunctions");

var testMedia = require("../testData/moviePayload.json");

exports.getMediaFiles = (req, res, next) => {
    var idCounter = 0;
    var fileInfo = [];
    fs.readdir(testFolder, (err, files) => {
      files.forEach(file => {
        // Other way -- var fileInfoString = '{"' + idCounter + '":{"name":"' + file + '","filePath":"' + testFolder + '"}}'
        var fileInfoString = '{"id":' + idCounter + ',"name":"' + file + '","filePath":"' + testFolder + '/' + file +'"}'
        var fileInfoObj = JSON.parse(fileInfoString);
        fileInfo.push(fileInfoObj);
        //console.log(fileInfoObj);
        idCounter += 1
      });
      return res.status(200).send(fileInfo);
    });
  };


  exports.streamMediaFiles = (req, res, next) => {
    var id = req.params.id;
    console.log("testMedia");
    console.log(testMedia);
    var  mediaPath = testMedia[id]["filePath"];
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

  };
