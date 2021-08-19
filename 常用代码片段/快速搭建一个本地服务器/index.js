const express = require("express");
const path = require("path");
const open = require("open");//该插件主要是用来打开如URL、文件、可执行文件之类的东西，还是跨平台。
const app = express();
const port = 8800;

//设置静态资源路径为根目录（第二个参数）
app.use(express.static(path.join(__dirname, "static")));

//解析表单格式=application/x-www-form-urlencoded的数据
app.use(express.urlencoded({ extended: false }));

//监听所有的请求，解决跨域
app.use((req, res, next) => {
  res.append("Access-Control-Allow-Headers", "*");
  res.append("Access-Control-Allow-Methods", "*");
  res.append("Access-Control-Allow-Origin", "*");
  next();
});

app.delete("/delete", async (req, res) => {
  setTimeout(() => {
    res.send({
      code: 0,
      data: req.body,
    });
  }, 30000);
});

app.post("/post", async (req, res) => {
  console.log(new Date().toString(), req.body);
  res.send({
    code: 0,
    data: req.body,
  });
});

app.get("/get", async (req, res) => {
  console.log(req.headers, "req.headers");
  res.send({
    code: 0,
    data: req.body,
    query: req.query,
    headers: req.headers,
  });
});

//监听对应的端口
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
  open(`http://localhost:${port}`);
});
