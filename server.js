var express = require("express");
var path = require("path");
const cors = require("cors");
var fs = require("fs");
var morgan = require("morgan");

var app = express();

app.use(morgan("short"));

app.use(express.json());

app.use(cors());

let propertiesReader = require('properties-reader');
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.url");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;
console.log(uri);
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})

app.get('/collections/:collectionName', function(req, res, next) {
    req.collection.find({}).toArray(function (err, results) {
        if (err) {
            return next(err)
        }
        res.send({ msg: 'success', data: results })
    });
});

app.post('/collections/:collectionName', function(req, res, next) {
    req.collection.insertOne(req.body, (err, results) => {
        if (err) {
            return next(err)
        }
        res.send({ msg: 'success', data: results })
    });
});

app.put('/collections/:collectionName/:orderId', async function(req, res, next) {
    const orderId = req.params.orderId;

    try {
        await req.collection.updateOne(
            { _id: orderId },
            { $inc: { spaces: -1 } },
            { safe: true }
        );

        res.send({ msg: 'success' });
    } catch (err) {
        next(err);
    }
});

var publicPath = path.resolve(__dirname, "public");
app.use(express.static(publicPath));

var imagePath = path.resolve(__dirname, "images");
app.use("/images", express.static(imagePath));

app.use(function(req, res) {
    res.status(404);
    res.send("File not found!");
});

const port = process.env.PORT || 3030;
app.listen(port, function() {
    console.log("App started on port " + port);
});