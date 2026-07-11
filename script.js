const API = "http://localhost:3000";

const signupForm = document.getElementById('signupForm');
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPass = document.getElementById('signupPass');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPass = document.getElementById('loginPass');
const addProductForm = document.getElementById('addProductForm');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productDescription = document.getElementById('productDescription');
const messageBox = document.getElementById('message');
const dashboardPanel = document.getElementById('dashboardPanel');
const authpanel = document.getElementById('auth-grid');

let token = localStorage.getItem("token");
let cart = [];

function updateAuthUI() {
  if (token) {
    authpanel.style.display = "none";
    dashboardPanel.style.display = "block";
  } else {
    authpanel.style.display = "block";
    dashboardPanel.style.display = "none";
  }
}

function showMessage(msg, isError = false) {
  if (!messageBox) return;
  messageBox.textContent = msg || '';
  messageBox.style.color = isError ? 'red' : 'green';
}

function loadProducts(){
  axios.get(`${API}/products`).then(res=>{
    const div = document.getElementById("products");
    div.innerHTML="";
    res.data.forEach(p=>{
      div.innerHTML += `
        <div class="product">
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <p class="price">${p.price}</p>
          <button onclick="addToCart('${p._id}','${p.name}',${p.price})">Add to Cart</button>
        </div>`;
    });
  }).catch(err => {
    showMessage(err.response?.data?.msg || 'Unable to load products', true);
  });
}

function addToCart(id,name,price){
  cart.push({ productId:id, name, price, quantity:1 });
  renderCart();
}

function renderCart(){
  const div = document.getElementById("cart");
  div.innerHTML = cart.length ? cart.map(c=>`${c.name} - ${c.price}`).join("<br>") : "Your cart is empty.";
}

function checkout(){
  axios.post(`${API}/checkout`, { items:cart }, { headers:{ Authorization:`Bearer ${token}` } })
    .then(res=> {
      showMessage(res.data.msg);
      cart = [];
      renderCart();
    })
    .catch(err => showMessage(err.response?.data?.msg || 'Checkout failed', true));
}

signupForm.addEventListener("submit", e=>{
  e.preventDefault();
  axios.post(`${API}/signup`, { name:signupName.value, email:signupEmail.value, password:signupPass.value })
    .then(()=> {
      showMessage('Signup successful');
    })
    .catch(err => showMessage(err.response?.data?.msg || 'Signup failed', true));
});

loginForm.addEventListener("submit", e=>{
  e.preventDefault();
  axios.post(`${API}/login`, { email:loginEmail.value, password:loginPass.value })
    .then(res=>{
      token = res.data.token;
      localStorage.setItem("token", token);
      updateAuthUI();
      showMessage('Login successful');
      loadProducts();
    })
    .catch(err => showMessage(err.response?.data?.msg || 'Login failed', true));
});

addProductForm.addEventListener("submit", e=>{
  e.preventDefault();
  if (!token) {
    showMessage('Please login first to add a product', true);
    return;
  }

  axios.post(`${API}/products`, {
    name: productName.value,
    price: Number(productPrice.value),
    description: productDescription.value
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(() => {
      showMessage('Product added successfully');
      addProductForm.reset();
      loadProducts();
    })
    .catch(err => showMessage(err.response?.data?.msg || 'Failed to add product', true));
});

function logout(){
  localStorage.removeItem("token");
  token=null;
  updateAuthUI();
  showMessage('Logged out');
}

updateAuthUI();
loadProducts();