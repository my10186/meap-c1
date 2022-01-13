const express = require("express");

//
//
//
function setupHandlers(app) {
    //
}

function startHttpServer() {
    return new Promise(resolve => {
        const app = express();
        setupHandlers(app);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;

        app.listen(port, () => {
            resolve();
        });
    });
}

function main() {
    console.log("Hello World from Eddy");
    return startHttpServer();
}


main().then(() => console.log("MS online"))
    .catch(err => {
        console.error("MS failed to start");
        console.error(err && err.stack || err);
    });



