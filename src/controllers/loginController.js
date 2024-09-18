const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Login = require("../models/loginModel"); 

function login(req, res) {
  if (req.session.loggedin != true) {
    res.render("login/index");
  } else {
    res.redirect("/");
  }
}

function register(req, res) {
  if (req.session.loggedin != true) {
    res.render("login/register");
  } else {
    res.redirect("/");
  }
}

async function auth(req, res) {
  const data = req.body;

  try {
    const user = await Login.findOne({ email: data.email });

    if (!user) {
      return res.render("login/index", {
        error: "Error: el usuario no existe",
      });
    }

    const isMatch = await bcrypt.compare(data.password, user.password);

    if (!isMatch) {
      return res.render("login/index", {
        error: "Error: contraseña incorrecta",
      });
    }

    const token = jwt.sign(
      { name: user.name, email: user.email },
      "your_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token);
    req.session.loggedin = true;
    req.session.name = user.name;
    res.redirect("/");
  } catch (err) {
    return res.render("login/index", {
      error: "Error en la conexión con la base de datos",
    });
  }
}


async function storeUser(req, res) {
  const data = req.body;

  try {
    const user = await Login.findOne({ email: data.email });

    if (user) {
      return res.render("login/register", {
        error: "Error: el usuario ya existe",
      });
    }

    const hash = await bcrypt.hash(data.password, 12);
    data.password = hash;

    const newUser = new Login(data);
    await newUser.save();

    const token = jwt.sign(
      { name: data.name, email: data.email },
      "your_secret_key",
      { expiresIn: "1d" }
    );

    res.cookie("authToken", token);
    req.session.loggedin = true;
    req.session.name = data.name;
    res.redirect("/");
  } catch (err) {
    res.render("login/register", {
      error: "Error al guardar el usuario",
    });
  }
}

function verifyToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect("/login");
  }
  jwt.verify(token, "your_secret_key", (err, decoded) => {
    if (err) {
      return res.redirect("/");
    }
    req.user = decoded;
    next();
  });
}

function logout(req, res) {
  if (req.session.loggedin == true) {
    req.session.destroy();
    res.clearCookie("authToken");
    res.redirect("/login");
  }
}

module.exports = {
  login,
  register,
  storeUser,
  auth,
  logout,
  verifyToken,
};
