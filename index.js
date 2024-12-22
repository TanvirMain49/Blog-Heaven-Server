require('dotenv').config()
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 4000;

const app = express();
app.use(cors());

app.get('/', (req, res)=>{
    res.send('server is running');
})

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
});