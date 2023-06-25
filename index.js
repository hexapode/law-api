// load index
const fs = require('fs');
const https = require('https');
const http = require('http');

const search = require('./search.js');

const bodyParser = require('body-parser');

const express = require('express');
const app = express();
app.use(bodyParser.json());


app.use(express.static('public'));

app.get('/ask/:n/:query', async (req, res) => {
 
  let result = await search( req.params.n, "usa_code", req.params.query);
  res.send(result);
});

app.get('/ask/:n/:name/:query', async (req, res) => {
 
  let result = await search( req.params.n, req.params.name, req.params.query);
  res.send(result);
});

app.post('/query', async (req, res) => {
  let n = req.body.n;
  let query = req.body.query;
  let name = req.params.legislation || "usa_code";

  if (!query || !n) { 
    res.json({
      "error" : "Invalid parameter, expecting n and query",
      "received" : req.body
    });
    return;
  }
  let result = await search(n, name,query);
  res.send(result);
});


if (fs.existsSync('../key.pem')) { 
  const httpsServer = https.createServer({
    key: fs.readFileSync("../key.pem"),
    cert: fs.readFileSync("../cert.pem"),
  },
  app);
  
  
  httpsServer.listen(3001, () => {
    console.log('https server listening on port 3001');
  });

}


const httpServer = http.createServer(app);

httpServer.listen(3000, () => {
  console.log('http server listening on port 3000');
});



