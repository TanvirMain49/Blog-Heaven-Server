require('dotenv').config()
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

//Blogs_web
//1qsvl66qqjgIJwY4


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kriop.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");


        // all api collections
        const blogsCollection = client.db('Blogs_Web').collection('Blogs');
        const commentsCollection = client.db('Blogs_Web').collection('Comments');
        const wishListCollection = client.db('Blogs_Web').collection('wishList');

        app.get('/all-blogs', async (req, res) => {
            const result = await blogsCollection.find().toArray();
            res.send(result);
        })
        app.get('/all-blogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        })
        app.put('/update-blogs/:id', async(req, res)=>{
            const id = req.params.id;
            const updateBlog = req.body; 
            const filter = {_id : new ObjectId(id)};
            const update = {
                $set: updateBlog
            }
            const option = {upsert: true};
            const result = await blogsCollection.updateOne(filter, update, option);
            res.send(result);
        })


//--------------------------------------For Comment section api---------------------------------
        app.get('/blog-Comment/:id', async (req, res) => {
            const commentId = req.params.id;
            const filter = {commentId: commentId}
            const result = await commentsCollection.find(filter).toArray();
            // console.log(result);
            res.send(result);
        })

        app.post('/blog-Comment', async (req, res) => {
            const comment = req.body;
            const result = await commentsCollection.insertOne(comment);
            res.send(result);
        })
// -------------------------------------------WishList----------------------------------------

        app.post('/wishList', async(req, res)=>{
            const wishList = req.body;
            const query = {userEmail: wishList.userEmail, blog_id: wishList.blog_id}
            console.log(query);
            const alreadyExit = await wishListCollection.findOne(query);
            if(alreadyExit){
                return res.status(400).send('Already Exist');
            }
            const result = await wishListCollection.insertOne(wishList);
            res.send(result);
        })

        app.get('/wishList', async(req, res)=>{
            const result = await wishListCollection.find().toArray()
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