const express=require("express");
const fs = require("fs");

const http = require("http");
const amqp = require("amqplib");

if (!process.env.RABBIT) {
    throw new Error("Please specify the name of the RabbitMQ host using environment variable RABBIT");
}

const RABBIT = process.env.RABBIT;

function connectRabbit() {
    console.log(`Connecting to $(RABBIT)`);
    return amqp.connect(RABBIT)
    .then(connection=>{
        console.log("Connected to RABBIY");
        return connection.createChannel()
        .then(messageChannel=>{
            return messageChannel.assertExchange("viewed","fanout")
            .then(()=>{
                return messageChannel;
            });
        });
    });
}

function sendViewedMessage(messageChannel, videoPath) {
    console.log("Publishing");
    const msg = {videoPath:videoPath};
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish("viewed","", Buffer.from(jsonMsg));
}

/*
function sendViewedMessage(videoPath) {
    const postOptions = {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        }
    };

    const requestBody = {
        videoPath: videoPath
    };

    const req = http.request("http://history/viewed", postOptions);

    req.on("close",()=>{
        console.log("Sent");
    });

    req.on("error",(err)=>{
        console.error("Error send");
        console.error(err && err.stack || err);        
    });

    req.write(JSON.stringify(requestBody));
    req.end();
}
*/

//
//
//
function setupHandlers(app, messageChannel) {
    app.get("/video",(req,res) => {

        console.log(req.url);

        const videoPath = "./video/SampleVideo_1280x720_1mb.mp4";

        fs.stat(videoPath, (err,  stats) => {

            if (err) {
                console.error("An error occured");
                console.error(err && err.stack || err);
                res.sendStatus(500);
                return;
            }
            res.writeHead(200, {
                "Content-Length":stats.size,
                "Content-Type":"video/mp4"
            });

            fs.createReadStream(videoPath).pipe(res);

            //sendViewedMessage(videoPath);
            sendViewedMessage(messageChannel, videoPath);


        });

    });
}


function startHttpServer(messageChannel) {
    return new Promise((resolve) => {
        const app = express();
        setupHandlers(app,messageChannel);
        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

function main(){
    return connectRabbit().then(messageChannel=> {        
        return startHttpServer(messageChannel);
    })
}

main().then(()=> console.log("MS Online. Hello")).catch(err=>
    {
        console.error("MS failed to start");
        console.error(err && err.stack || err); 
    });

