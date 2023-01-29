const logger = (req, res, next) => {
    console.log("method:", req.method, "url:", req.url)
    next()
    return
}
module.exports = { logger }