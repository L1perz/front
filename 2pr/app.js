const express = require("express");
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Массив товаров
let products = [
    { id: 1, name: "Ноутбук", price: 70000 },
    { id: 2, name: "Смартфон", price: 45000 },
    { id: 3, name: "Наушники", price: 8000 }
];

// Главная страница
app.get("/", (req, res) => {
    res.send("API для управления товарами");
});



// CRUD

// CREATE — добавить товар
app.post("/products", (req, res) => {
    const { name, price } = req.body;

    const newProduct = {
        id: Date.now(),
        name,
        price
    };

    products.push(newProduct);

    res.status(201).json(newProduct);
});


// READ — получить все товары
app.get("/products", (req, res) => {
    res.json(products);
});


// READ — получить товар по id
app.get("/products/:id", (req, res) => {
    const product = products.find(
        p => p.id == req.params.id
    );

    if (!product) {
        return res.status(404).send("Товар не найден");
    }

    res.json(product);
});


// UPDATE — изменить товар
app.patch("/products/:id", (req, res) => {
    const product = products.find(
        p => p.id == req.params.id
    );

    if (!product) {
        return res.status(404).send("Товар не найден");
    }

    const { name, price } = req.body;

    if (name !== undefined) {
        product.name = name;
    }

    if (price !== undefined) {
        product.price = price;
    }

    res.json(product);
});


// DELETE — удалить товар
app.delete("/products/:id", (req, res) => {
    products = products.filter(
        p => p.id != req.params.id
    );

    res.send("Товар удалён");
});


// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
});