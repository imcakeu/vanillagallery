// Libraries
const http = require("http");
const fs = require("fs");
const path = require("path");

function sendImage(imagePath, contentType, res) {
    fs.readFile(imagePath, (err, data) => {
        if (err) {
            console.error(err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(data);
        }
    });
}

const port = 8080;
const server = http.createServer();
server.on("request", (req, res) => {
    switch(req.url){
        case "/images":
            res.end(fs.readFileSync("./images.html", "utf-8"));
            break;
          
        case "/image1":
            res.end(fs.readFileSync("./image1.html", "utf-8"));
            break;
        
        case "/image2":
            res.end(fs.readFileSync("./image2.html", "utf-8"));
            break;
   
        case "/image3":
            res.end(fs.readFileSync("./image3.html", "utf-8"));
            break;
               
        case "/image4":
            res.end(fs.readFileSync("./image4.html", "utf-8"));
            break;
     
        case "/image5":
            res.end(fs.readFileSync("./image5.html", "utf-8"));
            break;

        case "/imgfile1":
            sendImage("./images/image1.jpg", "image/jpeg", res);
            break;

        case "/imgfile2":
            sendImage("./images/image2.jpg", "image/jpeg", res);
            break;

        case "/imgfile3":
            sendImage("./images/image3.jpg", "image/jpeg", res);
            break;

        case "/imgfile4":
            sendImage("./images/image4.jpg", "image/jpeg", res);
            break;

        case "/imgfile5":
            sendImage("./images/image5.jpg", "image/jpeg", res);
            break;

        case "/imgfile1_small":
            sendImage("./images/image1_small.jpg", "image/jpeg", res);
            break;
    
        case "/imgfile2_small":
            sendImage("./images/image2_small.jpg", "image/jpeg", res);
            break;
    
        case "/imgfile3_small":
            sendImage("./images/image3_small.jpg", "image/jpeg", res);
            break;
    
        case "/imgfile4_small":
            sendImage("./images/image4_small.jpg", "image/jpeg", res);
            break;
    
        case "/imgfile5_small":
            sendImage("./images/image5_small.jpg", "image/jpeg", res);
            break;

        default:
            res.end(fs.readFileSync("./index.html", "utf-8"));
            break;
     }
});

server.listen(port, () => {
     console.log("Server running");
});