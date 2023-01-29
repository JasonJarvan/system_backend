const fs = require("fs-extra");
const Client = require("ssh2-sftp-client");
const mysql = require("../../common/mysql");
const moment = require("moment");
const cheerio = require("cheerio");
const encoding = "utf8";
const TEMP_DIR = "/cmstemp";
const PAGE_DIR = "/news";
const INFO_PAGE = "/news.html";
const HOME_PAGE = "/solo/index.html";
const TAG_DIR = "/tags";

const path = process.env.OFFICIAL_SITE_PATH || "/var/project/www";
const sftpConfig = {
  host: process.env.OFFICIAL_SITE_HOST,
  port: process.env.OFFICIAL_SITE_PORT,
  username: process.env.OFFICIAL_SITE_USER,
  password: process.env.OFFICIAL_SITE_PASSWORD
};
let mySqlConn;
let sftp;
let retryCount = 5;
let generating = false;
const generateFiles = async () => {
  generating = true;
  mySqlConn = mysql({ dbname: "admin" });
  if (sftpConfig.host) {
    // connect to remote server
    sftp = new Client();
    await sftp.connect(sftpConfig);
  }
  const { result: articleList } = await mySqlConn.runQuery({
    sql: `SELECT id,article_title,info_introduction,release_time,tags,article_image
     FROM ums_cms_article WHERE is_release=1 AND release_time<CURRENT_TIMESTAMP AND release_type IN (0,2) ORDER BY release_time DESC`
  });
  try {
    await Promise.all([
      generateArticle(articleList),
      generateInfomation(articleList),
      generateHomePage(articleList)
    ]);
  } catch (error) {
    console.log(error);
  }

  await sentFiles();
  await complete();
};

const getTemplate = async (page) => {
  let data;
  if (sftp) {
    try {
      const buffer = await sftp.get(path + page);
      data = buffer.toString();
      // end session
    } catch (error) {
      sftp.end();
      return;
    }
  } else {
    data = await fs.readFile(path + page, { encoding });
  }
  return data;
};

const generateArticle = async (articleList) => {
  const data = await getTemplate("/news_details.html");
  for (let i = 0; i < articleList.length; i++) {
    const $ = cheerio.load(data);
    const { result } = await mySqlConn.runQuery({
      sql: `SELECT * FROM ums_cms_article WHERE id=?`,
      values: [articleList[i].id]
    });
    const article = result[0];
    $("title").html(article.article_title + "-ToDesk官网");
    $('meta[name="description"]').attr("content", article.info_introduction);
    $('meta[name="keywords"]').attr(
      "content",
      article.tags || article.info_introduction
    );
    $(".consulting_details h2").html(article.article_title);
    $(".consulting_details .datetime").html(
      moment(article.release_time).format("YYYY-MM-DD HH:mm:ss")
    );
    if (article.tags) {
      const tagArr = article.tags.split(",");
      for (let j = 0; j < tagArr.length; j++) {
        const tagName = tagArr[j];
        $(".consulting_details .info").append(
          `<a class="tag" href="${TAG_DIR}/${tagName}.html">${tagName}</a>`
        );
        await generateTagPage(tagName);
      }
    }
    $(".consulting_details .content").html(article.info_content);

    const prev = $(".consulting_details .prev");
    const next = $(".consulting_details .next");
    prev.removeAttr("href");
    prev.find("span").text("无");
    next.removeAttr("href");
    next.find("span").text("无");
    if (i > 0) {
      const prevArticle = articleList[i - 1];
      prev.attr("href", `${PAGE_DIR}/${prevArticle.id}.html`);
      prev.find("span").text(prevArticle.article_title);
      prev.find("img").attr("src", "/image/consulting/icon_superior_have.png");
    }
    if (i < articleList.length - 1) {
      const nextArticle = articleList[i + 1];
      next.attr("href", `${PAGE_DIR}/${nextArticle.id}.html`);
      next.find("span").text(nextArticle.article_title);
      next.find("img").attr("src", "/image/consulting/icon_down_have.png");
    }

    await fs.outputFile(`${TEMP_DIR}${PAGE_DIR}/${article.id}.html`, $.html());
  }
};

