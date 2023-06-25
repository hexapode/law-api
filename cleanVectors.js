const fs = require('fs');
const { setFlagsFromString } = require('v8');

const target = '../LawEmbedings/usa-code.index';

let files = fs.readdirSync(target)

if (!fs.existsSync(`${target}.vector`)) { 
  fs.mkdirSync(`${target}.vector`);
}

if (!fs.existsSync(`${target}.text`)) { 
  fs.mkdirSync(`${target}.text`);
}

for (let file of files) {
  if (file[0] === '.') { 
    continue;
  }

  let data = fs.readFileSync(`${target}/${file}`, 'utf8');

  data = JSON.parse(data);
  let vindex = [];
  let tindex = [];
  let i = 0;
  let filename = parseInt(file.replace('.json', ''));
  for (let item of data) {
    if (!item.text.trim()) {
      continue;
    }
    vindex = vindex.concat(item.vector);

    tindex.push(item.text);
  }

  var wstream = fs.createWriteStream(`${target}.vector/${file}`);

  var dataArr = new Float32Array(vindex);
  var buffer = new Buffer(data.length*4);
  for(var i = 0; i < data.length; i++){
      //write the float in Little-Endian and move the offset
      buffer.writeFloatLE(data[i], i*4);
  }

  wstream.write(buffer);
  wstream.end();

  fs.writeFileSync(`${target}.text/${filename}`, JSON.stringify(tindex), 'utf8');
}


//prepare the length of the buffer to 4 bytes per float


