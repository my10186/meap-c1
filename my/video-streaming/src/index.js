const express=require("express");
const fs = require("fs");

//
//
//
function setupHandlers(app) {
    app.get("/video",(req,res) => {

        const videoPath = "./videos/SampleVideo_1280x720_1mb.mp4";

        fs.stat(videoPath, (err,  stats) => {

            if (err) {
                console.error("An error occured");
                res.sendStatus(500);
                return;
            }

            res.writeHead(200, {
                "Content-Length":stats.size,
                "Content-Type":"video/mp4"
            });

            fs.createReadStream(videoPath).pipe(res);

        });

    });
}


function startHttpServer() {
    return new Promise((resolve,reject) => {
        const app = express();
        setupHandlers(app);
        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

function main(){
    return startHttpServer();
}

main().then(()=> console.log("MS Online. Hello")).catch(err=>
    {
        console.error("MS failed to start");
        console.error(err && err.stack || err); 
    });

