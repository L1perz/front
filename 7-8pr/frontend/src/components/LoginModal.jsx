import { useState } from "react";
import axios from "axios";

function LoginModal({ onClose, onLogin }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {

        try {

            const res = await axios.post(
                "http://localhost:3000/api/auth/login",
                { email, password }
            );

            const token = res.data.accessToken;

            localStorage.setItem("token", token);

            onLogin(token);
            onClose();

        } catch {
            alert("Неверный логин или пароль");
        }

    };

    return (

        <div className="modalOverlay">

            <div className="modal">

                <h2>Вход</h2>

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

                <button className="modalBtn" onClick={login}>Войти</button>

                <button className="modalBtn cancel" onClick={onClose}>Закрыть</button>

            </div>

        </div>

    );
}

export default LoginModal;