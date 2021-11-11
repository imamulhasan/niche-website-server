const express = require('express')
const { MongoClient } = require('mongodb');
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId
var admin = require("firebase-admin");
const cors = require('cors');
const app = express()
const port =process.env.PORT || 5000

// middle were 
app.use(cors())
app.use(express.json())

// firebase connet 


var serviceAccount = require("./bike-store-bf46c-firebase-adminsdk-st1fi-0269abad68.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// mongodb connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tul8s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// verify token 
async function verifyToken (req, res, next){

    if(req.headers?.authorization){
      const token = req.headers.authorization.split(' ')[1];
  
      try{
        const deCodedUser = await admin.auth().verifyIdToken(token)
        req.deCodedEmail = deCodedUser.email
      }
      catch{
      }
    }
    next()
  }
  



// declare crud operation in bike store

async function run(){
    try{
        await client.connect()
        const database = client.db('bike_store')
        const productsCollection = database.collection('products')
        const usersCollection = database.collection('users')
        const ordersCollection = database.collection('orders')
        const reviewCollection = database.collection('reviews')

        // post singel product from client 
        app.post('/product', async (req, res)=>{
            const query = req.body;
            console.log(query);
            const result = await productsCollection.insertOne(query);
            res.send(result)
        })

        // post order porduct from client
        app.post('/order', async (req, res)=>{
            const query = req.body;
            const result = await ordersCollection.insertOne(query);
            console.log(query);
            res.send(result)
        })

        // post user info 
        app.post('/users', async (req, res)=>{
            const query = req.body;
            const result = await usersCollection.insertOne(query);
            res.send(result)
        })

        // GET PRODUCTS FROM DATABASE 
        app.get('/products', async (req, res)=>{
            const cursor = productsCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })

        // DELETE SINGLE PRODUCT FROM DATABASE BY CLIENT 
        app.delete('/product/:id', async (req,res)=>{
            const id = req.params.id;
            const query ={_id:ObjectId(id)}
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        // update admin 
        app.put('/users/admin', verifyToken ,async (req,res)=>{
            const user=req.body;
            const requester = req.deCodedEmail;
            if(requester){
              const requesterAccount = await usersCollection.findOne({email:requester})
              if(requesterAccount.role==='admin'){
                const filter = {email:user.email}
                const updateDoc = {$set:{role:'admin'}}
                const result = await usersCollection.updateOne(filter,updateDoc)
                res.send(result)
              }
            }
            else{
              res.status(401).json({message:'you do not have make admin'})
            }
            
          })

        //   get admin 

        app.get('/admin/:email', async (req, res)=>{
            const email = req.params.email;
            const query ={email:email}
            const result = await usersCollection.findOne(query)
            let isAdmin = false;
            if(result.role==='admin'){
                isAdmin=true;
            }
            res.send({admin:isAdmin})
        })

        // get single users order 
        app.get('/orders/:email', async (req, res)=>{
          const email = req.params.email;
          const query = {email:email}
          const cursor = ordersCollection.find(query)
          const result = await cursor.toArray()
          res.send(result)
        })

        // get all orders 

        app.get('/allOrders', async(req, res)=>{
          const cursor = ordersCollection.find({})
          const result = await cursor.toArray()
          res.send(result)
        })

        // delte singel order 
        app.delete('/delete/:id', async (req, res)=>{
          const id = req.params.id;
          const query = {_id:ObjectId(id)}
          const result = await ordersCollection.deleteOne(query)
          res.send(result)
          console.log(result);
        })

        // orders pending to shipped
        app.put('/update/:id', async (req, res)=>{
          const id = req.params.id;
          const filter = {_id:ObjectId(id)}
          const updateDoc= {$set:{status:"Shipped"}}
          const result = await ordersCollection.updateOne(filter, updateDoc)
          res.send(result)
        })

        // post review  
        app.post('/review', async(req, res)=>{
          const query = req.body;
          const result = await reviewCollection.insertOne(query)
          res.send(result)
        })

        // get reviws from database 
        app.get('/reviews', async (req, res)=>{
          const cursor = reviewCollection.find({})
          const result = await cursor.toArray()
          res.send(result)
        })
      


    }
    finally{
        // await client.close()
    }

}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})