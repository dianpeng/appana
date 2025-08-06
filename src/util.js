const LanguageDetector = require("languagedetect"); // for language detection
const langdetect = new LanguageDetector();
const msecPerDay = 1000 * (24 * 60 * 60);
const crypto = require("crypto");

function md5Hex(input) {
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sleepSome(option) {
  const pause = option.pause;
  if (pause === undefined) return;
  if (pause.length && pause.length == 2) {
    const start = pause[0];
    const end = pause[1];
    const seconds = Math.floor(Math.random() * end) + start;
    await sleep(seconds * 1000);
  }
  return;
}

class Filter {
  constructor(scoreArray, scoreWeight, totalCount) {
    this._weight =
      scoreWeight !== undefined ? new Array(scoreWeight.length).fill(0) : [];
    this._count = new Array(this._weight.length).fill(0);
    this._score = scoreWeight !== undefined ? scoreArray : [];

    if (scoreArray !== undefined && scoreWeight !== undefined) {
      if (scoreArray.length != scoreWeight.length) {
        throw new Error("mismatched length of score and score weight array");
      }

      // initialize weight
      let curWeight = 0.0;
      let curTotal = 0;
      let idx = 0;

      for (const w of scoreWeight.slice(0, scoreWeight.length - 1)) {
        if (w < 0.0 || w > 1.0) throw new Error(`invalid weight" ${w}`);
        curWeight += w;
        if (curWeight > 1.0) throw new Error(`invalid weight, overflow`);
        const t = Math.floor(w * totalCount);
        this._weight[idx] = t;
        curTotal += t;
        idx++;
      }

      // we have one last
      this._weight[idx] = totalCount - curTotal;
    }

    // used to perform dedup, somehow the scrappy api can return duplicated
    // comments when you scrap a lot
    this._dedup = {};
  }

  _dedupKey(time, review) {
    return md5Hex(review);
  }

  print() {
    console.log(
      "filter] (",
      this._weight.join(";"),
      ")]: ",
      this._count.join(";"),
    );
  }

  // finding the specified score's index from _score array
  _findIdx(score) {
    for (const [i, value] of this._score.entries()) {
      if (value == score) return i;
    }
    return undefined;
  }

  _filterByScoreWeight(score) {
    const idx = this._findIdx(score);
    if (idx === undefined) return true; // unsettle

    const tt = this._count[idx] + 1;
    if (tt >= this._weight[idx]) return false;
    return true;
  }

  _bump(score) {
    const idx = this._findIdx(score);
    if (idx !== undefined) {
      this._count[idx] = this._count[idx] + 1;
    }
  }

  _isDup(time, review) {
    const key = this._dedupKey(time, review);
    if (this._dedup[key] !== undefined) return true;
    this._dedup[key] = true;
    return false;
  }

  // filter function
  filter(
    option, // input option
    score, // score
    agree, // thumsup, apple store does not have, specified as undefined
    time, // time in string
    review, // review itself
  ) {
    if (this._isDup(time, review)) return false;

    // [0] check the score by weight if applicable
    if (!this._filterByScoreWeight(score)) {
      return false;
    }

    // [1] if the comment is too far away from now on, just ignore it
    const commentDate = Date.parse(time);
    const dateDiff = (Date.now() - commentDate) / msecPerDay;

    if (
      !(
        dateDiff >= option.thresholdDate[0] &&
        dateDiff <= option.thresholdDate[1]
      )
    ) {
      return false;
    }

    // [2] check comment length
    if (review.length < option.thresholdText) {
      return false;
    }

    // [3] if language is not in english, just bypass it
    const out = langdetect.detect(review);
    let idx = 0;
    for (const lang of option.thresholdLanguage) {
      if (out.length <= idx) {
        return false;
      }
      if (out[idx][0] != lang) {
        return false;
      }
      idx++;
    }

    // [4] if agree score matches or not
    if (agree !== undefined) {
      if (agree < option.thresholdAgree) {
        return false;
      }
    }

    // [5] score/rating
    if (option.thresholdScore !== undefined) {
      if (!option.thresholdScore.includes(Math.ceil(score))) {
        return false;
      }
    }

    this._bump(score);
    return true;
  }
}

module.exports = {
  Filter: Filter,
  sleepSome: sleepSome,
};
