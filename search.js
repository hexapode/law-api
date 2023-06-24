const fs = require('fs');


const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);


let index = [];

const indexDir = '../usa-code';

const indexFiles = fs.readdirSync(indexDir);


let start = new Date().getTime();
for (let file of indexFiles) {
  if (file[0] === '.') {
    continue;
  }
  console.log(`loading ${file}`);
  let data = fs.readFileSync(`${indexDir}/${file}`, 'utf8');

  data = JSON.parse(data);
  for (let d of data) { 
    if (d.text.trim().length) {
      index.push(d);
    }
  }
 

}

let end = new Date().getTime();


console.log(`loaded ${index.length} vectors loaded`);
console.log(`in ${end - start} ms`);


async function search(n, query) {
  let start = new Date();
  let vector = await getVector(query);

  let best = [];

  for (let v of index) {
    let s = cosineSimilarity(vector, v.vector);

    if (best.length < n) {
      best.push({
        s: s,
        t: v.text
      });
    }
    else {
      for (let i = 0; i < best.length; i++) { 
        if (best[i].s < s) {
          best[i] = {
            s: s,
            t: v.text
          };
          break;
        }
      }
    }
  }
  let end = new Date();
  console.log("Time:", end.getTime() - start.getTime());
  console.log(best);
  return best;
}

function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let v1Magnitude = 0;
  let v2Magnitude = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    v1Magnitude += v1[i] * v1[i];
    v2Magnitude += v2[i] * v2[i];
  }

  v1Magnitude = Math.sqrt(v1Magnitude);
  v2Magnitude = Math.sqrt(v2Magnitude);

  return dotProduct / (v1Magnitude * v2Magnitude);
}

async function getVector(str) {

  const response = await openai.createEmbedding({
    "input": str,
    "model": 'text-embedding-ada-002'
  });
  return response.data.data[0].embedding;
}

module.exports = search;