export default function ProductCard({ product, onDelete, onEdit }) {

    return (
        <div className="card">

            <img
                src={product.image || "https://via.placeholder.com/80?text=No+Image"}
                alt={product.name}
            />

            <div>
                <h3>{product.name}</h3>

                {/* Описание товара */}
                <p className="description">
                    {product.description}
                </p>
            </div>

            <p>{product.category}</p>

            <p className="price">{product.price} ₽</p>

            <p>ост. {product.stock}</p>

            <div className="actions">
                <button
                    className="edit"
                    onClick={() => onEdit(product)}
                >
                    Редактировать
                </button>

                <button
                    className="delete"
                    onClick={() => onDelete(product.id)}
                >
                    Удалить
                </button>
            </div>

        </div>
    );
}