//express解析各种格式的数据的好文分享：https://juejin.cn/post/6844903856225140743

const express = require("express");
const path = require("path");
const open = require("open");//该插件主要是用来打开如URL、文件、可执行文件之类的东西，还是跨平台。
const multer = require("multer");//解析表单格式=multipart/form-data的数据
const upload = multer();
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

//处理文件上传，并做了个中转将文件流转发到另外的一台存储服务器的案例
app.post("/uploader", upload.array("files"), async (req, res) => {
  //let formData = req.body; //除文件流外的表单数据
  //这里我默认取了数组的第一个数据，大家根据实际的情况进行组合数据
  const { originalname, mimetype, buffer } = req.files[0];
  request.post(
    {
      url: "xxx",
      headers: {
        Authorization:
          "Bearer xxx",
      },
      formData: {
        file: {
          value: buffer,
          options: {
            filename: originalname,
            contentType: mimetype,
          },
        },
      },
    },
    (error, res, body) => {
      // console.log(res)
    }
  );
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
