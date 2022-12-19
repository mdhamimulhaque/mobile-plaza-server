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
        const blogsCollection = client.db("mobilePlaza").collection("blogs");
        const wishListCollection = client.db("mobilePlaza").collection("wishList");

        // ---> check isAdmin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        // ---> check seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' })
        })
        // ---> check seller
        app.get('/users/buyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' })
        })


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
        app.get('/categories', async (req, res) => {
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
            const query = { userEmail: email };
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })


        // ---> make advertisement
        app.put('/my-products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    available: 'available'
                },
            };
            const result = await productsCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })



        // ---> my product delete
        app.delete('/my-products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        // ---> show advertisement
        app.get('/advertisement', async (req, res) => {
            const query = { available: 'available' }
            const advertiseProducts = await productsCollection.find(query).toArray();
            res.send(advertiseProducts)
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

        // --->get users role

        app.get("/seller-role", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await usersCollection.find(query).project({ isVerifiedUser: 1 }).toArray();
            res.send(result)
        })



        // ---> store booking data
        app.post('/booking', async (req, res) => {
            const bookingData = req.body.body;
            const result = await bookingCollection.insertOne(bookingData);
            res.send(result)
        })
        // ---> my products
        app.get('/booking', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        // ---> all sellers
        app.get('/all-sellers', async (req, res) => {
            const query = { role: 'seller' };
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers)
        })

        // ---> verified user 
        app.put('/all-sellers/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    isVerifiedUser: true
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result)

        })


        // ---> remove seller
        app.delete('/all-sellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)

        })

        // ---> all sellers
        app.get('/all-buyers', async (req, res) => {
            const query = { role: 'buyer' };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers)
        })

        // ---> remove buyers
        app.delete('/all-buyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.deleteOne(query);
            res.send(result)

        })

        // --->blogs

        app.get('/blogs', async (req, res) => {
            const query = {};
            const blogs = await blogsCollection.find(query).toArray();
            res.send(blogs)
        })

        // --->store  wishlist data
        app.post('/wish-list', async (req, res) => {
            const wishListData = req.body;
            const result = await wishListCollection.insertOne(wishListData);
            res.send(result)
        })

        // --->get wishlist data
        app.get('/wish-list', async (req, res) => {
            const email = req.query.email;
            const query = { userEmail: email }
            const result = await wishListCollection.find(query).toArray();
            res.send(result)
        })

        //---> remove from wish list
        app.delete('/wish-list/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result)

        })

        // ---> jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            console.log(email)
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