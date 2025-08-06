async function genOne(idx, c) {
  if (c.agree !== undefined) {
    return JSON.stringify({
      rating: c.score,
      review: c.review,
      thumsup: c.agree,
    });
  } else {
    return JSON.stringify({
      rating: c.score,
      review: c.review,
    });
  }
}

async function genAll(allC) {
  const buf = [];
  let idx = 0;
  for (const c of allC) {
    idx++;
    buf.push(await genOne(idx, c));
  }
  return buf.join("\n");
}

// prompt will be organized as following
//
// [1] A brief task description
//
// [2] customer feeded application description
//
// [3] objection
//
// [4] all the reviews
//
// ----------------------------------------------------------------------------

// system prompt
async function system(option) {
  return;
  `
Role:

You are a Senior Product Manager at a leading app development company. Your task is to review customer feedback to help guide your team’s next product updates.

`;
}

async function genPrompt(option, tt, reviewGen) {
  const part1 = `

Instructions:

We have launched our app whose ${option.name} in both Apple App Store and Google Play.  ${option.description}. I will provide you a list of customer reviews for our app collected from real users. Each review will contain:

rating (integer, 1–5)
Optional thumbsup (number of users agreeing, may be missing)
review (the user's written feedback)

Please carefully analyze the customer feedback and provide the following for your team meeting:

MUST give **${option.numberOfPros}** key pros: What do customers most appreciate about the app?
MUST give **${option.numberOfCons}** key cons: What are the most critical or frequent complaints from users?

Make sure your pros and cons are concise, insightful, and based on common patterns or reviews with high thumbsup counts.
Present your findings as two bullet lists labeled "Pros" and "Cons." Be professional, direct, and actionable. Lastly, make sure you generate output in format **${option.llmOutput}**.

Here is a list of ${tt} reviews:

`;

  const part2 = `

Your summarization is:

`;

  return part1 + reviewGen + part2;
}

async function all(option, allComments) {
  if (allComments.length == 0) throw new Error("no comments been scrapped!");
  return await genPrompt(option, allComments.length, await genAll(allComments));
}

module.exports = {
  prompt: all,
  system: system,
};
