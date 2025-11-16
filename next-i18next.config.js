const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "th", "zh", "vi", "id", "es", "fr", "de", "ja", "ko"],
  },
  localePath: path.resolve("./public/locales"),
  ns: [
    "common",
    "dashboard",
    "products",
    "orders",
    "customers",
    "inventory",
    "billing",
    "email",
    "errors",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
};
