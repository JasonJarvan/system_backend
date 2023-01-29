const fs = require("fs-extra");
const Client = require("ssh2-sftp-client");
const mysql = require("../../common/mysql");
const moment = require("moment");
const cheerio = require("cheerio");
const encoding = "utf8";
const TEMP_DIR = "/cmstemp1";
const PAGE_DIR = "/news";
const HOME_PAGE = "/solo/index.html";

const path = process.env.OFFICIAL_SITE_PATH || "/var/project/www";
const sftpConfig = {
  host: process.env.OFFICIAL_SITE_HOST,
  port: process.env.OFFICIAL_SITE_PORT,
  username: process.env.OFFICIAL_SITE_USER,
  password: process.env.OFFICIAL_SITE_PASSWORD
};

let retryCount = 5;
let generating = false;
const generateFiles = async () => {
  generating = true;
  if (sftpConfig.host) {
    let sftp;
    try {
      // connect to remote server
      sftp = new Client();
      await sftp.connect(sftpConfig);

      // get remote home page.
      const indexBuffer = await sftp.get(path + HOME_PAGE);
      const data = indexBuffer.toString();
      await generateHomePage(data);
      // sent index.html
      await sftp.put(TEMP_DIR + HOME_PAGE, path + HOME_PAGE);

      // end session
      sftp.end();
    } catch (error) {
      if (sftp) sftp.end();
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
    const data = await fs.readFile(path + HOME_PAGE, { encoding });
    await generateHomePage(data);
    await fs.copy(TEMP_DIR + HOME_PAGE, path + HOME_PAGE);
  }

  await complete();
};

const generateHomePage = async (data) => {
  const mySqlConn = mysql({ dbname: "admin" });
  const { result: linkList } = await mySqlConn.runQuery({
    sql: `SELECT * FROM ums_cms_links WHERE release_type=0 ORDER BY sort`
  });
  const $ = cheerio.load(data);
  // remove current links
  const li = $(".con_right ul li");
  li.empty();
  for (let i = 0; i < linkList.length; i++) {
    const link = linkList[i];
    li.eq(i % 4).append(
      `<a href="${link.url}" ref="nofollow" target="_blank">${link.name}</a>`
    );
  }
  await fs.outputFile(TEMP_DIR + HOME_PAGE, $.html());
};

const complete = async () => {
  await fs.remove(TEMP_DIR);
  retryCount = 5;
  generating = false;
};

module.exports = async function generateHomePageLinks() {
  if (generating) return Promise.reject("Pages are already generating!");
  return generateFiles();
};
