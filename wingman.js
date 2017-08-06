'use strict'
const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const snoowrap = require('snoowrap');
const app = express();

const DEFAULT = 5000;
const OK = 200;
const reddit = new snoowrap({
  clientId: 'c74Q1dKouiMGNA',
  clientSecret: 'M2UJaQvXhctXqC_7ItNLOxTpyCQ',
  refreshToken: '33133423-kXmv7O67gfM0Ce8gp6jIbjV6Hk4',
  userAgent: '9A25PnHxZY7nWQ'
});
const subreddits = [
  'ShittyPickupLines',
  'PickupLines',
  'Tinder'
];

app.set('port', process.env.PORT || DEFAULT);
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sms", function (req, res) {
  const twiml = new MessagingResponse();
  const reqBody = req.body.Body.trim().toLowerCase();

  if (reqBody === 'shitty') {
    console.log('POST: SHITTY');
    const curSub = derive(subreddits);

    console.log('GETTING SUB: ' + curSub);
    reddit.getSubreddit(curSub)
      .getTop({ time: 'all' })
      .then((submission) => {
        const line = derive(submission);

        console.log(line);
        const mes = line.selftext ?
          `${line.title}\n\n${line.selftext}` :
          `${line.title}`;

        if (line.url.includes('imgur') || line.url.includes('reddituploads')) {
          twiml.message.media(line.url);
        }
        
        twiml.message.body(mes);
        console.log(mes);
        res.writeHead(OK, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        console.log('RESP SENT');
      });
  } else if (reqBody === 'help') {
    twiml.message('helping u out');
    res.end(twiml.toString());
  } else {
    twiml.message('girls name');
    res.end(twiml.toString());
  }
  console.log('RES END\n');
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

// returns a random object from the arra
function derive(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}