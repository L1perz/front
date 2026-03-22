const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

// Swagger
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;


// Middleware
app.use(express.json());

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *         blocked:
 *           type: boolean
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
let users = [
    {
        id: nanoid(6),
        email: "admin@admin.com",
        first_name: "Admin",
        last_name: "Root",
        passwordHash: bcrypt.hashSync("admin", 10),
        role: "admin",
        blocked: false
    },
    {
        id: nanoid(6),
        email: "seller@test.com",
        first_name: "Seller",
        last_name: "Manager",
        passwordHash: bcrypt.hashSync("123", 10),
        role: "seller",
        blocked: false
    },
    {
        id: nanoid(6),
        email: "user@test.com",
        first_name: "User",
        last_name: "Client",
        passwordHash: bcrypt.hashSync("123", 10),
        role: "user",
        blocked: false
    }
];
const refreshTokens = new Set();

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
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );
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
        const payload = jwt.verify(token, ACCESS_SECRET);
        const user = users.find(u => u.id === payload.sub);

        if (user?.blocked) {
            return res.status(403).json({ error: "User is blocked" });
        }
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
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }

    const passwordHash = await hashPassword(password);

    const user = {
        id: nanoid(6),
        email,
        first_name,
        last_name,
        passwordHash,
        role: role || "user"
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
 *         description: Access и Refresh токены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Неверные данные
 */
app.post("/api/auth/login", async (req, res) => {

    const { email, password } = req.body;

    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    if (user.blocked) {
        return res.status(403).json({ error: "User is blocked" });
    }

    const valid = await verifyPassword(password, user.passwordHash);

    if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken
    });

});
/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление access и refresh токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *       401:
 *         description: Неверный или истекший refresh токен
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken || !refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = users.find(u => u.id === payload.sub);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        refreshTokens.delete(refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch {
        res.status(401).json({ error: "Expired refresh token" });
    }
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
        email: user.email,
        role: user.role
    });

});
function roleMiddleware(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", authMiddleware, (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
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
 *       200:
 *         description: Найденный товар
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const product = findProduct(req.params.id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (seller, admin)
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
app.post("/api/products",
    authMiddleware,
    roleMiddleware(["seller", "admin"]), (req, res) => {
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
 *   put:
 *     summary: Обновить товар (seller, admin)
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
app.put("/api/products/:id",
    authMiddleware,
    roleMiddleware(["seller", "admin"]), (req, res) => {
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
 *     summary: Удалить товар (admin only)
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
app.delete("/api/products/:id",
    authMiddleware,
    roleMiddleware(["admin"]), (req, res) => {
        products = products.filter(p => p.id !== req.params.id);
        res.status(204).send();
    });
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
app.get("/api/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    (req, res) => {
        res.json(users);
    }
);
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    (req, res) => {
        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    }
);
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить пользователя (admin only)
 *     tags: [Users]
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
 *             properties:
 *               email:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller, admin]
 *     responses:
 *       200:
 *         description: Пользователь обновлен
 *       404:
 *         description: Пользователь не найден
 */
app.put("/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    (req, res) => {

        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const { email, first_name, last_name, role } = req.body;

        if (email !== undefined) user.email = email;
        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;

        if (role !== undefined) {
            if (!["user", "seller", "admin"].includes(role)) {
                return res.status(400).json({ error: "Invalid role" });
            }
            user.role = role;
        }

        res.json(user);
    }
);
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    (req, res) => {

        users = users.filter(u => u.id !== req.params.id);

        res.status(204).send();
    }
);
/**
 * @swagger
 * /api/users/{id}/block:
 *   patch:
 *     summary: Заблокировать / разблокировать пользователя (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Пользователь обновлен (blocked true/false)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Пользователь не найден
 */
app.patch("/api/users/:id/block",
    authMiddleware,
    roleMiddleware(["admin"]),
    (req, res) => {

        const user = users.find(u => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.blocked = !user.blocked;

        res.json(user);
    }
);
// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});







