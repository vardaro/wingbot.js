'use strict'
const express = require('express');
const twitter = require('twitter');
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
const client = new twitter({
  consumer_key: 'Wl4iMW5NBRNqZJO8MYRtlzHRn',
  consumer_secret: 'mPLoLpdc6XPwfk7spqomN3UxrOlGAfkAXpl6omf5AddztN9x69',
  access_token_key: '2610777535-8EYut0cv8uxi6CI5lctqhgqYGgHJIISrKa5eEpH',
  access_token_secret: '0OS1TkU3gnyqsEN2m1WtRgZPmo8zsuUVjNC9WkEyzRjzF'
});
const statusParams = {
  screen_name: 'pickupIines',
  trim_user: true,
  count: 50,
  exclude_replies: true,
  include_rts: false
}
const tweeters = [
  'pickupIines',
  'pickuplines',
  'smplepickupInes'
]
const subreddits = [
  'ShittyPickupLines',
  'PickupLines'
];
const platforms = [
  'Reddit',
  'Twitter'
];

app.set('port', process.env.PORT || DEFAULT);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/src'));

app.post("/sms", function (req, res) {
  const twiml = new MessagingResponse();
  const reqBody = req.body.Body.trim().toLowerCase();

  if (reqBody === 'shitty' || reqBody === 'help') {
    console.log('POST: SHITTY');
    const curPlat = cut(platforms);

    if (curPlat === 'Reddit') {
      console.log('REDDIT');
      const curSub = cut(subreddits);

      console.log('GETTING SUB: ' + curSub);
      reddit.getSubreddit(curSub)
        .getTop({ time: 'all' })
        .then((submissions) => {
          const line = cut(submissions);

          console.log(line);
          const message = twiml.message();
          const mesBody = line.selftext ?
            `${line.title}\n\n${line.selftext}` :
            `${line.title}`;

          if (line.url.includes('imgur') ||
            line.url.includes('reddituploads') ||
            line.url.includes('i.redd.it')) {
            message.media(line.url);
            console.log('IMG: ' + line.url);
          }

          message.body(mesBody);
          console.log(mesBody);
          res.writeHead(OK, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
          console.log('RESP SENT');
        });
    } else if (curPlat === 'Twitter') {
      console.log('TWITTER');
      const curUser = cut(tweeters);
      console.log('USER: ' + curUser);
      const request = buildReq(curUser);
      client.get('statuses/user_timeline', request, (err, tweet, resp) => {
        if (err) {
          console.log('WTF');

        };
        const curTweet = cut(tweet);
        twiml.message(curTweet.text);
        res.writeHead(OK, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        console.log('RESP SENT');
      })
    }
  } else {
    twiml.message('girls name');
    res.end(twiml.toString());
  }
  console.log('RES END\n');
});

app.get('*', function (req, res) {
  res.sendfile(__dirname + '/src/index.html');
});
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

// returns a random object from the arra
function cut(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// returns an object of twitter api params 
// with a dynamic screen_name
function buildReq(tweeter) {
  return {
    screen_name: tweeter,
    trim_user: true,
    count: 100,
    exclude_replies: true,
    include_rts: false
  }
} 