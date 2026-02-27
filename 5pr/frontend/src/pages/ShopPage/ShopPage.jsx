import { useEffect, useState } from "react";
import { api } from "../../api";
import ProductCard from "../../components/ProductCard";
import ProductModal from "../../components/ProductModal";
import "./ShopPage.scss";

export default function ShopPage() {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);


    useEffect(() => {
        loadProducts();
    }, []);


    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки товаров");
        } finally {
            setLoading(false);
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

                <button
                    className="addBtn"
                    onClick={() => {
                        setEditingProduct(null);
                        setModalOpen(true);
                    }}
                >
                    + Добавить товар
                </button>
            </div>


            {loading ? (
                <p>Загрузка...</p>
            ) : (

                <div className="grid">

                    {products.map((p) => (
                        <ProductCard
                            key={p.id}
                            product={p}
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

        </div>
    );
}