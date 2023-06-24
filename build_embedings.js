const fs = require('fs');
const count = require("openai-gpt-token-counter")


const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

// us code
const dir = `../markdown-chunck-of-the-usa-code/chuncks`;

const index = 'usa-code'

let OUT_COUNT = 0;
if (!fs.existsSync(index)) {
  fs.mkdirSync(index);
}




let taskList = [];

async function buildTaskList() {

  const titles = fs.readdirSync(dir);

  for (const title of titles) { 
    if (title[0] === ".") {
      continue;
    }
    const chunks = fs.readdirSync(`${dir}/${title}`);
    
    for (const chunk of chunks) { 
      if (chunk[0] === ".") { 
        continue;
      }
      taskList.push(`${dir}/${title}/${chunk}`);      
    }
  }

  await run();
}

buildTaskList();

async function run() {
  if (!taskList.length) { 
    return;
  }
  
  let n = 1000;

  let input = [];
  while (n-- && taskList.length) {
    input.push(taskList.pop());
  }
  
  await createIndex(input);
  console.log(`${taskList.length} tasks left`);
  setTimeout(run, 1);
}


async function createIndex(tasks) {
  ++OUT_COUNT;
  if (fs.existsSync(`${index}/${OUT_COUNT}.json`)) {
    return;
  }
  let texts = [];
  for (let task of tasks) {
    let text = fs.readFileSync(task, 'utf8');
    if (text.length > 20000) {
      while (count(text) > 8191) { 
        console.log(count(text));
        text = text.substring(0, text.length - ((count(text) - 8191) * 3 + 10));
      }
    }
   
    texts.push(text);
  }
 
  console.log('ready');
  const response = await getVector(texts)
  console.log('answered');

  let vectors = [];
  for (let i = 0; i < texts.length; ++i) {
    vectors.push({
      text: texts[i],
      file : tasks[i],
      vector: response.data[i].embedding
    });
  }
  
  fs.writeFileSync(`${index}/${OUT_COUNT}.json`, JSON.stringify(vectors), 'utf8');

}
async function getVector(str) {

  const response = await openai.createEmbedding({
    "input": str,
    "model": 'text-embedding-ada-002'
  });
  return response.data;
}

