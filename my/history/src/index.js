const express = require("express");
const mongodb = require("mongodb");
const bodyParser = require("body-parser");
const amqp = require("amqplib");


if (!process.env.DBHOST) {
    throw new Error("No DBHOST");
}
if (!process.env.DBNAME) {
    throw new Error("No DBNAME");
}

if (!process.env.RABBIT) {
    throw new Error("No RABBIT");
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

function connectDb() {
    return mongodb.MongoClient.connect(DBHOST).then(client => {
        return client.db(DBNAME);
    });
}

function connectRabbit() {
    console.log(`Connecting Rabbit at ${RABBIT}`);
    return amqp.connect(RABBIT).then(messagingConnection => {
        console.log("Connected");
        return messagingConnection.createChannel();
    });

}

//
//
//
function setupHandlers(app, db, messageChannel) {
    const videosCollection = db.collection("videos");

    function consumeViewedMessage(msg) {
        console.log("Received viewed msg");

        const parsedMsg = JSON.parse(msg.content.toString());

        return videosCollection.insertOne({videoPath:parsedMsg.videoPath})
        .then(()=>{
            console.log("Ack");
            messageChannel.ack(msg);
        });

    }

    return messageChannel.assertExchange("viewed","fanout")
    .then(()=>{
        return messageChannel.assertQueue("",{exclusive:true});
    }).then(response=>{
        const queueName = response.queue;
        console.log(`Created Q ${queueName} and binded`);
        return messageChannel.bindQueue(queueName, "viewed","")
        .then(()=>{
            return messageChannel.consume(queueName, consumeViewedMessage);
        });
    });


    /*
    app.post("/viewed", (req,res) => {
        const videoPath = req.body.videoPath;
        videosCollection.insertOne({videoPath:videoPath})
        .then(()=>{
            console.log("Added video $videoPath{} to history");
            res.sendStatus(200);
        })
        .catch(err=>{
            console.error("Error adding ${videoPath}");
            console.error(err && err.stack || err );
            res.sendStatus(500);
        });        
    });

    app.post("/history", (req,res) => {
        const skip = parseInt(req.query.skip);
        const limit = parseInt(req.query.limit);
        videosCollection.find()
        .skip(skip)
        .limit(limit)
        .toArray()
        .then(documents=>{
            res.json({history: documents});
        })
        .catch(err=>{
            console.error("Error retrieving history.");
            console.error(err && err.stack || err);
            res.sendStatus(500);
        });
    });
    */
}

function startHttpServer(db, messageChannel) {
    return new Promise(resolve => {
        const app = express();
        app.use(bodyParser.json());
        setupHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;

        app.listen(port, () => {
            resolve();
        });
    });
}

function main() {
    console.log("Hello World from Eddy");
    return connectDb(DBHOST).then(db => {
        return connectRabbit().then(messageChannel=>{
            return startHttpServer(db,messageChannel);
        });
    });   
}


main().then(() => console.log("MS online"))
    .catch(err => {
        console.error("MS failed to start");
        console.error(err && err.stack || err);
    });



