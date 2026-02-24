const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"]
}));


// База товаров
let products = [
    {
        id: nanoid(6),
        name: "Ноутбук HP",
        category: "Техника",
        description: "Мощный ноутбук для работы и учебы",
        price: 72000,
        stock: 5,
        image: "https://www.tfk.ru/upload/dev2fun.imagecompress/webp/iblock/cc4/cispw95k2c092p02qb1cl1kpipbo52c8/c08530976.webp"
    },
    {
        id: nanoid(6),
        name: "Смартфон Samsung",
        category: "Техника",
        description: "Смартфон с отличной камерой",
        price: 48000,
        stock: 12,
        image: "https://technolove.ru/upload/iblock/216/z8foiu8l0mfrlcwncdqdjyuo246k81qh.jpg"
    },
    {
        id: nanoid(6),
        name: "Наушники Sony",
        category: "Аудио",
        description: "Беспроводные наушники с шумоподавлением",
        price: 15000,
        stock: 8,
        image: "https://doctorhead.ru/upload/dev2fun.imagecompress/webp/iblock/4ac/e23b5wqxezees39ykelju93c8wf338y8/sony_whch520_black_1.webp"
    },
    {
        id: nanoid(6),
        name: "Клавиатура Logitech",
        category: "Аксессуары",
        description: "Механическая клавиатура для геймеров",
        price: 9000,
        stock: 15,
        image: "https://edelws.ru/upload/iblock/d39/d39bf8728fa2d19334113af39393fcf1.png"
    },
    {
        id: nanoid(6),
        name: "Мышь Razer",
        category: "Аксессуары",
        description: "Игровая мышь с RGB-подсветкой",
        price: 6000,
        stock: 20,
        image: "https://4frag.ru/image/cache/data/product/razer-deathadder-essential-001-1000x1000.jpg"
    },
    {
        id: nanoid(6),
        name: "Монитор LG",
        category: "Техника",
        description: "27-дюймовый IPS монитор",
        price: 28000,
        stock: 6,
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoznTUYaT2xPcxwbLo2eNKwJT_lrPEj7bxww&s"
    },
    {
        id: nanoid(6),
        name: "Принтер Canon",
        category: "Офис",
        description: "Цветной струйный принтер",
        price: 14000,
        stock: 4,
        image: "https://print.market/wp-content/uploads/2020/12/Canon-PIXMA-MG3640S-1.jpg"
    },
    {
        id: nanoid(6),
        name: "Веб-камера Logitech",
        category: "Аксессуары",
        description: "Full HD камера для стримов",
        price: 7500,
        stock: 10,
        image: "https://smart-av.ru/image/cache/catalog/products/conference-cameras/c525-portable-hd-webcam-800x800.jpg"
    },
    {
        id: nanoid(6),
        name: "Внешний SSD Samsung",
        category: "Накопители",
        description: "SSD 1TB с USB-C",
        price: 16500,
        stock: 7,
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpNFYCiMK6p-8I06BydzWOq6m_bBR0e8Y3Tw&s"
    },
    {
        id: nanoid(6),
        name: "Колонка JBL",
        category: "Аудио",
        description: "Портативная Bluetooth колонка",
        price: 11000,
        stock: 9,
        image: "https://doctorhead.ru/upload/dev2fun.imagecompress/webp/iblock/472/yahq6eon7xokwm3u2a6imkuep9xbzoel/JBL-GO-Essential-Black_photo_1.webp"
    }
];



// Helper
function findProduct(id, res) {
    const product = products.find(p => p.id === id);

    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }

    return product;
}


//  CRUD 
// GET all
app.get("/api/products", (req, res) => {
    res.json(products);
});


// GET by id
app.get("/api/products/:id", (req, res) => {
    const product = findProduct(req.params.id, res);
    if (!product) return;

    res.json(product);
});


// POST
app.post("/api/products", (req, res) => {
    const { name, category, description, price, stock, image } = req.body;

    const newProduct = {
        id: nanoid(6),
        name,
        category,
        description,
        price: Number(price),
        stock: Number(stock),
        image
    };

    products.push(newProduct);

    res.status(201).json(newProduct);
});


// PATCH
app.patch("/api/products/:id", (req, res) => {
    const product = findProduct(req.params.id, res);
    if (!product) return;

    const { name, category, description, price, stock, image } = req.body;

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (image !== undefined) product.image = image;

    res.json(product);
});


// DELETE
app.delete("/api/products/:id", (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});


// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});


app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
});