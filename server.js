// Libraries
const http = require("http");
const fs = require("fs");
const { Client } = require('pg');
const crypto = require("crypto");
const { error } = require("console");

// PostgreSQL DB
const client = new Client({
     user: 'postgres', 
     password: 'root', 
     database: 'postgres',
     host: 'localhost',
     port : 5432 
 });
 
client.connect().then(() => {
     console.log('Connected to database');
 }) .catch((e) => {
     console.log('Error connecting to database');
     console.log(e);
 }); 

// Variables
let lastSessionId = 0;
let sessions = [];

// HTML
const host = 'localhost';
const port = 8080;
const server = http.createServer();
server.on("request", async (req, res) => {
     let hasCookieWithSessionId = false;
     let sessionId = undefined;
     let username = undefined;
     if (req.headers['cookie'] !== undefined) {
          let sessionIdInCookie = req.headers['cookie'].split(';').find(item => item.startsWith('session-id'));
          if (sessionIdInCookie !== undefined) {
               let sessionIdInt = parseInt(sessionIdInCookie.split('=')[1]);
               if (sessions[sessionIdInt]) {
                    hasCookieWithSessionId = true;
                    sessionId = sessionIdInt;
                    sessions[sessionId].nbRequest++;
                    username = sessions[sessionId].username;
               }
          }
     }
     if (!hasCookieWithSessionId) {
          lastSessionId++;
          res.setHeader('Set-Cookie', `session-id=${lastSessionId}`);
          sessionId = lastSessionId;
          sessions[lastSessionId] = {
               'nbRequest': 0
          }
     }

     // GET Routes
     if(req.method === 'GET') {
          // Webpages
          if(req.url == "/"){
               let html = await pageIndex(username, sessions[sessionId].id);
               res.end(html);
          } 
          else if(req.url.startsWith("/viewer/")){
               if(req.url.endsWith(".ico")) return;

               const image = parseInt(req.url.slice(8));
               let html = await(pageViewer(image, username));
               res.end(html);
          } 
          else if(req.url == "/gallery"){
               let html = await pageGallery(username, sessions[sessionId].id);
               res.end(html);
          }
          else if(req.url == "/signup"){
               res.end(pageSignForm(true));
          }
          else if(req.url == "/signin"){
               res.end(pageSignForm(false));
          }
          else if(req.url == "/signoff"){
               if (sessionId && sessions[sessionId]) {
                    delete sessions[sessionId];
               }

               res.writeHead(302, {'Location': '/'});
               res.end();
          }

          // Resources
          else if (req.url.startsWith('/image/')) {
               try {
                    res.end(fs.readFileSync('.'+req.url));
               } 
               catch (err) {
                   errorHandler(err);
               }
          }
          else if(req.url == "/style.css") {
               res.end(fs.readFileSync("./style.css", "utf-8"));
          }
          else if(req.url == "/page-image.js"){
               res.end(fs.readFileSync("./page-image.js"));
          }
          
          // 404
          else{
               res.end(pageMessage("404", "page not found", false));
          }
     }
     // Comment publishing
     else if (req.method === "POST" && req.url === "/description-image") {
          let donnees;
          req.on("data", (dataChunk) => {
              donnees += dataChunk.toString();
          });
          req.on("end", () => {
               const paramValeur = donnees.split("&");
               const imageNumber = paramValeur[0].split("=")[1];
               const text = paramValeur[1].split("=")[1];

               if(text != ""){
                    client.query("INSERT INTO commentaires (username, texte, id_image) VALUES ('" + sessions[sessionId].username + "', " + 
                                                                                     "'" + text + "', " +
                                                                                     "'" + imageNumber + "')");
                    res.statusCode = 302;
                    res.setHeader('Location', '/viewer/' + imageNumber);
                    res.end();
               }
               else{
                    res.end(pageMessage("Error", "can't send an empty comment!", false));
               }
          });
     }
     // Image liking
     else if (req.url.startsWith("/like/") && req.method === "POST") {
          let data = "";
          req.on("data", (chunk) => {
              data += chunk;
          });
          req.on("end", () => {
              const imageNumber = parseInt(req.url.slice(6));
              if (username && imageNumber) {
                    client.query("INSERT INTO accounts_images_like (id_account, id_image) VALUES ($1, $2)", [sessions[sessionId].id, imageNumber], (err, result) => {
                         if (err) {
                              res.statusCode = 500;
                              res.end(pageMessage("Error", "Error inserting like:", err), false);
                         } else {
                              res.writeHead(302, { 'Location': '/gallery' });
                              res.end();
                         }
                    });
                    client.query("UPDATE images SET likes = COALESCE(likes, 0) + 1 WHERE id =" + imageNumber + ";")
              } else {
                    res.statusCode = 400;
                    res.end(pageMessage("Error", "Invalid request parameters!"), false);
              }
          });
     }
     // Image disliking
     else if (req.url.startsWith("/dislike/") && req.method === "POST") {
          let data = "";
          req.on("data", (chunk) => {
              data += chunk;
          });
          req.on("end", () => {

               const imageNumber = parseInt(req.url.slice(9));
               if (username && imageNumber) {
                         client.query("DELETE FROM accounts_images_like WHERE id_account=$1 AND id_image=$2", [sessions[sessionId].id, imageNumber], (err, result) => {
                              if (err) {
                                   res.statusCode = 500;
                                   res.end(pageMessage("Error", "Error removing like:", err), false);
                              } else {
                                   res.writeHead(302, { 'Location': '/gallery' });
                                   res.end();
                              }
                         });
                         client.query("UPDATE images SET likes = COALESCE(likes, 0) - 1 WHERE id =" + imageNumber + ";");
               } else {
                         res.statusCode = 400;
                         res.end(pageMessage("Error", "Invalid request parameters!"), false);
               }
          });
     }
     // Account creation request
     else if (req.url === '/signup' && req.method === 'POST') {
          let data;
          req.on("data", (dataChunk) => {
              data += dataChunk.toString();
          });
          req.on("end", async () => {
               try {
                    const params = data.split("&");
                    const username = params[0].split("=")[1];
                    const password = params[1].split("=")[1];
                    const findQuery = `select count(username) from accounts where username='${username}'`; 
                    const findResult = await client.query(findQuery);
                    const USERNAME_IS_UNKNOWN = 0;
                    if (parseInt(findResult.rows[0].count) === USERNAME_IS_UNKNOWN) {
                         const salt = crypto.randomBytes(16).toString('hex');
                         const hash = crypto.createHash("sha256").update(password).update(salt).digest("hex");
                         const insertQuery = `INSERT INTO accounts (username, salt, hash) VALUES ('${username}', decode('${salt}','hex') , decode('${hash}','hex'));`; 
                         await client.query(insertQuery); 

                         res.end(pageSignUpSuccess(username));
                    } else {
                         res.end(pageMessage("Error", "username already taken. please choose another one", false));
                    }
               } catch(error) {
                    res.end(pageMessage("Error", error.message, true));
               }
          });
     }
     // Login
     else if (req.url === '/signin' && req.method === 'POST') {
          let data;
          req.on("data", (dataChunk) => {
              data += dataChunk.toString();
          });
          req.on("end", async () => {
               try {
                    const params = data.split("&");
                    const username = params[0].split("=")[1];
                    const password = params[1].split("=")[1];
                    const findQuery = `SELECT id, username, encode(salt,'hex') AS salt, encode(hash,'hex') AS hash FROM accounts WHERE username='${username}'`; 
                    const findResult = await client.query(findQuery);
                    const USERNAME_IS_UNKNOWN = 0;
                    if (parseInt(findResult.rows.length) !== USERNAME_IS_UNKNOWN) {
                         const salt = findResult.rows[0].salt;
                         const trueHash = findResult.rows[0].hash;
                         const computedHash = crypto.createHash("sha256").update(password).update(salt).digest("hex");
                         if (trueHash === computedHash) { //AUTHENTICATED
                              sessions[sessionId].username = username;
                              sessions[sessionId].id = findResult.rows[0].id;
                              res.writeHead(302, {'Location': '/'});
                              res.end();
                         } else {
                              res.end(pageMessage("Error", "wrong password. try again", false));
                         }
                    } else {
                         res.end(pageMessage("Error", "wrong username. try again", false));

                    }
               } catch(error) {
                    res.end(pageMessage("Error", error.message, true));
               }
          });
     }
     else { res.end(pageMessage("404", "page not found", false)); }
});

