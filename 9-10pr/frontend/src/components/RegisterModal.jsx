import { useState } from "react";
import axios from "axios";

export default function RegisterModal({ onClose }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [first_name, setFirstName] = useState("");
    const [last_name, setLastName] = useState("");
    const register = async () => {

        try {

            await axios.post(
                "http://localhost:3000/api/auth/register",
                {
                    email,
                    password,
                    first_name,
                    last_name
                }
            );

            alert("Регистрация успешна");

            onClose();

        } catch (err) {

            console.error(err);
            alert("Ошибка регистрации");

        }

    };

    return (

        <div className="modalOverlay">

            <div className="modal">

                <h2>Регистрация</h2>

                <input
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <input
                    type="first_name"
                    placeholder="Имя"
                    value={first_name}
                    onChange={(e) => setFirstName(e.target.value)}
                />

                <input
                    type="last_name"
                    placeholder="Фамилия"
                    value={last_name}
                    onChange={(e) => setLastName(e.target.value)}
                />

                <button
                    className="modalBtn register"
                    onClick={register}>
                    Зарегистрироваться
                </button>

                <button
                    className="modalBtn cancel"
                    onClick={onClose}
                >
                    Закрыть
                </button>

            </div>

        </div>

    )
} 