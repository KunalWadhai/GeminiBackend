
require('dotenv').config();

const app = require("./src/app");
const {connectDB} = require("./src/config/database");

connectDB();

app.get("/", (req, res) => {
    res.send("Home Route");
});

const port = 3000;
app.listen(port, ()=> {
    console.log(`Server running on the port ${port}`);
});