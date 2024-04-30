// Libraries
const http = require("http");
const fs = require("fs");
const path = require("path");


const port = 8080;
const server = http.createServer();
server.on("request", (req, res) => {
     switch(req.url){
          case "/images":
               res.end(fs.readFileSync("./images.html", "utf-8"));
               break;
          
          case "/image1":
               sendImage("./Images/image1.jpg", "image/jpeg", res);
               break;
        
           case "/image2":
               sendImage("./Images/image22.jpg", "image/jpeg", res);
               break;
   
           case "/image3":
               sendImage("./Images/image32.jpg", "image/jpeg", res);
               break;        

          default:
               res.end(fs.readFileSync("./index.html", "utf-8"));
               break;
     }
});

function sendImage(imagePath, contentType, res) {
     const absolutePath = path.join(__dirname, imagePath);
 
     fs.readFile(absolutePath, (err, data) => {
         if (err) {
             res.writeHead(500, { 'Content-Type': 'text/plain' });
             res.end('Internal Server Error');
         } else {
             res.writeHead(200, { 'Content-Type': contentType });
             res.end(data, 'binary');
         }
     });
 }

server.listen(port, () => {
     console.log("Server running");
});