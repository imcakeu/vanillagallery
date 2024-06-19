# Vanilla Gallery
A JavaScript/NodeJS photo gallery website with PostgreSQL support
> This was my final project for my Web Development and Databases course in my 1st year of Computer Science at the University of Bordeaux.

## Features
- PostgreSQL database for storing photo data (name, date, author...)
- Account system
- Likes and comments (tied to account system)
- Fully dynamically generated
- No frameworks. Just vanilla HTML, CSS and JavaScript.

## Set-up
Prerequisites: 
- NodeJS,
- A PostgreSQL database (you can quickly set up one using a GUI lke [Postgres.app](https://postgresapp.com/))

1. Prepare your database.
```
I've already set up a database with photos of my own.
You simply need to copy/paste the contents of first application_image.sql then images.sql.
```
2. (Optional) Add your own content.
```
To add your own content you must:
- Put your photos in the ./images/ folder (make sure they're all .jpg, not .jpeg or .png)
- Make sure each photo has a thumbnail that's max 200px size and that has the same name, ending with a _small.jpg
- Fill your database by following what i've did in images.sql
```
3. Start the webserver
```
node server.js
```

## Example showcase
![Home-page](https://raw.githubusercontent.com/imcakeu/vanillagallery/main/image/screenshot_1.png)
![Photo Gallery](https://raw.githubusercontent.com/imcakeu/vanillagallery/main/image/screenshot_2.png)
![Photo Viewer](https://raw.githubusercontent.com/imcakeu/vanillagallery/main/image/screenshot_3.png)
