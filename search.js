const fs = require('fs');

const logFile = '../log.txt'

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);


let index = {

};

const indexDir = '../LawEmbedings';

// read all indexes

async function init() {
  let indexesDir = fs.readdirSync(indexDir);

  for (let indexDir of indexesDir) {
    if (indexDir[0] === '.') { 
      continue;
    }

      await buildIndex(indexDir);
  }
}
init();

function buildIndex(indexName) {
  let info = JSON.parse(fs.readFileSync(`${indexDir}/${indexName}/package.json`, 'utf8'));

  const indexFiles = fs.readdirSync(`${indexDir}/${indexName}`);
  let name  = info.name;

  index[name] = [];
  let start = new Date().getTime();
  for (let file of indexFiles) {
    if (file.indexOf('package') != -1) {
      continue;
    }
    if (file[0] === '.') {
      continue;
    }
    console.log(`loading ${file}`);
    let data = fs.readFileSync(`${indexDir}/${indexName}/${file}`, 'utf8');

    data = JSON.parse(data);



    for (let d of data) { 
      if (d.text.trim().length) {
        index[name].push(d);
      }
    }

  }

  let end = new Date().getTime();


  console.log(`loaded ${index.length} vectors loaded`);
  console.log(`in ${end - start} ms`);
}






async function search(n, name, query) {
  if (!index[name]) {
    console.log(index);
    name = "usa_code"
  }

  let vector = await getVector(query);
  let best = [];
  let start = new Date().getTime();

  for (let v of index[name]) {
    if (!v.vector) {
      console.log(v);
      continue;
    }
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
  let end = new Date().getTime();
  console.log(best);
  console.log("Time:", end - start);
  
  fs.appendFile(logFile, `---
date: ${new Date().getTime}
compute: ${ end - start}
n: ${n}
index: ${name}
query: ${query}`, function (err) { }
);
  return best;
}

function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let v1Magnitude = 0;
  let v2Magnitude = 0;

  for (let i = 0; i < v1.length && i <v2.length; i++) {
    dotProduct += v1[i] * v2[i];
    v1Magnitude += v1[i] * v1[i];
    v2Magnitude += v2[i] * v2[i];
  }

  // skip sqrt
  v1Magnitude = Math.sqrt(v1Magnitude);
  v2Magnitude = Math.sqrt(v2Magnitude);

  return dotProduct / (v1Magnitude * v2Magnitude);
}

async function getVector(str) {
  try {
    const response = await openai.createEmbedding({
      "input": str,
      "model": 'text-embedding-ada-002'
    });

    return response.data.data[0].embedding;
  } catch (e) {
    return [];
  }




}

module.exports = search;