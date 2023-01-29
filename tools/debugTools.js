const reqLogger = (req) => {
  let reqInfoStr = `USER: ${req.user.username}, Received req: ${JSON.stringify(req.query)}\n`;
  for (let item in req.query) {
      reqInfoStr += `${item} = ${req.query[item]}, `;
  }
  console.log(reqInfoStr);
} 

module.exports = {reqLogger};