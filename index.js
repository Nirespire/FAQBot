const NLP = require('natural');
const sentiment = require('sentiment');
const BotKit = require('botkit');
require('dotenv').config();

const classifier = new NLP.LogisticRegressionClassifier();
const minConfidence = 0.7;

const scopes = [
    'direct_mention',
    'direct_message',
    'mention'
];
const token = process.env.SLACK_API_TOKEN;

const Bot = BotKit.slackbot({
    debug: true,
    storage: undefined
});

function train(labels, phrases) {
    console.log('Teaching', label, phrases);
    phrases.forEach((phrase) => {
      console.log(`Teaching ${label}: ${phrase}`);
      classifier.addDocument(phrase.toLowerCase(), label);
    });
}

function createClassifier() {
    classifier.train();

    const filePath = './classifier.json';
    
    classifier.save(filePath, (err, classifier) => {
      if (err) {
        console.error(err);
      }
      console.log('Created a Classifier file in ', filePath);
    });
}

function interpret(phrase) {
    console.log('interpret', phrase);
    const guesses = classifier.getClassifications(phrase.toLowerCase());
    console.log('guesses', guesses, toMaxValue);
    const guess = guesses.reduce(toMaxValue);
    console.log('vals', guess.value, this.minConfidence, guess.label);
    return {
      probabilities: guesses,
      guess: guess.value > (minConfidence) ? guess.label : null
    };
}

function toMaxValue(x, y) {
    return x && x.value > y.value ? x : y;
}

function handleMessage(speech, message) {
    console.log(speech, message);
    speech.reply(message, "got it");
}

Bot.hears('.*', scopes, handleMessage);


Bot.spawn({
    token: token
}).startRTM();


