const { faker } = require('@faker-js/faker');
const mysql = require("mysql2");
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'delta',
  password: 'nmadhuri02@'
});

let getRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.username(),
    faker.internet.email(),
    faker.internet.password(),
  ];
};

// 🏠 Home route
app.get("/", (req, res) => {
  let q = "SELECT count(*) AS count FROM user";
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let count = result[0].count;
      res.render("home.ejs", { count });
    });
  } catch (err) {
    console.log(err);
    res.send("some error in DB");
  }
});

// 👥 Show all users
app.get("/user", (req, res) => {
  let q = "SELECT * FROM user";
  try {
    connection.query(q, (err, users) => {
      if (err) throw err;
      res.render("showuser.ejs", { users });
    });
  } catch (err) {
    console.log(err);
    res.send("some error in DB");
  }
});

// ✏️ Edit user form
app.get("/user/edit/:id", (req, res) => {
  let { id } = req.params;
  let q = `SELECT * FROM user WHERE id='${id}'`;

  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      res.render("edit.ejs", { user: result[0] });  // ✅ pass user
    });
  } catch (err) {
    console.log(err);
    res.send("some error in DB");
  }
});


// 🔄 Update user (DB)
app.patch("/user/:id", (req, res) => {
  const { id } = req.params;
  const { password: formPass, username: newUsername } = req.body;

  const q = "SELECT * FROM user WHERE id = ?";

  try {
    connection.query(q, [id], (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        return res.send("User not found!");
      }

      const user = result[0];

      if (formPass !== user.password) {
        res.send("❌ WRONG password");
      } else {
        const q2 = "UPDATE user SET username = ? WHERE id = ?";
        connection.query(q2, [newUsername, id], (err2) => {
          if (err2) throw err2;
          res.redirect("/user");
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.send("some error in DB");
  }
});

// 🆕 Show form to add a new user
app.get("/user/new", (req, res) => {
  res.render("newuser.ejs");  // will create this form page
});

// 🆕 Handle form submission to insert new user
app.post("/user", (req, res) => {
  const { username, email, password } = req.body;
  const id = faker.string.uuid();  // auto-generate UUID

  let q = "INSERT INTO user (id, username, email, password) VALUES (?, ?, ?, ?)";
  try {
    connection.query(q, [id, username, email, password], (err, result) => {
      if (err) throw err;
      res.redirect("/user");  // after adding, go back to users list
    });
  } catch (err) {
    console.log(err);
    res.send("❌ Error inserting new user");
  }
});

//delete The user
// 🆕 Show delete confirmation page
app.get("/user/delete/:id", (req, res) => {
  const { id } = req.params;
  const q = "SELECT * FROM user WHERE id = ?";
  connection.query(q, [id], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.send("❌ User not found!");
    }
    res.render("delete.ejs", { user: result[0] });
  });
});

// 🗑️ Handle actual delete (with password check)
app.delete("/user/:id", (req, res) => {
  const { id } = req.params;
  const { password: formPass } = req.body;

  const q = "SELECT * FROM user WHERE id = ?";
  connection.query(q, [id], (err, result) => {
    if (err) throw err;
    if (result.length === 0) {
      return res.send("❌ User not found!");
    }

    const user = result[0];

    if (formPass !== user.password) {
      res.send("❌ Wrong password, try again!");
    } else {
      const q2 = "DELETE FROM user WHERE id = ?";
      connection.query(q2, [id], (err2) => {
        if (err2) throw err2;
        res.redirect("/user");
      });
    }
  });
});






app.listen(3000, () => {
  console.log(`🚀 Server is listening on port 3000`);
});
