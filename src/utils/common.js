
/**
 * 判断对象是否为json格式字符串
 * @param {*} str 
 * @returns 
 */
const isJSON = (str) => {
  if (typeof str == "string") {
    try {
      var obj = JSON.parse(str);
      if (obj && typeof obj == "object") {
        return true;
      } else {
        console.error(str + " is a JSON LIKE String. ||| " + e);
        return false;
      }
    } catch (e) {
      console.error(str + " is not a JSON String. ||| " + e);
      return false;
    }
  }
  console.error(`${str}` + " is not a string!");
  return false;
}

/**
 * 格式化JSON对象为带换行缩进的字符串
 * @param {Object} obj
 * @returns {string} 带换行缩进的JSON字符串
 */
const formatJSONString = (obj) => {
  if (obj && typeof obj == "object") {
    return JSON.stringify(obj, null, '\t')
  } else if (isJSON(obj)) {
    return JSON.stringify(JSON.parse(obj), null, '\t')
  } else return `${obj}`
}

/**
 * 把对象转换成JSON形式的html代码
 * @param {obj} msg 对象
 * @returns {string} JSON形式的html代码
 */
function formatJsonToHTML(msg) {
  var rep = "~";
  var jsonStr = JSON.stringify(msg, null, rep).replace(/\\n/g, "").replace(/[\\]/g,'')
  var str = "";
  for (var i = 0; i < jsonStr.length; i++) {
    var text2 = jsonStr.charAt(i)
    if (i > 1) {
      var text = jsonStr.charAt(i - 1)
      if (rep != text && rep == text2) {
        str += "<br/>"
      }
    }
    str += text2;
  }
  jsonStr = "";
  for (var i = 0; i < str.length; i++) {
    var text = str.charAt(i);
    if (rep == text)
      jsonStr += "        "
    else {
      jsonStr += text;
    }
    if (i == str.length - 2)
      jsonStr += "<br/>"
  }
  return jsonStr;
}
module.exports = { isJSON, formatJSONString, formatJsonToHTML };