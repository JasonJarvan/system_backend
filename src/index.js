let server = require("./server");
let app = new server();
app.start();
process.on('uncaughtException',function(err){
  console.error('未捕获的异常', err);
})

process.on('unhandledRejection', function (err, promise) {
  console.error('有Promise没有被捕获的失败函数', err);
})