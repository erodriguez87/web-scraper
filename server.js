// Required
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

// Used for scraping
const request = require("request");
const cheerio = require("cheerio");

// set up express app
const app = express();

// Require all models
const db = require("./models");
const PORT = process.env.PORT || 3000;

// Body-Parser
app.use(bodyParser.urlencoded({extended:true}));

// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


app.get('/scrape', function(req, res) {
  request("https://www.reddit.com/r/NintendoSwitch", function(error, response, html) {
    let $ = cheerio.load(html);
    let results = [];
    $("h2").each(function(i, element) {
      
      let title = $(element).text();
      let link = $(element).parent().attr("href");
      console.log(title + link)
      results.push({
        title: title,
        link: link
      });      
      console.log(results); 
    });
    res.json(results);
  })
});

app.post("/articles", function(req, res) {
  db.Article.create(req.body)
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      return res.json(err);
    });
})  


app.get("/articles", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
    res.json(dbArticle); 
  })
  .catch(function(err) {
    res.json(err); 
  })
});

// // Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  db.Article.find({ _id: req.params.id })
  .populate("note")
  .then(function(dbArticle) {
    res.json(dbArticle)
  })
  .catch(function(err) {
    res.json(err); 
  })
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting an Article
app.delete("/articles/:id", function(req, res) {
  db.Article.remove({ _id: req.params.id})
    .then(function(dbArticle) {
      res.json(dbArticle)
    })
    .catch(function(err) {
      res.json(err);
    });
}); 


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
