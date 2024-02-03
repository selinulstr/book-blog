import express, { response } from "express";
import axios from "axios";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "booklist",
    password: "password",
    port: 5432
});

db.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let img_url;

app.get("/", async (req, res) => {
    const books = await db.query("SELECT * FROM books ORDER BY rate DESC");
    res.render("index.ejs", {posts: books.rows});
});


app.get("/title", async (req, res) => {
    const books = await db.query("SELECT * FROM books ORDER BY title ASC");
    res.render("index.ejs", {posts: books.rows});
});

app.get("/newest", async (req, res) => {
    const books = await db.query("SELECT * FROM books ORDER BY id DESC");
    res.render("index.ejs", {posts: books.rows});
});

app.get("/addBook", (req, res) => {
    res.render("post.ejs");
});

app.post("/add", async (req, res) => {
    const parameters = {
        title: req.body.title,
        author: req.body.author,
    };
    try {
        const result = await axios.get("https://openlibrary.org/search.json?", {params: parameters});
        const cover_id = result.data.docs[0].cover_i;
        img_url = `https://covers.openlibrary.org/b/id/${cover_id}-M.jpg`;
        
    } catch(err) {
        img_url = "images/cover.png"; 
        console.log(err);
    };
    try {
        await db.query("INSERT INTO books (title, author, date, rate, summary, review, cover) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
            req.body.title,
            req.body.author,
            req.body.date,
            req.body.rate,
            (req.body.review).slice(0,500),
            req.body.review,
            img_url
        ]);
    } catch(err) {
        console.log(err);
    };
    res.redirect("/");
});

app.get("/show/:id", async (req, res) => {
    const books = await db.query("SELECT * FROM books");
    const book = books.rows.find((b) => b.id === parseInt(req.params.id));
    res.render("show.ejs", {post: book});
});

app.get("/edit/:id", async (req, res) => {
    const books = await db.query("SELECT * FROM books");
    const book = books.rows.find((b) => b.id === parseInt(req.params.id));
    res.render("update.ejs", {post: book});
});

app.post("/update", async (req, res) => {
    const parameters = {
        title: req.body.title,
        author: req.body.author,
    };
    console.log(parameters);
    try {
        const result = await axios.get("https://openlibrary.org/search.json?", {params: parameters});
        const cover_id = result.data.docs[0].cover_i;
        img_url = `https://covers.openlibrary.org/b/id/${cover_id}-M.jpg`;
        
    } catch(err) {
        img_url = "images/cover.png"; 
        console.log(err);
    };
    try {
        
        await db.query("UPDATE books SET (title, author, date, rate, summary, review, cover) = ($1, $2, $3, $4, $5, $6, $7) WHERE id = ($8)", [
            req.body.title,
            req.body.author,
            req.body.date,
            req.body.rate,
            (req.body.review).slice(0,500),
            req.body.review,
            img_url,
            req.body.id
        ]);
    } catch(err) {
        console.log("wht");
        console.log(err);
    };
    res.redirect("/");
});

app.get("/delete/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM books WHERE id = ($1)", [parseInt(req.params.id)]);
    } catch(err) {
        res.status(404).json({ message: "Post not found" });
        console.log(err);

    };
   res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});