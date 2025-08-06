const Ini = require("ini");
const FS = require("fs").promises;

function def(any, def) {
  if (any === undefined) {
    return def;
  } else {
    return any;
  }
}

function defI(any, def) {
  if (any === undefined) {
    return def;
  } else {
    const v = parseInt(any);
    if (!isNaN(v)) {
      return v;
    } else {
      return def;
    }
  }
}

function defB(any, def) {
  if (any === undefined) {
    return def;
  } else if (any == "true") {
    return true;
  } else if (any == "false") {
    return false;
  } else {
    return def;
  }
}

function defPairI(any, def) {
  if (any === undefined) {
    return def;
  } else if (Array.isArray(any) && any.length == 2) {
    const first = parseInt(any[0]);
    const second = parseInt(any[1]);
    if (!isNaN(first) && !isNaN(second)) return [first, second];
  }
  return def;
}

function defArrI(any, def) {
  if (any === undefined) {
    return def;
  } else if (Array.isArray(any)) {
    const out = [];
    for (const v of any) {
      const vv = parseInt(v);
      if (isNaN(vv)) return def;
      out.push(vv);
    }
    return out;
  } else if (typeof any === "string") {
    const raw = any.split(",").map((s) => parseInt(s.trim()));
    return raw.some(isNaN) ? def : raw;
  } else {
    return def;
  }
}

function defArrN(any, def) {
  if (any === undefined) {
    return def;
  } else if (Array.isArray(any)) {
    const out = [];
    for (const v of any) {
      const vv = parseFloat(v);
      if (isNaN(vv)) return def;
      out.push(vv);
    }
    return out;
  } else if (typeof any === "string") {
    const raw = any.split(",").map((s) => parseFloat(s.trim()));
    return raw.some(isNaN) ? def : raw;
  } else {
    return def;
  }
}

function defArrS(any, def) {
  if (any === undefined) {
    return def;
  } else if (Array.isArray(any)) {
    return any;
  } else if (typeof any === "string") {
    return any.split(",").map((s) => s.trim());
  } else {
    return def;
  }
}

async function parseConfig(defOption, configText) {
  const config = Ini.parse(configText);

  defOption.googleAppId = def(config.google.appId, defOption.googleAppId);
  defOption.googleCount = defI(config.google.count, defOption.googleCount);
  defOption.googleSort = def(config.google.sort, defOption.googleSort);
  defOption.googleMaxLoop = defI(
    config.google.maxLoop,
    defOption.googleMaxLoop,
  );
  defOption.googleEachScrapSize = defI(
    config.google.eachScrapSize,
    defOption.googleEachScrapSize,
  );

  defOption.appleStoreId = defI(config.apple.id, defOption.appleStoreId);
  defOption.appleCount = defI(config.apple.count, defOption.appleCount);
  defOption.appleSort = def(config.apple.sort, defOption.appleSort);

  defOption.pause = defPairI(config.pause, defOption.pause);

  defOption.llmModel = def(config.llm.model, defOption.llmModel);
  defOption.llmSystem = def(config.llm.system, defOption.llmSystem);
  defOption.llmHost = def(config.llm.host, defOption.llmHost);
  defOption.llmShowPrompt = defB(
    config.llm.showPrompt,
    defOption.llmShowPrompt,
  );
  defOption.llmOutput = def(config.llm.output, defOption.llmOutput);

  defOption.thresholdDate = defArrI(
    config.threshold.date,
    defOption.thresholdDate,
  );
  defOption.thresholdText = defI(
    config.threshold.text,
    defOption.thresholdText,
  );
  defOption.thresholdScore = defArrI(
    config.threshold.score,
    defOption.thresholdScore,
  );
  defOption.thresholdScoreWeight = defArrN(
    config.threshold.scoreWeight,
    defOption.thresholdScoreWeight,
  );
  defOption.thresholdLanguage = defArrS(
    config.threshold.language,
    defOption.thresholdLanguage,
  );
  defOption.thresholdAgree = defI(
    config.threshold.agree,
    defOption.thresholdAgree,
  );

  defOption.name = def(config.name, defOption.name);
  defOption.description = def(config.description, "");
  defOption.numberOfPros = defI(config.numberOfPros, defOption.numberOfPros);
  defOption.numberOfCons = defI(config.numberOfCons, defOption.numberOfCons);
  defOption.run = def(config.run, defOption.run);

  return defOption;
}

async function readConfig(defOption, configPath) {
  let text = await FS.readFile(configPath, {
    encoding: "utf-8",
  });
  return await parseConfig(defOption, text);
}

module.exports = {
  read: readConfig,
  parse: parseConfig,
};
