const express = require('express');
var jwt = require('jsonwebtoken');
require('dotenv').config()
const app = express();
const cors = require('cors');
const {
    MongoClient,
    ServerApiVersion,
    ObjectId
} = require('mongodb');
const port = process.env.PORT || 5000;


// middleWare
app.use(cors());
app.use(express.json());
const verifyJwt = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({
            error: true,
            message: 'unauthorized'
        });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKE_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({
                error: true,
                message: 'unauthorized'
            });
        }
        req.decoded = decoded;
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.do03a5n.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const userCollection = client.db("bistoDb").collection("user");
        const menuCollection = client.db("bistoDb").collection("menu");
        const reviewsCollection = client.db("bistoDb").collection("reviews");
        const cartsCollection = client.db("bistoDb").collection("carts");

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKE_SECRET, {
                expiresIn: '1d'
            })
            res.send({
                token
            })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await userCollection.findOne(query);
            if (user?.role !== 'admin') {
              return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
          }

        // user apis
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = {
                email: email
            };
            const user = await userCollection.findOne(filter)
            const result = {
                admin: user?.role === 'admin'
            }
            res.send(result)
        })

        app.post('/user', async (req, res) => {
            const user = req.body;
            const query = {
                email: user.email
            };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send('user already exists')
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        })

        app.patch('/user/admin/:id', async (req, res) => {
            const id = req.params.id;

            const filter = {
                _id: new ObjectId(id)
            };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            }
            const result = await userCollection.deleteOne(query);
            res.send(result)
        })

        // menu api
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result)
        })

        app.post('/menu', verifyJwt, verifyAdmin, async(req,res)=>{
            const newItem = req.body;
            const result = await menuCollection.insertOne(newItem);
            res.send(result)
        })

        app.delete('/menu/:id', verifyJwt, verifyAdmin, async(req,res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await menuCollection.deleteOne(query);
            res.send(result)
        })

        // reviews api
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result)
        })

        // carts apis
        app.get('/carts', verifyJwt, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.send([])
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
              return res.status(403).send({ error: true, message: 'forbidden access' })
            }
           
                const query = {
                    email
                }
                const result = await cartsCollection.find(query).toArray();
                res.send(result);
            
        })

        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item)
            const result = await cartsCollection.insertOne(item);
            res.send(result)
        })

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id)
            };
            const result = await cartsCollection.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({
            ping: 1
        });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('bistro boss ready to fight')
})

app.listen(port, () => {
    console.log(`bistro-boss running on port ${port}`)
})