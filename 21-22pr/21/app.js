const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

// Swagger (опционально, но можно оставить)
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

// ---------- Redis ----------
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisUrl });
redisClient.on("error", (err) => console.error("Redis error:", err));

// Middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ---------- Swagger ----------
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: { title: "API интернет-магазина", version: "1.0.0" },
        servers: [{ url: `http://localhost:${port}` }],
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
            }
        }
    },
    apis: ["./app.js"]
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Базы данных (in-memory) ----------
let products = [
    { id: nanoid(6), name: "Ноутбук HP", category: "Техника", description: "Мощный ноутбук", price: 72000, stock: 5, image: "https://via.placeholder.com/150" },
    { id: nanoid(6), name: "Смартфон Samsung", category: "Техника", description: "Отличная камера", price: 48000, stock: 12, image: "https://via.placeholder.com/150" },
    { id: nanoid(6), name: "Наушники Sony", category: "Аудио", description: "Беспроводные", price: 15000, stock: 8, image: "https://via.placeholder.com/150" }
];

let users = [
    { id: nanoid(6), email: "admin@admin.com", first_name: "Admin", last_name: "Root", passwordHash: bcrypt.hashSync("admin", 10), role: "admin", blocked: false },
    { id: nanoid(6), email: "seller@test.com", first_name: "Seller", last_name: "Manager", passwordHash: bcrypt.hashSync("123", 10), role: "seller", blocked: false },
    { id: nanoid(6), email: "user@test.com", first_name: "User", last_name: "Client", passwordHash: bcrypt.hashSync("123", 10), role: "user", blocked: false }
];
const refreshTokens = new Set();

// ---------- Helper functions ----------
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateAccessToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing Authorization header" });
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
        res.status(401).json({ error: "Invalid token" });
    }
}

function roleMiddleware(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
}

// ---------- КЭШИРОВАНИЕ ----------
const USERS_CACHE_TTL = 60;      // 1 минута
const PRODUCTS_CACHE_TTL = 600;  // 10 минут

function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);
            if (cachedData) {
                return res.json({ source: "cache", data: JSON.parse(cachedData) });
            }
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error("Cache read error:", err);
            next();
        }
    };
}

async function saveToCache(key, data, ttl) {
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(data));
    } catch (err) {
        console.error("Cache save error:", err);
    }
}

async function invalidateUsersCache(userId = null) {
    try {
        await redisClient.del("users:all");
        if (userId) await redisClient.del(`users:${userId}`);
    } catch (err) {
        console.error("Users cache invalidate error:", err);
    }
}

async function invalidateProductsCache(productId = null) {
    try {
        await redisClient.del("products:all");
        if (productId) await redisClient.del(`products:${productId}`);
    } catch (err) {
        console.error("Products cache invalidate error:", err);
    }
}

// ---------- AUTH ROUTES ----------
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }
    const exists = users.some(u => u.email === email);
    if (exists) return res.status(409).json({ error: "email already exists" });
    const passwordHash = await hashPassword(password);
    const user = {
        id: nanoid(6),
        email,
        first_name: first_name || "",
        last_name: last_name || "",
        passwordHash,
        role: role || "user",
        blocked: false
    };
    users.push(user);
    res.status(201).json({ id: user.id, email: user.email });
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.blocked) return res.status(403).json({ error: "User is blocked" });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);
    res.json({ accessToken, refreshToken });
});

app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }
    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        if (!user) return res.status(401).json({ error: "User not found" });
        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch {
        res.status(401).json({ error: "Expired refresh token" });
    }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        blocked: user.blocked
    });
});

// ---------- USERS (admin only) ----------
// GET /api/users – список (кэш 1 минута)
app.get(
    "/api/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
    async (req, res) => {
        const data = users.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            blocked: u.blocked
        }));
        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({ source: "server", data });
    }
);

// GET /api/users/:id – один пользователь (кэш 1 минута)
app.get(
    "/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    cacheMiddleware(req => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        const user = users.find(u => u.id === req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        const data = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            blocked: user.blocked
        };
        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({ source: "server", data });
    }
);

// PUT /api/users/:id – обновление (с инвалидацией)
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { email, first_name, last_name, role } = req.body;
    if (email !== undefined) user.email = email;
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (role !== undefined && ["user", "seller", "admin"].includes(role)) user.role = role;
    await invalidateUsersCache(user.id);
    res.json(user);
});

// DELETE /api/users/:id – удаление (с инвалидацией)
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    users = users.filter(u => u.id !== req.params.id);
    await invalidateUsersCache(req.params.id);
    res.status(204).send();
});

// PATCH /api/users/:id/block – блокировка/разблокировка (с инвалидацией)
app.patch("/api/users/:id/block", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.blocked = !user.blocked;
    await invalidateUsersCache(user.id);
    res.json(user);
});

// ---------- PRODUCTS (доступ всем аутентифицированным, изменение только seller/admin) ----------
// GET /api/products – список (кэш 10 минут)
app.get(
    "/api/products",
    authMiddleware,
    cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
    async (req, res) => {
        const data = products.map(p => ({ ...p }));
        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({ source: "server", data });
    }
);

// GET /api/products/:id – один товар (кэш 10 минут)
app.get(
    "/api/products/:id",
    authMiddleware,
    cacheMiddleware(req => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    async (req, res) => {
        const product = products.find(p => p.id === req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        await saveToCache(req.cacheKey, product, req.cacheTTL);
        res.json({ source: "server", data: product });
    }
);

// POST /api/products – создание (инвалидация всего списка)
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const { name, category, description, price, stock, image } = req.body;
    if (!name || !price) return res.status(400).json({ error: "name and price required" });
    const newProduct = {
        id: nanoid(6),
        name,
        category: category || "",
        description: description || "",
        price: Number(price),
        stock: Number(stock) || 0,
        image: image || ""
    };
    products.push(newProduct);
    await invalidateProductsCache(); // сбросить весь кэш товаров
    res.status(201).json(newProduct);
});

// PUT /api/products/:id – обновление (инвалидация конкретного товара и всего списка)
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    // Если нужна проверка владельца (seller может менять только свои), добавьте sellerId
    const { name, category, description, price, stock, image } = req.body;
    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (image !== undefined) product.image = image;
    await invalidateProductsCache(product.id);
    res.json(product);
});

// DELETE /api/products/:id – удаление (инвалидация)
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Product not found" });
    products.splice(index, 1);
    await invalidateProductsCache(req.params.id);
    res.status(204).send();
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// ---------- Запуск сервера с подключением к Redis ----------
async function start() {
    await redisClient.connect();
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        console.log(`Redis connected (${redisUrl})`);
        console.log(`Swagger docs: http://localhost:${port}/api-docs`);
    });
}

start().catch(console.error);