require('dotenv').config()
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 4000;
const User = require("./User");
const Blog = require("./blog");
const { default: mongoose } = require('mongoose');

const corsOptional = {
    origin: [
        'http://localhost:5173',
        'https://blog-website-7a80f.web.app'
    ],
    credentials: true
}
const app = express();
app.use(cors(corsOptional));
app.use(express.json());
app.use(cookieParser());

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: "unauthorize access (not valid token)" });
    }
    jwt.verify(token, (process.env.JWT_TOKEN), (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorize access" });
        }
        req.user = decoded; //this the user token 
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kriop.mongodb.net/Blogs_Web?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Mongoose connected'))
    .catch((err) => console.error(err));

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

        //jwt webToken
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, (process.env.JWT_TOKEN), { expiresIn: '365d' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ status: true });
        })

        app.get('/logout', async (req, res) => {
            res.clearCookie('token', {
                maxAge: 0,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            })
                .send({ status: true });
        })

        app.post("/users", async (req, res) => {
            try {
                const userData = req.body;
                const newUser = await User.create(userData);

                if (newUser && newUser._id) {
                    res.status(201).json({
                        message: "User created successfully",
                        insertedId: newUser._id,
                    });
                } else {
                    res.status(400).json({ error: "User creation failed" });
                }

            } catch (err) {
                console.error(err);
                res.status(500).json({ error: "Server error occurred" });
            }
        });



        // all api collections
        const blogsCollection = client.db('Blogs_Web').collection('Blogs');
        const commentsCollection = client.db('Blogs_Web').collection('Comments');
        const wishListCollection = client.db('Blogs_Web').collection('wishList');

        app.get('/all-blogs', async (req, res) => {
            const filter = req.query.filter;
            const search = req.query.search;
            console.log(search);
            let query = {
                title: {
                    $regex: search, $options: 'i'
                }
            };
            if (filter) {
                query.category = filter;
            }
            const result = await blogsCollection.find(query).toArray();
            res.send(result);
        })
        app.get('/all-blogs-home', async (req, res) => {
            const result = await blogsCollection.find().limit(4).toArray();
            res.send(result);
        })
        app.get('/all-blogs-table', async (req, res) => {
            const result = await blogsCollection.aggregate([
                {
                    $addFields: {
                        descriptionLength: { $strLenCP: "$longDescription" }
                    }
                },
                {
                    $sort: {
                        descriptionLength: -1
                    }
                },
                {
                    $limit: 10
                },
                {
                    $project: {
                        descriptionLength: 0 // Exclude the temporary field
                    }
                }
            ]).toArray()
            res.send(result);
        })
        app.get('/all-blogsRecommended', async (req, res) => {
            const result = await blogsCollection.aggregate([
                {
                    $addFields: {
                        descriptionLength: { $strLenCP: '$longDescription' }
                    }
                },
                {
                    $sort: { descriptionLength: -1 }
                },
                {
                    $limit: 4
                },
                {
                    $project: {
                        descriptionLength: 0
                    }
                }
            ]).toArray();
            res.send(result);
        })

        app.get('/all-blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })


        app.post('/blogs', async (req, res) => {
            try {
                const blog = req.body;
                const result = await Blog.insertOne(blog);
                res.status(201).json(result);
            } catch (error) {
                console.error('Error creating blog:', error);
                res.status(500).json({ message: 'Failed to create blog', error: error.message });
            }
        });



        app.put('/update-blogs/:id', async (req, res) => {
            const id = req.params.id;
            const updateBlog = req.body;
            const filter = { _id: new ObjectId(id) };
            const update = {
                $set: updateBlog
            }
            const option = { upsert: true };
            const result = await blogsCollection.updateOne(filter, update, option);
            res.send(result);
        })


        //--------------------------------------For Comment section api---------------------------------
        app.get('/blog-Comment/:id', async (req, res) => {
            const commentId = req.params.id;
            const filter = { commentId: commentId }
            const result = await commentsCollection.find(filter).toArray();

            res.send(result);
        })

        app.post('/blog-Comment', async (req, res) => {
            const comment = req.body;
            const result = await commentsCollection.insertOne(comment);
            res.send(result);
        })
        // -------------------------------------------WishList----------------------------------------

        app.post('/wishList', async (req, res) => {
            const wishList = req.body;
            const query = { userEmail: wishList.userEmail, blog_id: wishList.blog_id }
            const alreadyExit = await wishListCollection.findOne(query);
            if (alreadyExit) {
                return res.status(400).send('Already Exist');
            }
            const result = await wishListCollection.insertOne(wishList);
            res.send(result);
        })

        app.get('/wishList-loved/:id', async (req, res) => {
            const cardId = req.params.id;
            const query = { blog_id: cardId }
            const result = await wishListCollection.find(query).sort({ _id: -1 }).limit(3).toArray()
            res.send(result);
        })

        app.get('/wishList/:email', verifyToken, async (req, res) => {
            const decodedEmail = req.user?.email;
            const email = req.params.email;
            if (decodedEmail != email) {
                return res.status(401).send({ message: "unauthorize access" });
            }
            const query = { userEmail: email }
            const result = await wishListCollection.find(query).toArray()
            res.send(result);
        })

        app.delete('/wishList/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result);
        })

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is running');
})

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
});