server.listen(port, host, () => {
     console.log(`Server running at http://${host}:${port}/`);
});

// Index/Home page 
// Shows 3 most recent photos. Links to gallery.
async function pageIndex(username, userID){
     try {
          const sqlQuery = await client.query('SELECT * FROM images ORDER BY date DESC LIMIT 3'); 
          const imageFiles = sqlQuery.rows.map(row => row.fichier);
          const imageIDs = sqlQuery.rows.map(row => row.id);
          const imageNames = sqlQuery.rows.map(row => row.nom);
          const imageLikes = sqlQuery.rows.map(row => row.likes);

          let html = pageTemplate();
          html += accountPanel(username);
          html += "<img src='/image/icon/logo.png'>";
          html += "<h1>cakeu's photos</h1> <p>welcome to my site.</p> <p>click on any photo to start browsing~</p><br><br>";
          html += "<div id='image-gallery'>";

          for (let i = 0; i < imageFiles.length; i++) {
               html += pageGalleryElement(imageIDs[i]-1, imageFiles[i], imageNames[i], imageLikes[i], username, false, true);
          }

          html += "</div> <br><br><br> <a class='link' href='gallery'>gallery</a><br></br>";
          html += '</body></html>';

          return html;
     } 
     catch (error) {
          return pageMessage("Error", error.message, true);
     }
}

