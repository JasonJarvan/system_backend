# system_backend

### request entity limit

请求体大小默认为 100k，如果出现请求返回`request entity too large`的情况，要修改请求体大小限制。

在`/src/server.js`中，修改：

```javascript
app.use(express.json({ limit: "10mb" }));
```
