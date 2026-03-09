const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//JWT
const JWT_SECRET = "secret_key";
const TOKEN_EXPIRES = "1h";

// Swagger
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;


// Middleware
app.use(express.json());

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

/* Swagger настройка */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API интернет-магазина",
            version: "1.0.0",
            description: "Документация REST API товаров"
        },
        servers: [
            {
                url: `http://localhost:${port}`
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: ["./app.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - price
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         image:
 *           type: string
 */

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
//База пользователей
let users = [];

/* Helper */
function findProduct(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}
function authMiddleware(req, res, next) {

    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing Authorization header"
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        res.status(401).json({
            error: "Invalid token"
        });
    }
}
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }

    const passwordHash = await hashPassword(password);

    const user = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        passwordHash
    };

    users.push(user);

    res.status(201).json({ id: user.id, email: user.email });
});


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: JWT токен
 */
app.post("/api/auth/login", async (req, res) => {

    const { email, password } = req.body;

    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES }
    );

    res.json({ accessToken: token });

});


/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Текущий пользователь
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {

    const user = users.find(u => u.id === req.user.sub);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        id: user.id,
        email: user.email
    });

});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Найденный товар
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
    const product = findProduct(req.params.id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар создан
 */
app.post("/api/products", authMiddleware, (req, res) => {
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

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Обновленный товар
 */
app.patch("/api/products/:id", authMiddleware, (req, res) => {
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Удалено
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});







