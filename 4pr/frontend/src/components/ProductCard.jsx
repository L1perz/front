/* Карточка одного товара */

export default function ProductCard({ product, onDelete, onEdit }) {

    return (
        <div className="card">

            {/* Картинка товара (заглушка) */}
            <img
                src={product.image || "https://via.placeholder.com/80?text=No+Image"}
                alt={product.name}
            />

            {/* Название */}
            <h3>{product.name}</h3>

            {/* Категория */}
            <p>{product.category}</p>

            {/* Цена */}
            <p className="price">{product.price} ₽</p>

            {/* Остаток */}
            <p>ост. {product.stock}</p>

            {/* Кнопки действий */}
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