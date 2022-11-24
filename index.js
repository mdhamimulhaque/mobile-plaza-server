const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000;

// ---> middle wares
app.use(cors());
app.use(express.json());


// ---> database use
const run = async () => {
    try {
        // ---> mongodb connection  
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76zc9vk.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

        //    -----> test api 
        app.get('/', (req, res) => {
            res.send('phone plaza server is running')
        })


    } finally { }
}
run().catch(err => console.log(err))


app.listen(port, () => {
    console.log(`Mobile plaza server running from post ${port}`)
})