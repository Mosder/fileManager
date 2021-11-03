var express = require("express");
var app = express();
const PORT = 3000;
var hbs = require('express-handlebars');
var path = require("path");
let filesArray = [];
let currentId = 0;
var formidable = require('formidable');
var session = require('express-session');
const fileIconsId = {
    pdf: 0,
    doc: 1,
    xls: 2,
    txt: 3,
    jpg: 4,
    png: 5,
    html: 6,
    mp4: 7,
    mp3: 8,
    gif: 9,
    js: 10,
    css: 11,
    psd: 12,
    avi: 13,
};
const logDetails = { login: "admin", password: "1234" };

app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', hbs({ defaultLayout: 'main.hbs', extname: '.hbs', partialsDir: "views/partials" }));
app.set('view engine', 'hbs');
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: true, saveUninitialized: true }));

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT);
})

app.get("/login", function (req, res) {
    if (req.session.gut) {
        res.redirect('/');
    }
    else {
        res.render('login.hbs', { layout: null });
    }
});
app.post("/login", function (req, res) {
    if (logDetails.login == req.body.login && logDetails.password == req.body.password) {
        req.session.gut = true;
        res.redirect('/');
    }
    else {
        res.render('login.hbs', { layout: null, info: "Wrong login and/or password" });
    }
});
app.get("/", function (req, res) {
    if (req.session.gut) {
        res.render('upload.hbs');
    }
    else {
        res.redirect('/login');
    }
});
app.post('/', function (req, res) {
    let form = formidable({});
    form.keepExtensions = true;
    form.multiples = true;
    form.uploadDir = __dirname + '/static/upload/';

    form.parse(req, function (err, fields, files) {
        let f = files.files;
        if (Array.isArray(f)) {
            for (let file of f) {
                filesArray.push({ id: currentId++, name: file.name, path: file.path, size: file.size, type: file.type, savedate: Date.now() });
            }
        }
        else {
            filesArray.push({ id: currentId++, name: f.name, path: f.path, size: f.size, type: f.type, savedate: Date.now() });
        }
    });
    res.render('upload.hbs');
});
app.get("/filemanager", function (req, res) {
    if (req.session.gut) {
        const context = getContextFM();
        res.render('filemanager.hbs', context);
    }
    else {
        res.redirect('/login');
    }
});
app.post("/filemanager", function (req, res) {
    if (req.body.down == undefined) {
        filesArray = filesArray.filter((x) => { return x.id != req.body.id });
        const context = getContextFM();
        res.render('filemanager.hbs', context);
    }
    else {
        res.download(filesArray.find(x => x.id == req.body.id).path);
    }
});
app.get("/info", function (req, res) {
    if (req.session.gut) {
        const context = {
            info: filesArray.find(x => x.id == req.query.id)
        };
        res.render('info.hbs', context);
    }
    else {
        res.redirect('/login');
    }
});
app.get("/reset", function (req, res) {
    if (req.session.gut) {
        filesArray = [];
        const context = getContextFM();
        res.render('filemanager.hbs', context);
    }
    else {
        res.redirect('/login');
    }
});

function getContextFM() {
    const context = {
        head: ['id', 'icon', 'name', 'size', 'type', '-', '-', '-'],
        files: filesArray.map((x) => {
            let id = fileIconsId[x.name.split('.').pop()];
            id = id == undefined ? 14 : id;
            return { ...x, coords: getCoords(id) }
        })
    };
    return context;
}
function getCoords(id) {
    return { x: 49 * (id % 5), y: 64 * parseInt(id / 5) };
}