const generateTagPage = async (tagName) => {
  const { result: articleList } = await mySqlConn.runQuery({
    sql: `SELECT id,article_title,info_introduction,release_time,tags,article_image
     FROM ums_cms_article 
     WHERE is_release=1 AND release_time<CURRENT_TIMESTAMP AND release_type IN (0,2) AND tags LIKE '%${tagName}%' 
     ORDER BY release_time DESC`
  });
  generateInfomation(articleList, tagName);
};
const generateInfomation = async (articleList, tagName) => {
  if (tagName) {
    const exist = await fs.pathExists(`${TEMP_DIR}${TAG_DIR}/${tagName}.html`);
    if (exist) return;
  }
  const data = await getTemplate(INFO_PAGE);
  const $ = cheerio.load(data);
  if (tagName) {
    $("title").html(tagName + "-ToDesk远程控制软件官网");
    $('meta[name="description"]').attr(
      "content",
      `ToDesk远程控制${tagName}专题页提供ToDesk远程控制${tagName}相关资讯，ToDesk采用端对端加密,让每一次远程访问都安全可靠.`
    );
    $('meta[name="keywords"]').attr("content", tagName);
    $(".crumbs").append(`&gt; <a href="">${tagName}</a>`);
    $(".banner .txt h1").html(`ToDesk精彩点拨`);
    $(".banner .txt p").html(`聚焦远程控制智能化技术，创建高效快捷安全性服务`);
  }
  $(".consulting").remove();
  $(".page").before(`<div class="consulting"></div>`);
  let content = $(".consulting");
  const appendLink = (link) => {
    if (content.children().length == 6) {
      $(".page").before(content.clone());
      content = $(".consulting").last();
      content.css("display", "none");
      content.empty();
    }
    content.append(link);
  };
  let imageId = 1;
  for (let i = 0; i < articleList.length; i++) {
    const article = articleList[i];
    if (imageId == 24) imageId = 1;
    let tags = "";
    if (article.tags) {
      const tagArr = article.tags.split(",");
      tagArr.forEach((tag) => {
        tags += `<a class="tag" href="${TAG_DIR}/${tag}.html">${tag}</a>`;
      });
    }
    const imageUrl = article.article_image
      ? article.article_image
      : `/image${PAGE_DIR}/${imageId}.jpg`;
    appendLink(
      `<div class="content">
        <a href="${PAGE_DIR}/${article.id}.html">
          <img src="${imageUrl}" loading="lazy" />
        </a>
        <div class="r_content">
          <a href="${PAGE_DIR}/${article.id}.html">
            <h2>${article.article_title}</h2>
            <p>${article.info_introduction || ""}</p>
          </a>
          <span>
            <img src="/image/consulting/logo.png" class="logo" />
            <span>
            ${moment(article.release_time).format("YYYY-MM-DD HH:mm:ss")}
            </span>
            ${tags}
          </span>
        </div>
      </div>`
    );
    imageId++;
  }

  // set page count
  const total = $(".consulting").length;
  $(".page ul").empty();
  for (let i = 1; i <= total; i++) {
    let li = `<li>${i}</li>`;
    if (i == 1) li = `<li class="on">${i}</li>`;
    if (total > 7 && i > 5 && i < total) {
      if (i == total - 1) {
        li = `<li>...</li>`;
      } else {
        continue;
      }
    }
    $(".page ul").append(li);
  }
  if (tagName) {
    await fs.outputFile(`${TEMP_DIR}${TAG_DIR}/${tagName}.html`, $.html());
  } else {
    await fs.outputFile(TEMP_DIR + INFO_PAGE, $.html());
  }
};
const generateHomePage = async (articleList) => {
  const data = await getTemplate(HOME_PAGE);
  if (data) {
    const $ = cheerio.load(data);
    const ul = $(".con_left ul");
    $(".con_left a").attr("href", INFO_PAGE);
    ul.empty();
    for (let i = 0; i < articleList.length; i++) {
      if (i == 3) break;
      const article = articleList[i];
      let tags = "";
      if (article.tags) {
        const tagArr = article.tags.split(",");
        tagArr.forEach((t) => {
          tags += `<a class="tag" href="${TAG_DIR}/${t}.html">${t}</a>`;
        });
        if (tags) tags = `<div class="tags">${tags}</div>`;
      }
      ul.append(
        `<li>
          <a href="${PAGE_DIR}/${article.id}.html">
            <h6>${article.article_title}</h6>
            <p>${article.info_introduction || ""}</p>
            </a>
            ${tags}
        </li>`
      );
    }
    await fs.outputFile(TEMP_DIR + HOME_PAGE, $.html());
  }
};
const sentFiles = async () => {
  if (sftp) {
    try {
      // remove the files on remote server.
      const pageDirExist = await sftp.exists(path + PAGE_DIR);
      if (pageDirExist) await sftp.rmdir(path + PAGE_DIR, true);

      // sent index.html
      await sftp.put(TEMP_DIR + HOME_PAGE, path + HOME_PAGE);
      // sent infomation.html
      await sftp.put(TEMP_DIR + INFO_PAGE, path + INFO_PAGE);
      // sent the article files to remote server
      await sftp.uploadDir(TEMP_DIR + PAGE_DIR, path + PAGE_DIR);

      const exist = await fs.pathExists(`${TEMP_DIR}${TAG_DIR}`);
      if (exist) await sftp.uploadDir(TEMP_DIR + TAG_DIR, path + TAG_DIR);
      // sent the tage page files to remote server
    } catch (error) {
      sftp.end();
      if (retryCount) {
        console.log(
          `${retryCount}: send files failed, try again after 1 minute.`,
          error
        );
        retryCount--;
        // retry after 1 minute
        setTimeout(generateFiles, 1000 * 60);
      } else {
        complete();
        console.error(error);
      }
    }
  } else {
    // remove the files.
    await fs.rmdir(path + PAGE_DIR, { recursive: true });
    await fs.copy(TEMP_DIR + HOME_PAGE, path + HOME_PAGE);
    await fs.copy(TEMP_DIR + PAGE_DIR, path + PAGE_DIR);
    await fs.copy(TEMP_DIR + INFO_PAGE, path + INFO_PAGE);
    const exist = await fs.pathExists(`${TEMP_DIR}${TAG_DIR}`);
    if (exist) await fs.copy(TEMP_DIR + TAG_DIR, path + TAG_DIR);
  }
};

const complete = async () => {
  await fs.remove(TEMP_DIR);
  if (sftp) sftp.end();
  mySqlConn = undefined;
  retryCount = 5;
  generating = false;
};

module.exports = async function generateArticlePages() {
  if (generating) return Promise.reject("Pages are already generating!");
  return generateFiles();
};
