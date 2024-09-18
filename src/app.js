const express = require("express");
const { engine } = require("express-handlebars");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose')
require('dotenv').config();

const loginRoutes = require("./routes/login");
const { verifyToken } = require("./controllers/loginController");

const app = express();
app.set("port", 4000);

app.listen(app.get("port"), () => {
  console.log("Escuchando por el puerto", app.get("port"));
});

app.use(cookieParser());

app.set("views", __dirname + "/views");
app.engine(
  ".hbs",
  engine({
    extname: "hbs",
  })
);

app.set("view engine", "hbs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.log(err));

app.use(
  session({
    secret: "secret",
    resave: "true",
    saveUninitialized: "true",
  })
);

app.use("/", loginRoutes);

app.get("/", (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home", { name: req.session.name });
  } else {
    res.redirect("./login");
  }
});


app.get("/", verifyToken, (req, res) => {
  if (req.session.loggedin == true) {
    res.render("home", { name: req.session.name });
  }
});
