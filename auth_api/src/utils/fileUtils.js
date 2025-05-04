const fs = require("fs-extra");
const util = require("util");

const readFile = util.promisify(fs.readFile);

module.exports = { readFile };