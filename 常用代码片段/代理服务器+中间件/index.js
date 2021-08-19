const express = require("express");
const fs = require("fs");
const request = require("request").defaults({
  // proxy: "http://127.0.0.1:8888",//设置代理，主要用于调试
  strictSSL: false, //关闭ssl的验证
});
const {
  createProxyMiddleware,
  responseInterceptor,
} = require("http-proxy-middleware");
const port = 8992;
const JSZip = require("jszip");

let proxyConfig = {
  cookie: undefined,
};

//同步请求
function requestSync(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, res, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

//这些都是个人需求点了，我是因为服务器那边无法直接访问内网的仓库，所以采用代理到本机再去访问
async function initCookie() {
  if (!fs.existsSync("./proxyConfig.json")) {
    fs.writeFileSync(
      "./proxyConfig.json",
      JSON.stringify(proxyConfig, null, 2)
    );
  }
  proxyConfig = JSON.parse(fs.readFileSync("./proxyConfig.json"));
  let validCookie = await requestSync({
    url: `https://192.168.226.202:8992/xxxx/src/dev`,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
      cookie: proxyConfig.cookie,
    },
    followRedirect: false,
  }).catch(() => false);
  if (typeof validCookie !== "boolean" && validCookie.statusCode === 302) {
    let newCookie = validCookie.headers["set-cookie"]
      .map((cookie) => cookie.split(";")[0])
      .join(";");
    let getNewCookie = await requestSync({
      url: `https://192.168.226.202:8992/user/login`,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        cookie: newCookie,
      },
      followRedirect: false, //不允许重定向
      body: "user_name=xxxx&password=xxxx",
      method: "post",
    }).catch(() => false);
    if (typeof getNewCookie !== "boolean" && getNewCookie.statusCode === 302) {
      proxyConfig.cookie = newCookie;
      fs.writeFileSync(
        "./proxyConfig.json",
        JSON.stringify(proxyConfig, null, 2)
      );
    }
  }
  return Promise.resolve(true);
}

const app = express();

// 监听所有的请求，可在入口点处理一些事情
app.use(async (req, res, next) => {
  if (req.path.includes("proxy")) {
    await initCookie();
    req.headers["cookie"] = proxyConfig.cookie;
    next();
  } else {
    next();
  }
});

//创建中间件和配置项
const proxyOption = {
  target: "https://192.168.226.202:8992/", //目标后端服务地址(公司同事电脑地址)
  changeOrigoin: true,
  secure: false,
  pathRewrite: { "^/proxy": "" },
  onProxyReq(proxyReq, req, res) {
    // 在请求前增加点东西
    // proxyReq.setHeader("Cookie", proxyConfig.cookie)
  },
  selfHandleResponse: true, //也可以控制返回的内容
  onProxyRes: responseInterceptor(
    async (responseBuffer, proxyRes, req, res) => {
      //个人需求点
      let tempData = fs.writeFileSync("./temp.rar", responseBuffer);
      res.setHeader("content-disposition", "attachment; filename=abc");
      let zip = await JSZip.loadAsync(responseBuffer).catch(() => false);
      if (zip !== false) {
        let oldPackagkJsonFileData = await zip
          .file("dcfile-web-dev/package.json")
          .async("string")
          .catch(() => false);
        if (oldPackagkJsonFileData !== false) {
          let newPackagkJsonFileData = JSON.parse(oldPackagkJsonFileData);
          newPackagkJsonFileData.scripts.build =
            "node --max_old_space_size=4096 scripts/build.js";
          zip.file(
            "dcfile-web-dev/package.json",
            JSON.stringify(newPackagkJsonFileData, null, 2)
          );
        }
      }
      let newZip = await zip.generateAsync({
        type: "uint8array",
        compressionOptions: {
          level: 6,
        },
      });
      console.log(newZip.length);
      return newZip;
    }
  ),
};
app.use("/proxy", createProxyMiddleware(proxyOption));

//监听对应的端口
app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});

// 原地址：https://192.168.226.202:8992/xxxx/archive/dev.zip
// 代理地址：http://192.168.188.132:8992/proxy/xxxx/archive/dev.zip
