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
![Home-page](https://media.discordapp.net/attachments/943552392509653092/1234904707470852096/Capture-2024-04-30-181009.png?ex=66326e21&is=66311ca1&hm=a63b04161b1a66b917095392d9c22f1404ff9937b3586e75b57f236687ab796e&=&format=webp&quality=lossless&width=2160&height=1264)
![Photo Gallery](https://media.discordapp.net/attachments/943552392509653092/1234904840207863900/Capture_decran_2024-04-30_a_18.17.52.png?ex=66326e41&is=66311cc1&hm=20d305f0d8d7d3ee9a16a5b720cd6a75bb1d1badb75e3e06563c298c6e86e872&=&format=webp&quality=lossless&width=825&height=457)
![Photo Viewer](https://media.discordapp.net/attachments/943552392509653092/1234904864102809742/Capture_decran_2024-04-30_a_18.18.08.png?ex=66326e47&is=66311cc7&hm=027cc4f5cfab8137ba3c0876801da81a8f199d796f52ab0c7cc50126291fb90a&=&format=webp&quality=lossless&width=2163&height=1207)