// Photo Gallery (url: .../gallery)
// Displays all available photos in a "gallery wall" format
// Clicking on a photo leads you to the "Photo Viewer" display
async function pageGallery(username, userID){
     try {
          const sqlQuery = await client.query('SELECT * FROM images ORDER BY id;'); 
          const imageFiles = sqlQuery.rows.map(row => row.fichier);
          const imageNames = sqlQuery.rows.map(row => row.nom);
          const imageLikes = sqlQuery.rows.map(row => row.likes);
          let sqlQuery_likedImages;
          if(username) sqlQuery_likedImages = await client.query('SELECT * FROM accounts_images_like WHERE id_account = ' + userID + ' ORDER BY id_image;'); 

          let html = pageTemplate();
          html += accountPanel(username);
          html += '<h1>photo gallery</h1><br><br><br>';

          html += '<div id="image-gallery">';
          for (let i = 1; i < imageFiles.length+1; i++) {
               let imageLiked = false;
               if(username) imageLiked = userHasLikedImage(sqlQuery_likedImages.rows, userID, i);
               html += pageGalleryElement(i, imageFiles[i-1], imageNames[i-1], imageLikes[i-1], username, imageLiked, false);
          }
          html += '</div><br><br><br>';

          html += '<a class="link" href="/">return</a><br><br><br><br>';
          html += '</body></html>';

          return html;
     } 
     catch (error) {
          return pageMessage("Error", error.message, true);
     }
}

// Used by PhotoGalleryElement to update the like button 
// to show whether user has liked said photo
function userHasLikedImage(rows, userID, imageID){
     for(let i=0; i<rows.length; i++){
          if(rows[i].id_account == userID && rows[i].id_image == imageID){
               return true;
          }
     }

     return false;
}

