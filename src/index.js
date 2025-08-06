const yargs = require("yargs");
const app = require("./app.js");

const argv = yargs
  .option("config", {
    alias: "c",
    describe: "Path to the configuration file",
    type: "string",
    demandOption: true, // this makes it mandatory
  })
  .help().argv;

// checking the acloset result
app.main(argv.config).then(console.log).catch(console.log);
