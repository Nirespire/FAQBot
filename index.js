const NLP = require('natural');
const BotKit = require('botkit');
const fs = require('fs');

// Load our environment variables from the .env file
require('dotenv').config();

// Create a new classifier to train
const classifier = new NLP.LogisticRegressionClassifier();

// What are the types of chats we want to consider
// In this case, we only care about chats that come directly to the bot
const scopes = [
    'direct_mention',
    'direct_message',
    'mention'
];

// Get our Slack API token from the environment
const token = process.env.SLACK_API_TOKEN;

// Create a chatbot template that can be instantiated using Botkit
const Bot = BotKit.slackbot({
    debug: false,
    storage: undefined
});

function parseTrainingData(filePath) {
    const trainingFile = fs.readFileSync('./trainingData.json');
    return JSON.parse(trainingFile);
}

function train(classifier, label, phrases) {
    console.log('Teaching set', label, phrases);
    phrases.forEach((phrase) => {
        console.log(`Teaching single ${label}: ${phrase}`);
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
    console.log('guesses', guesses);
    const guess = guesses.reduce((x, y) => x && x.value > y.value ? x : y);
    return {
        probabilities: guesses,
        guess: guess.value > (0.7) ? guess.label : null
    };
}



// Function to handle an incoming message
function handleMessage(speech, message) {
    const interpretation = interpret(message.text);
    console.log('InternChatBot heard: ', message.text);
    console.log('InternChatBot interpretation: ', interpretation);

    if (interpretation.guess && trainingData[interpretation.guess]) {
        console.log('Found response');
        speech.reply(message, trainingData[interpretation.guess].answer);
    } else {
        console.log('Couldn\'t match phrase')
        speech.reply(message, 'Sorry, I\'m not sure what you mean');
    }
}

// Load our training data
const trainingData = parseTrainingData("./trainingData.json");

var i = 0;
Object.keys(trainingData).forEach((element, key) => {
    train(classifier, element, trainingData[element].questions);
    i++;
    if (i === Object.keys(trainingData).length) {
        createClassifier(classifier);
    }
});



// Configure the bot
// .* means match any message test
// The scopes we pass determine which kinds of messages we consider (in this case only direct message or mentions)
// handleMessage is the function that will run when the bot matches a message based on the text and scope criteria
Bot.hears('.*', scopes, handleMessage);

// Instantiate a chatbot using the previously defined template and API token
// Open a connection to Slack's real time API to start messaging
Bot.spawn({
    token: token
}).startRTM();