// Used by both Homepage and Photo Gallery as a prefab for photos
// Liking is only possible by logged-in users
function pageGalleryElement(number, imageFile, imageName, imageLikes, hasAccount, hasLikedImage, isForcedStaticLike) {
     if (imageLikes == null) imageLikes = 0;
 
     let html = '<div class="image-component">';
     html += '<div class="image-component-container">';
 
     html += '<div class="image-element">';
     html += '<a href="/viewer/' + number + '" >';
     html += '<img src="/image/' + imageFile + '_small.jpg"/></a>';
     html += '</div>';

     html += '<div class="info-element style="color: white;"">';
     html += '<div class="info-element-container">';
     html += '<p>"' + imageName + '"</p><br>';
     html += '<p>' + imageLikes + '   </p>';

     if (hasAccount && !isForcedStaticLike) {
          if(hasLikedImage) {
               // Shows the filled like button
               html += '<form action="/dislike/' + number + '" method="post" style="display: inline;">';
               html += '<input type="hidden" name="imageNumber" value="' + number + '">';
               html += '<button type="submit" class="like-button" style="background-color: transparent; border: none;">';
               html += '<img class="like-element" src=/image/icon/like.png>';
               html += '</button>';
               html += '</form>';
          }
          else {
               // Shows the hollow like button
               html += '<form action="/like/' + number + '" method="post" style="display: inline;">';
               html += '<input type="hidden" name="imageNumber" value="' + number + '">';
               html += '<button type="submit" class="like-button" style="background-color: transparent; border: none;">';
               html += '<img class="like-element" src=/image/icon/like_empty.png>'; 
               html += '</button>';
               html += '</form>';
          }
     } else {
          // If user isn't logged in, like button is hollow and doesn't have the hover animation
          html += '   <img class="like-element-static" src=/image/icon/like_empty.png>';
     }
     html += '</div>';
     html += '</div>';
 
     html += '</div>';
     html += '</div>';
 
     return html;
 } 

// Photo Viewer (url: .../viewer/imageXYZ.jpg)
// Displays the selected photo and allows to browse other photos
// Comments can be submitted by logged in users
async function pageViewer(page, username){
     try {
          // SQL requests
          let imgcount_query = await client.query('SELECT COUNT(*) AS image_count FROM images');
          let imgcount = imgcount_query.rows[0].image_count;
          if(page>imgcount) return pageMessage("Error", "image does not exist", false);

          let image_centre_query = await client.query('SELECT * FROM images WHERE id=' + (page));
          let image_centre = image_centre_query.rows.map(row => row.fichier);
          let image_centre_name = image_centre_query.rows.map(row => row.nom);
          let image_left, image_right = -1;
          if(page>1) {
               let image_left_query = await client.query('SELECT * FROM images WHERE id=' + (page-1));  
               image_left = image_left_query.rows.map(row => row.fichier);
          }
          if(page<imgcount) {
               let image_right_query = await client.query('SELECT * FROM images WHERE id=' + (page+1));
               image_right = image_right_query.rows.map(row => row.fichier);
          }
          let comment_query = await client.query('SELECT * FROM commentaires WHERE id_image=' + (page));
          let comment_count = comment_query.rowCount;
          let comments_username = comment_query.rows.map(row => row.username);
          let comments_text = comment_query.rows.map(row => row.texte);
     
          // Header
          let html = pageTemplate();
          html += accountPanel(username);
          html += '<h1>"' + image_centre_name + '"</h1>';
          html += "<p>(" + page + "/" + imgcount + ")<br><br><br><br>";
     
          // Photo viewer
          html += "<div class='photo-viewer'>";
          html += "<img src='/image/" + image_centre + ".jpg' id='photo-viewer-main-image'>";
          if(image_left != -1) html += "<a href='/viewer/" + (page-1) + "' id='photo-viewer-left-image'> <img src='/image/" + image_left + "_small.jpg'></a>";
          if(image_right != -1) html += "<a href='/viewer/" + (page+1) + "' id='photo-viewer-right-image'> <img src='/image/" + image_right + "_small.jpg'></a>";
          html += "</div>";
          html += "<a class='link' href='/gallery'>return</a><br><br>";
     
          // Comment box
          html += "<h2>comments:</h2>";
          if(username) {
               html += '<form action="/description-image" method="post">';
               html += '<input type="hidden" name="image-number" value=' + page +'>';
               html += '<input type="text" name="description" id="commentBox">';
               html += '<input type="submit" value="send" id="submitButton"></form><br>';
          }
          
          if(comment_count>0){
               for(let i=0; i<comment_count; i++){
                    html += "<p><b>[" + comments_username[i] + "]</b>: " + decodeURIComponent(comments_text[i]) + "</p>";
               }
          }
          else{
               if(username) html += "<p>no comments yet.<br>be the first to make one!</p>";
               else html += "<p>no comments yet.<br>create an account to be the first to make one!";
          }

          html += '<br><br></body>';
          html += "<script type='text/javascript' src='/page-image.js'></script>";
          html += '</html>';

          return html; 
     } 
     catch (error) {
          return pageMessage("Error", error.message, true);
     }
}

