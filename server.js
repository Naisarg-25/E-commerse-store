const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const SECRET = process.env.JWT_SECRET || 'mysecretkey';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(__dirname));

mongoose.connect('mongodb://127.0.0.1:27017/shopdb')
.then(() => console.log("databse connected"))
.catch(err => console.log(err));

const userschema = new mongoose.Schema({
    name: {type: String, require: true},
    email: {type: String, unique: true},
    password: {type: String, require: true}
});

const User = mongoose.model("User", userschema);

const productschema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String
});

const Product = mongoose.model("Product", productschema);

const orderschema = new mongoose.Schema({
    userId: String,
    items: [{productId: String, quantity: Number}],
    date: {type: Date, default: Date.now},
});

const Order = mongoose.model("Order", orderschema);

function auth(req,res,next){
  const token = req.header("Authorization")?.replace("Bearer ","");
  if(!token) return res.status(401).json({ msg:"No token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch { res.status(400).json({ msg:"Invalid token" }); }
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Signup
app.post("/signup", async (req,res)=>{
  try {
    const { name,email,password } = req.body;
    const hashed = await bcrypt.hash(password,10);
    const user = new User({ name,email,password:hashed });
    await user.save();
    res.json({ msg:"Signup successful" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg:"Email already exists" });
    }
    res.status(500).json({ msg:"Signup failed" });
  }
});

// Login
app.post("/login", async (req,res)=>{
  try {
    const { email,password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(401).json({ msg:"Invalid credentials" });
    const valid = await bcrypt.compare(password,user.password);
    if(!valid) return res.status(401).json({ msg:"Invalid credentials" });
    const token = jwt.sign({ id:user._id, name:user.name }, SECRET, { expiresIn:"1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg:"Login failed" });
  }
});

// Products
app.get("/products", async (req,res)=> res.json(await Product.find()));
app.post("/products", auth, async (req,res)=> {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

// Cart/Checkout simulation
app.post("/checkout", auth, async (req,res)=>{
  const order = new Order({ userId:req.user.id, items:req.body.items });
  await order.save();
  res.json({ msg:"Order placed successfully", order });
});

app.listen(3000, ()=> console.log("Server running"));