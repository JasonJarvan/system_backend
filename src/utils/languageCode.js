const languageCode = [
  { code: "zh-Hans", en: "Chinese (Simplified)", zh: "中文(简体)", native: "中文(简体)" },
  { code: "zh-Hant", en: "Chinese (Traditional)", zh: "中文(繁体)", native: "中文(繁體)" },
  { code: "en", en: "English", zh: "英语", native: "English" },
  { code: "bn", en: "Bengali", zh: "孟加拉语", native: "বাংলা (বাংলাদেশ)" },
  { code: "de", en: "German", zh: "德语", native: "Deutsch" },
  { code: "fr", en: "French", zh: "法语", native: "français" },
  { code: "hi", en: "Hindi", zh: "印地语", native: "हिंदी" },
  { code: "id", en: "Indonesian", zh: "印度尼西亚语", native: "Bahasa Indonesia" },
  { code: "ru", en: "Russian", zh: "俄语", native: "русский" },
  { code: "ja", en: "Japanese", zh: "日语", native: "日本語" },
  { code: "ko", en: "Korean", zh: "韩语", native: "한국어" },
  { code: "mr", en: "Marathi", zh: "马拉地语", native: "मराठी" },
  { code: "th", en: "Thai", zh: "泰语", native: "ไทย" },
  { code: "vi", en: "Vietnamese", zh: "越南语", native: "Tiếng Việt" },
  { code: "es", en: "Spanish", zh: "西班牙语", native: "español" },
  { code: "pt", en: "Portuguese", zh: "葡萄牙语", native: "Português" }
];

const languageCodeMap = languageCode.reduce((acc, cur) => {
  acc[cur.code] = cur;
  return acc;
}, {});
module.exports = {
  languageCode,
  languageCodeMap,
  getLanguageCodeByCode: (code) => languageCodeMap[code]
};
