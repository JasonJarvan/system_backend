const uploadsFolder = process.env.UPLOADS_FOLDER || `/avatar/img/`;
const jwt=require("jsonwebtoken")
exports.uploadAvator=(req,res)=>{
    let auth = req.headers.authorization;
    let token = auth.substring(7);
    let id = jwt.decode(token).id;
    res.status(200).json(
        {
            code:200,
            url:`${uploadsFolder}${id}/avatar.png`
        }
    )
    
}