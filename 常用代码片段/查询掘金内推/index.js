const request = require("request");
const fs = require("fs");
const requestMsgCount = 10000; //请求的数量
const matchContentRegExp = /福建|福州|厦门|泉州|宁德/gi; //匹配的文字
//ps：根据掘金接口来决定该脚本的时效性
request.post(
  {
    url: "https://api.juejin.cn/recommend_api/v1/short_msg/topic",
    strictSSL: false,
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
    },
    body: {
      sort_type: 500,
      limit: requestMsgCount,
      cursor: "0",
      topic_id: "6819970850532360206",
    },
    json: true,
    // proxy: "http://127.0.0.1:8888",
  },
  (error, res) => {
    if (error) {
      console.error("服务器出错啦:", error);
    } else if (res.body.err_no !== 0) {
      console.error("服务器正常,但接口出错啦:", res.body.err_msg);
    } else {
      parseData(res.body.data);
    }
  }
);
//解析数据
const parseData = (data) => {
  let myNeedData = [];
  data.forEach((item) => {
    //https://juejin.cn/user/307518984431629
    const { content, pic_list, user_id, mtime } = item.msg_Info;
    if (matchContentRegExp.test(content)) {
      let template = `
            <div style="border:1px solid red;margin:10px 0">
                用户链接:<a href="https://juejin.cn/user/${user_id}" target="_blank">https://juejin.cn/user/${user_id}</a>
                <br />
                创建时间:${new Date(mtime * 1000).toLocaleString()}
                <hr />
                ${content}
                <hr />
                ${pic_list
                  .map((imgUrl) => {
                    return `<img src="${imgUrl}" style="max-width: 800px;" />`;
                  })
                  .join("")}
            </div>
        `;
      myNeedData.push(template);
    }
  });
  myNeedData.length &&
    fs.writeFileSync(
      "./juejin.html",
      `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>lalala</title>
    </head>
    <body>
        <h2>匹配到的数据:${myNeedData.length}</h2>
        ${myNeedData.join("")}
    </body>
    </html>
  `
    );
};
