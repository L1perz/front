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


               <form onSubmit={handleSubmit} className="form">

    <div className="field">
        <label>Название</label>
        <input
            name="name"
            value={form.name}
            onChange={handleChange}
        />
    </div>

    <div className="field">
        <label>Категория</label>
        <input
            name="category"
            value={form.category}
            onChange={handleChange}
        />
    </div>

    <div className="field">
        <label>Описание</label>
        <input
            name="description"
            value={form.description}
            onChange={handleChange}
        />
    </div>

    <div className="field">
        <label>Цена</label>
        <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
        />
    </div>

    <div className="field">
        <label>Остаток</label>
        <input
            type="number"
            name="stock"
            value={form.stock}
            onChange={handleChange}
        />
    </div>

    <div className="field">
        <label>URL картинки</label>
        <input
            name="image"
            value={form.image}
            onChange={handleChange}
        />
    </div>

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

