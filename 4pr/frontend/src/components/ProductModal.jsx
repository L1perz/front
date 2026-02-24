import { useState, useEffect } from "react";

/* Модальное окно для добавления и редактирования товара */
export default function ProductModal({ open, onClose, onSave, product }) {

    /* Состояние формы */
    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        price: "",
        stock: "",
        image: ""
    });


    /* Если редактируем — заполняем форму */
    useEffect(() => {
        if (product) {
            setForm(product);
        }
    }, [product]);


    // Если окно закрыто — ничего не показываем
    if (!open) return null;


    /* Обработка ввода */
    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };


    /* Отправка формы */
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };


    return (
        <div className="modal-backdrop">

            <div className="modal">

                {/* Заголовок окна */}
                <h2>
                    {product
                        ? "Редактировать товар"
                        : "Добавить товар"
                    }
                </h2>


                <form onSubmit={handleSubmit}>

                    {/* Название */}
                    <input
                        name="name"
                        placeholder="Название"
                        value={form.name}
                        onChange={handleChange}
                    />

                    {/* Категория */}
                    <input
                        name="category"
                        placeholder="Категория"
                        value={form.category}
                        onChange={handleChange}
                    />

                    {/* Описание */}
                    <input
                        name="description"
                        placeholder="Описание"
                        value={form.description}
                        onChange={handleChange}
                    />

                    {/* Цена */}
                    <input
                        type="number"
                        name="price"
                        placeholder="Цена"
                        value={form.price}
                        onChange={handleChange}
                    />

                    {/* Остаток */}
                    <input
                        type="number"
                        name="stock"
                        placeholder="Остаток"
                        value={form.stock}
                        onChange={handleChange}
                    />
                    {/* Ссылка на картинку */}
                    <input
                        name="image"
                        placeholder="URL картинки"
                        value={form.image}
                        onChange={handleChange}
                    />


                    {/* Кнопки формы */}
                    <div className="actions">

                        <button type="submit" className="save">
                            Сохранить
                        </button>

                        <button
                            type="button"
                            className="cancel"
                            onClick={onClose}
                        >
                            Отмена
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

