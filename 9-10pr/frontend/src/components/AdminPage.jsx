import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminPage({ open, onClose }) {

    const [users, setUsers] = useState([]);
    const token = localStorage.getItem("token");
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        role: "user"
    });
    const loadUsers = async () => {
        try {
            const res = await axios.get("http://localhost:3000/api/users", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };
    const openEdit = (user) => {
        setEditingUser(user);
        setForm({
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        });
    };
    const saveUser = async () => {
        await axios.put(
            `http://localhost:3000/api/users/${editingUser.id}`,
            form,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        setEditingUser(null);
        loadUsers();
    };
    useEffect(() => {
        if (open) loadUsers();
    }, [open]);

    const changeRole = async (id, role) => {
        await axios.put(
            `http://localhost:3000/api/users/${id}`,
            { role },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        loadUsers();
    };
    const toggleBlock = async (id) => {
        await axios.patch(
            `http://localhost:3000/api/users/${id}/block`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        loadUsers();
    };

    if (!open) return null;

    return (
    <>
        <div className="modalOverlay">
            <div className="modal">

                <h2>Пользователи</h2>

                <button className="loginBtn" onClick={onClose}>Закрыть</button>

                {users.map(u => (
                    <div key={u.id} className="userRow">
                        <b>{u.email}</b> ({u.role})
                        {u.blocked && <span style={{ color: "red" }}> 🔴 blocked</span>}

                        <select
                            value={u.role}
                            onChange={(e) => changeRole(u.id, e.target.value)}
                        >
                            <option value="user">user</option>
                            <option value="seller">seller</option>
                            <option value="admin">admin</option>
                        </select>

                        <button class="userRow" onClick={() => openEdit(u)}>
                            ✏️
                        </button>

                        <button className="block" onClick={() => toggleBlock(u.id)}>
                            {u.blocked ? "Разблокировать" : "Заблокировать"}
                        </button>
                    </div>
                ))}

            </div>
        </div>

        {/* 👇 МОДАЛКА РЕДАКТИРОВАНИЯ */}
        {editingUser && (
            <div className="modalOverlay">
                <div className="modal">

                    <h3>Редактирование</h3>

                    <input
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="Email"
                    />

                    <input
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        placeholder="Имя"
                    />

                    <input
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        placeholder="Фамилия"
                    />

                    <select 
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="user">user</option>
                        <option value="seller">seller</option>
                        <option value="admin">admin</option>
                    </select>

                    <button className="loginBtn" onClick={saveUser}>Сохранить</button>
                    <button className="block" onClick={() => setEditingUser(null)}>Отмена</button>

                </div>
            </div>
        )}
    </>
);
}