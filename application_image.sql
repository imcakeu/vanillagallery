DROP DATABASE IF EXISTS application_image;
CREATE DATABASE application_image;

DROP TABLE IF EXISTS orientations;
DROP TABLE IF EXISTS auteurs;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS commentaires;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS accounts_images_like;

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

INSERT INTO auteurs (nom, prenom) VALUES ('Diconi', 'Edward');

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

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    salt BYTEA,
    hash BYTEA
);

CREATE TABLE accounts_images_like (
     id SERIAL PRIMARY KEY,
     id_account int references accounts,
     id_image int references images
);