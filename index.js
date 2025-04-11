const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const KEY = crypto.randomBytes(32).toString('hex');

//setup ejs for templates and templates folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

//settings for express
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});