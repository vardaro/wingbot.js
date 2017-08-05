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
  'PickupLines'
];

app.set('port', process.env.PORT || DEFAULT);
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sms", function (req, res) {
  const twiml = new MessagingResponse();

  if (req.body.Body === 'shitty') {
    const curSub = subreddits[getRandNum(subreddits.length)];

    console.log(curSub);
    reddit.getSubreddit(curSub)
      .getTop({ time: 'all' })
      .then((submission) => {
        console.log(submission.length);
        const line = submission[getRandNum(submission.length)];
        
        console.log(line);
        const mes = line.selftext ?
          `${line.title}\n\n${line.selftext}` :
          `${line.title}`;

        console.log(mes);
      });
  } else if (req.body.Body === 'help') {
    twiml.message('helping u out');
  } else {
    twiml.message('girls name');
  }
  res.writeHead(OK, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

// returns random number from 0 to range
function getRandNum(range) {
  return Math.floor(Math.random() * range);
}