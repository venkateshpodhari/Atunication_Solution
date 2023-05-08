const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At: http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR : '${e.message}'`);
    process.exist(1);
  }
};
initializeDBAndServer();

//register user
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQueryDetails = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(userQueryDetails);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbResponse === undefined) {
    const newUser = `
        INSERT INTO
         user(username,name,password,gender,location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');
        `;
    await db.run(newUser);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// login user
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isMatchedPassword = await bcrypt.compare(password, dbUser.password);
    if (isMatchedPassword) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//update password

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const dbResponse = await db.get(selectUserQuery);
  const isMatchedPassword = await bcrypt.compare(
    oldPassword,
    dbResponse.password
  );
  if (newPassword.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (isMatchedPassword) {
      const setNewPassword = `
        UPDATE 
        user
        SET username = '${username}',
        password = '${hashedPassword}';`;
      await db.run(setNewPassword);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
