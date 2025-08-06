// this small ndoe.js application will scratch all the google play's review for
// a certain application given its appid and generate a prompt to render for
// LLM to do summarization. The reason for this is to make the whole thing
// easier for us to identify what actually needed by customer or not

const google = require("./google.js");
const apple = require("./apple.js");
const prompt = require("./prompt.js");
const ollama = require("./ollama.js");
const config = require("./conf.js");

let defOption = {
  appleStoreId: undefined,
  appleCount: 30, // how many comments from apple
  appleSort: "recent", // strategy of apple

  googleSort: "recent", // strategy of google
  googleCount: 70, // how many comments from google
  googleAppId: undefined,
  googleMaxLoop: 100,
  googleEachScrapSize: 50,

  // llm
  llmModel: undefined,
  llmSystem: undefined,
  llmHeaders: undefined,
  llmHost: undefined,
  llmShowPrompt: true,
  llmOutput: "markdown",

  // threshold, used by filter
  thresholdDate: [0, 180], // half year
  thresholdText: 40, // less than 40 chars will be considered as irrelevant
  thresholdScore: [1, 4, 5], // specify a list of score that will be selected
  thresholdScoreWeight: undefined, // not specified
  thresholdLanguage: ["english"], // checking whether lang detect fits into list
  thresholdAgree: 0, // thumsup >= # will be considered

  // prompt related
  name: undefined,
  appDescription: undefined,
  numberOfPros: 3,
  numberOfCons: 3,
  pause: undefined, // allowing simple pause

  // what to run
  run: "summarize",
};

function cloneOption() {
  return JSON.parse(JSON.stringify(defOption));
}

function checkOptionLLM(option) {
  if (option.llmHost === undefined) throw new Error("llm.host is undefined");
  if (option.llmModel === undefined) throw new Error("llm.model is undefined");
  return option;
}

function checkOptionCommon(option) {
  if (option.googleCount > 0 && option.googleAppId === undefined)
    throw new Error("google.appId is undefined");
  if (option.appleCount > 0 && option.appleStoreId === undefined)
    throw new Error("apple.storeId is undefined");

  if (option.name === undefined) throw new Error("name is undefined");
  if (option.description === undefined)
    throw new Error("description is undefined");

  if (
    option.thresholdScore !== undefined &&
    option.thresholdScoreWeight !== undefined
  ) {
    if (option.thresholdScore.length != option.thresholdScoreWeight.length) {
      throw new Error("score and score weight array length mismatched");
    }
    let curW = 0.0;
    for (const w of option.thresholdScoreWeight) {
      if (w < 0.0 || w > 1.0) throw new Error("invalid score weight");
      curW += w;
      if (curW > 1.0) throw new Error("total score weight overflow");
    }
  }

  return option;
}

async function doPrompt(option) {
  const googleComments = await google.generate(option);
  const appleComments = await apple.generate(option);

  const allComments = [];
  allComments.push(...googleComments);
  allComments.push(...appleComments);

  return await prompt.prompt(option, allComments);
}

async function doSummarize(option) {
  checkOptionLLM(option);
  const prompt = await doPrompt(option);
  const model = new ollama(
    option.llmModel,
    option.llmSystem,
    option.llmHost,
    option.llmHeaders,
  );
  const output = await model.complete(prompt);

  if (option.llmShowPrompt) {
    return (
      prompt +
      "\n--------------------------------------------------------\n" +
      output
    );
  } else {
    return output;
  }
}

async function main(configPath) {
  const option = checkOptionCommon(
    await config.read(cloneOption(), configPath),
  );

  switch (option.run) {
    default:
      throw new Error(`unknown run mode: ${option.run}`);
    case "prompt":
      return await doPrompt(option);
    case "summarize":
      return await doSummarize(option);
  }
}

module.exports = {
  prompt: doPrompt,
  main: main,
};
