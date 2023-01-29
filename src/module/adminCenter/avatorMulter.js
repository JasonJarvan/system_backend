var multer = require("multer");
var jwt = require("jsonwebtoken");
const path = require("path");
const uploadsFolder = process.env.UPLOADS_FOLDER || `/avatar/img/`;
//support max file size 10M
const maxSize = 10 * 1024 * 1024;
let fs = require("fs");
/*
    multer file filter
    Only .png, .jpg and .jpeg format allowed!
*/

let fileFilter = (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // if (!req.params.id){
    //     return cb(new Error('Id is required'))
    // }

    let auth = req.headers.authorization;
    if (!auth) {
      return cb(new Error("authorization error"));
    }
    let token = auth.substring(7);
    let tokenId = jwt.decode(token).id;
    let id=req.params.id?req.params.id:tokenId
    
    let imgpath = path.join(__dirname, "../../../public", uploadsFolder, id);
    fs.mkdirSync(imgpath, { recursive: true });
    cb(null, imgpath);
  },
  filename: function (req, file, cb) {
    //let filename =(new Date()).getTime()+ file.originalname.replace(/\(|\)| /gi, "");
    cb(null, "avatar.png");
  },
});
const uploads = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: maxSize },
});
//const uploads=multer({ dest: 'uploads/' })
module.exports = uploads;
