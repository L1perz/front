import { useEffect, useState } from "react";

import { api } from "../../api";
import ProductCard from "../../components/ProductCard";
import ProductModal from "../../components/ProductModal";
import "./ShopPage.scss";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";
import AdminPage from "../../components/AdminPage";

export default function ShopPage() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);


    useEffect(() => {
        loadProducts();

        if (token) {
            loadUser();
        }

    }, [token]);


    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadUser = async () => {
        try {
            const data = await api.getCurrentUser();
            setUser(data);
        } catch (err) {
            console.error(err);
        }
    };
    const handleDelete = async (id) => {
        const ok = window.confirm("Удалить товар?");
        if (!ok) return;

        try {
            await api.deleteProduct(id);
            loadProducts();
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };


    const handleSave = async (data) => {
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, data);
            } else {
                await api.createProduct(data);
            }

            setModalOpen(false);
            setEditingProduct(null);
            loadProducts();

        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения товара");
        }
    };


    return (
        <div className="shop">
            <div className="toolbar">

                <h1>Интернет-магазин</h1>
                {user && (
                    <p>
                        Вы: {user.email} ({user.role})
                    </p>
                )}
                <div className="authButtons">

                    {!token && (
                        <>
                            <button
                                className="registerBtn"
                                onClick={() => setShowRegister(true)}
                            >
                                Регистрация
                            </button>

                            <button
                                className="loginBtn"
                                onClick={() => setShowLogin(true)}
                            >
                                Войти
                            </button>
                        </>
                    )}
                    {user && user.role === "admin" && (
                        <button className="loginBtn" onClick={() => setShowAdmin(true)}>
                            Пользователи
                        </button>
                    )}
                    {token && user && (
                        <>
                            {["admin", "seller"].includes(user.role) && (
                                <button
                                    className="addBtn"
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setModalOpen(true);
                                    }}
                                >
                                    + Добавить товар
                                </button>

                            )}
                        </>
                    )}
                    {token && (
                        <>
                            <button
                                className="addBtn"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    setToken(null);
                                    setUser(null);
                                }}
                            >
                                Выйти
                            </button>
                        </>
                    )}


                </div>

            </div>


            {loading ? (
                <p>Загрузка...</p>
            ) : (

                <div className="grid">

                    {products.map((p) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            token={token}
                            user={user}
                            onDelete={handleDelete}
                            onEdit={(product) => {
                                setEditingProduct(product);
                                setModalOpen(true);
                            }}
                        />
                    ))}

                </div>

            )}


            <ProductModal
                open={modalOpen}
                product={editingProduct}
                onClose={() => {
                    setModalOpen(false);
                    setEditingProduct(null);
                }}
                onSave={handleSave}
            />
            <AdminPage
                open={showAdmin}
                onClose={() => setShowAdmin(false)}
            />
            {showLogin && (
                <LoginModal
                    onClose={() => setShowLogin(false)}
                    onLogin={(token) => setToken(token)}
                />
            )}
            {showRegister && (
                <RegisterModal
                    onClose={() => setShowRegister(false)}
                />
            )}
        </div>
    );
}