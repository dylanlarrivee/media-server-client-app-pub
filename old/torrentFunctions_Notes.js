
const torrentStream = require("torrent-stream");
const fs = require("fs");
const path = require('path');
const parseRange = require('range-parser');
const engine = torrentStream('magnet:?xt=urn:btih:11a2ac68a11634e980f265cb1433c599d017a759');
const getTorrentFile = new Promise(function (resolve, reject) {
  engine.on('ready', function() {
    engine.files.forEach(function (file, idx) {
        console.log(file.name)
    //   const ext = path.extname(file.name).slice(1);
    //   if (ext === 'mkv' || ext === 'mp4') {
    //     file.ext = ext;
    //     resolve(file);
     // }
     if (file.name == 'Sintel.mp4') {
        resolve(file);
     }
    });
  });
});

const streamTorrent = function (req, res) {
    if (req.url != '/Guardians.of.the.Galaxy.2014.1080p.BluRay.x264.YIFY.mp4') {
        res.setHeader('Content-Type', 'text/html');
        if (req.method !== 'GET') return res.end();
        var rpath = __dirname + '/views/index.pug';
        fs.readFile(rpath, 'utf8', function (err, str) {
          var fn = pug.compile(str, { filename: rpath, pretty: true});
          res.end(fn());
        });
      } else {
        res.setHeader('Accept-Ranges', 'bytes');
        getTorrentFile.then(function (file) {
          res.setHeader('Content-Length', file.length);
          res.setHeader('Content-Type', `video/${file.ext}`);
          const ranges = parseRange(file.length, req.headers.range, { combine: true });
          if (ranges === -1) {
            // 416 Requested Range Not Satisfiable
            res.statusCode = 416;
            return res.end();
          } else if (ranges === -2 || ranges.type !== 'bytes' || ranges.length > 1) {
            // 200 OK requested range malformed or multiple ranges requested, stream entire video
            if (req.method !== 'GET') return res.end();
            return file.createReadStream().pipe(res);
          } else {
            // 206 Partial Content valid range requested
            const range = ranges[0];
            res.statusCode = 206;
            res.setHeader('Content-Length', 1 + range.end - range.start);
            res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${file.length}`);
            if (req.method !== 'GET') return res.end();
            return file.createReadStream(range).pipe(res);
          }
        }).catch(function (e) {
          console.error(e);
          res.end(e);
        });
      }
    };



var WebTorrent = require('webtorrent')

var client = new WebTorrent()
var magnetURI = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent'

client.add(magnetURI, function (torrent) {
  // Got torrent metadata!
 // console.log('Client is downloading:', torrent.infoHash)
//console.log(torrent.files)

  torrent.files.forEach(function (file) {
    // Display the file by appending it to the DOM. Supports video, audio, images, and
    // more. Specify a container element (CSS selector or reference to DOM node).
   // file.appendTo('body')
   //console.log("new file:" + file)
  })
})





const torrentStream = require("torrent-stream");
const fs = require("fs");

var torrentId =
"magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent"


var engine = torrentStream(torrentId);


// engine.on("ready", function() {
//   engine.files.forEach(function(file) {
//     var stream = file.createReadStream();
//    // console.log("stream");
//    // console.log(stream);
//    // console.log(engine.path)
//    stream.pipe(res)
//     //console.log(stream._engine.EventEmitter.swarm.Swarm.size)

//     // stream is readable stream to containing the file content
//   });
// });


const streamTorrent = (req, res, next) => {
    engine.on("ready", function() {
        engine.files.forEach(function(file) {
          var stream = file.createReadStream({
            start: 10,
            end: 100
        });
         // console.log("stream");
         console.log(stream);
         // console.log(engine.path)
         const head = {
            "Content-Length": 100,
            "Content-Type": "video/mp4"
          };
          res.writeHead(200, head);
         stream.pipe(res)
          //console.log(stream._engine.EventEmitter.swarm.Swarm.size)
      
          // stream is readable stream to containing the file content
        });
      });
  };

const streamTorrent2 = (req, res, next) => {
    engine.on("ready", function() {
      engine.files.forEach(function(file) {
          console.log(engine.path)
          console.log("current media name:" + file.name);
          const stat = fs.statSync(mediaPath);
          const fileSize = stat.size;
          const range = req.headers.range;
          //console.log(req.headers);
          var stream = file.createReadStream({
            start: 0,
            end: 100
        });
            const head = {
              "Content-Length": 100,
              "Content-Type": "video/mp4"
            }
            res.writeHead(200, head);
            stream.pipe(res);
      });
    });
  };


const streamTorrent_OLD = (req, res, next) => {
  engine.on("ready", function() {
    var mediaPath = '/Users/Dylan/Desktop/A\ Claymation\ Christmas\ Celebration-A\ Claymation\ Christmas\ Celebration.mp4';
    engine.files.forEach(function(file) {
        console.log(engine.path)
        console.log("current media name:" + file.name);
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
  });
};

module.exports = {
    streamTorrent
};
