const appst = require("app-store-scraper"); // applestore
const util = require("./util.js"); // util
const maxPage = 10; // apple will ONLY allow 10 pages at most and 500 comments

function sortStrategy(option) {
  if (option.appleSort == "recent") {
    return appst.sort.RECENT;
  } else if (option.appleSort == "helpful") {
    return appst.sort.HELPFUL;
  } else {
    throw new Error(`apple store sort strategy is unknown: ${x}`);
  }
}

// Used to scratch all the needed review one by one, notes it will sleep
// sometime to bypass detection of bot from google side
async function getAllComments(option) {
  let out = [];
  if (option.appleCount == 0) return out;

  const sort = sortStrategy(option);

  let filterObject = new util.Filter(
    option.thresholdScore,
    option.thresholdScoreWeight,
    option.appleCount,
  );

  // filter function to decide whether the comment is of our usage or not
  let filter = function (option, comment) {
    return filterObject.filter(
      option,
      comment.score, // 1-5 stars
      undefined, // no thumbsup in apple store
      comment.updated, // time string
      comment.text, // review
    );
  };

  const doFilter = function (all) {
    const o = [];
    for (const comment of all) {
      if (filter(option, comment)) {
        o.push({
          score: comment.score,
          agree: undefined,
          date: comment.updated,
          review: comment.text,
        });
      }
    }
    return o;
  };

  let log = function (loopC) {
    filterObject.print();
    console.log("apple store(", loopC, ")]: collected ", out.length);
  };

  // the very first revies
  for (let i = 0; i < maxPage; i++) {
    let data = await appst.reviews({
      id: option.appleStoreId,
      sort: sort,
      page: i,
    });
    if (data.length == 0) break;
    out.push(...doFilter(data));
    if (out.length >= option.appleCount) break;
    await util.sleepSome(option); // sleep little bit
    log(i + 1);
  }

  if (out.length > option.appleCount) {
    return out.slice(0, option.appleCount);
  } else {
    return out;
  }
}

module.exports = {
  generate: getAllComments,
};
