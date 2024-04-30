DROP DATABASE IF EXISTS application_image;
CREATE DATABASE application_image;

DROP TABLE IF EXISTS orientations;
DROP TABLE IF EXISTS auteurs;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS commentaires;

CREATE TABLE orientations (
     id SERIAL PRIMARY KEY,
     nom VARCHAR(100) NOT NULL
);

INSERT INTO orientations (nom) VALUES ('portrait');
INSERT INTO orientations (nom) VALUES ('paysage');

CREATE TABLE auteurs (
     id SERIAL PRIMARY KEY,
     nom VARCHAR(100) NOT NULL,
     prenom VARCHAR(100)
);

CREATE TABLE images (
     id SERIAL PRIMARY KEY,
     nom VARCHAR(100) NOT NULL,
     date date,
     orientation int references orientations,
     fichier VARCHAR(100),
     id_auteur int references auteurs,
     likes int
);

CREATE TABLE commentaires (
     username VARCHAR(255),
     texte VARCHAR(255),
     id_image int references images
);

SELECT * FROM images;