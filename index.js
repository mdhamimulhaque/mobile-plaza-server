const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');


const app = express()
const port = process.env.PORT || 5000;

// ---> middle wares
app.use(cors());
app.use(express.json());



// ---> verify jwt
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }
    const token = authHeader.split(' ')[1];

    // ---> verify access
    jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
    });

    next()
}



// ---> database use
const run = async () => {
    try {
        // ---> mongodb connection  
        const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.76zc9vk.mongodb.net/?retryWrites=true&w=majority`;
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

        // ---> database collections
        const clientsReviewsCollection = client.db("mobilePlaza").collection("reviewsCollection");
        const categoriesCollection = client.db("mobilePlaza").collection("categories");
        const productsCollection = client.db("mobilePlaza").collection("products");
        const usersCollection = client.db("mobilePlaza").collection("users");
        const bookingCollection = client.db("mobilePlaza").collection("booking");


        // -----> test api 
        app.get('/', async (req, res) => {
            res.send('phone plaza server is running')
        });

        // ---> reviews collections
        app.get('/reviews', async (req, res) => {
            const query = {};
            const result = await clientsReviewsCollection.find(query).toArray();
            res.send(result)
        })

        // ---> categories 
        app.get('/categories', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = {};
            const result = await categoriesCollection.find(query).toArray();
            res.send(result)
        })

        // --->all products
        app.get('/products/:categoryName', async (req, res) => {
            const categoryName = req.params.categoryName;
            const query = { Category: categoryName };
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        // ---> add product
        app.post('/add-product', async (req, res) => {
            const newProduct = req.body.body;
            const result = await productsCollection.insertOne(newProduct);
            res.send(result)
        })

        // ---> my products
        app.get('/my-products', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        // ---> my product delete
        app.delete('/my-products/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result)
        })


        // ---> store users data
        app.put('/users', async (req, res) => {
            const userInfo = req.body.body;
            const email = userInfo.email;
            const query = { email: email }
            const findUser = await usersCollection.findOne(query);
            if (findUser) {
                return
            }

            const result = await usersCollection.insertOne(userInfo);
            res.send(result)
        })

        // ---> store booking data
        app.post('/booking', async (req, res) => {
            const bookingData = req.body.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
        })
        // ---> get booking products
        // app.get('/booking',async(req,res)=>{
        //     const email = 
        // })

        // ---> jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })




    } finally { }
}
run().catch(err => console.log(err))


app.listen(port, () => {
    console.log(`Mobile plaza server running from post ${port}`)
})