// Generic sign-up/sign-in page
// signWhatDisplay is purely visual. signWhat is the actual form sent.
function pageSignForm(up) {
     let signWhat = up ? 'signup' : 'signin';
     let signWhatDisplay = up ? 'sign-up' : 'sign-in';

     let html = pageTemplate();
     html += "<div style='text-align: right;'><br><br>";
     html += "<a class='link' href='/'>return</a>";
     html += "</div>"
     html += '<h2>' + signWhatDisplay + '</h2><br>';
     html += '<form action="' + signWhat + '" method="POST">';
     html += '<label class="form-label" for="username">username:</label><br>';
     html += '<input type="text" class="form-input" name="username" id="username" required><br>';
     html += '<label class="form-label" for="password">password:</label><br>';
     html += '<input type="password" class="form-input" name="password" id="password" required><br>';
     html += '<input type="submit" class="form-submit" value="' + signWhatDisplay + '">';
     html += '</form>';
     html += '</body></html>';

     return html;
}

// Page shown after a successful signup.
// Links to signin page directly. Yay for good UX.
function pageSignUpSuccess(username) {
     let html = pageTemplate();
     html += "<br><br>";
     html += "<h1>account created</h1>";
     html += "<p>welcome to our website, " + username + "!</p>"
     html += "<br><a class='link' href='/signin'>sign-in</a>";
     
     return html;
}

// Template for all pages.
function pageTemplate(){
     let html = "<!DOCTYPE html><html lang='en'>";
     html += '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
     html += '<link rel="icon" href="image/icon/favicon.ico"/>';
     html += '<link rel="stylesheet" href="/style.css">';
     html += "<title>cakeu's photos</title></head>";
     html += '<body>';

     return html;
}

// Template for the user panel shown on almost every page
// Prompts user to sign-in/sign-up if not done already
// Prompts signed-in user to sign-off
function accountPanel(username) {
     let html = "<div style='text-align: right;'>";
     if (username) {
          html += "<p>signed in as: <b>" + username + "</b></p>";
          html += "<a class='link' href='/signoff'>sign-off</a>";
     }
     else {
          html += "<p>currently not signed in</p>";
          html += "<a class='link' href='/signin'>sign-in</a> or ";
          html += "<a class='link' href='/signup'>sign-up</a>";
     }
     html += "</div>"

     return html;
}

// Generic page that displays a message.
// Generally used for errors or 404.
// Optionally logs message in console.
function pageMessage(title, msg, isLog){
     let html = pageTemplate();
     html += "<br><br>";
     html += "<h1>" + title + "</h1>";
     html += "<p>" + msg + "</p>"
     html += "<br><a class='link' href='/'>return</a>";
     
     if(isLog) errorHandler(msg);
     return html;
}

// Log les erreurs de manière consistante dans la console
function errorHandler(err){
     console.log("(!) ERROR: " + err);
}