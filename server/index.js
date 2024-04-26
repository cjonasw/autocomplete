var express = require("express");
var app = express();
const readline = require("readline");
const fs = require("fs");
const { CITIES_FILE } = require("./constants");
const cors = require("cors");

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.use(cors());

app.get("/cities", (req, res) => {
  const searchTerm = req.query.search,
    cities = [],
    rl = readline.createInterface({
      input: fs.createReadStream(CITIES_FILE),
      output: process.stdout,
      terminal: false,
    });

  rl.on("line", (line) => {
    const city = line;

    // Return all cities if no search term is provided
    // Otherwise, return only cities that match the search term
    if (!searchTerm || city.toLowerCase().includes(searchTerm.toLowerCase())) {
      cities.push(city);
    }
  });

  rl.on("close", () => {
    // Sort cities by search term index
    if (searchTerm) {
      cities.sort((a, b) => {
        return (
          a.toLowerCase().indexOf(searchTerm.toLowerCase()) -
          b.toLowerCase().indexOf(searchTerm.toLowerCase())
        );
      });
    }

    res.json(cities);
  });
});
