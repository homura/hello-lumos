const marpKrokiPlugin = require("./plugins/kroki-plugin");

module.exports = {
  engine: ({ marp }) => marp.use(marpKrokiPlugin),
};
