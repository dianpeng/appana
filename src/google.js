const gplay = require("google-play-scraper").default; // this is workaround
const util = require("./util.js");

function sortStrategy(option) {
  if (option.googleSort == "helpful") {
    return gplay.sort.HELPFULNESS;
  } else if (option.googleSort == "recent") {
    return gplay.sort.NEWEST;
  } else {
    throw new Error(`unknown google sort strategy: ${option.googleSort}`);
  }
}

function convert(comment) {
  return {
    score: comment.score,
    agree: comment.thumbsUp,
    date: comment.date,
    review: comment.text,
  };
}

// Used to scratch all the needed review one by one, notes it will sleep sometime
// to bypass detection of bot from google side
async function getAllComments(option) {
  let out = [];
  if (option.googleCount == 0) return out;

  const sort = sortStrategy(option);
  let filterObject = new util.Filter(
    option.thresholdScore,
    option.thresholdScoreWeight,
    option.googleCount,
  );

  let filter = function (option, comment) {
    return filterObject.filter(
      option,
      comment.score,
      comment.thumbsUp,
      comment.date,
      comment.text,
    );
  };

  const doFilter = function (all) {
    for (const comment of all) {
      if (filter(option, comment)) {
        out.push(convert(comment));
      }
    }
  };

  let loopCount = 1;

  let log = function () {
    filterObject.print();
    console.log("google play(", loopCount, ")]: collected ", out.length);
  };

  // the very first revies
  let data = await gplay.reviews({
    appId: option.googleAppId,
    sort: sort,
    num: option.googleEachScrapSize,
    paginate: true,
    nextPaginationToken: null,
  });

  doFilter(data["data"]); // filter very first time
  let token = data["nextPaginationToken"]; // get next token
  log();

  while (out.length < option.googleCount) {
    data = await gplay.reviews({
      appId: option.googleAppId,
      sort: sort,
      num: option.googleEachScrapSize,
      paginate: true,
      nextPaginationToken: token,
    });
    if (data.data.length == 0) break; // do not have enough
    doFilter(data["data"]); // try to filter data
    await util.sleepSome(option); // sleep little
    token = data["nextPaginationToken"]; // get next token
    loopCount++;
    log();

    if (loopCount >= option.googleMaxLoop) break;
  }

  if (out.length > option.googleCount) {
    return out.slice(0, option.googleCount);
  } else {
    return out;
  }
}

module.exports = {
  generate: getAllComments,
};
