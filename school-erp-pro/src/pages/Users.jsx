import { useState } from "react";

export default function Users() {

  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "Admin",
    mobile: "",
    email: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>👤 User Management</h2>

      <table>
        <tbody>

          <tr>
            <td>पूर्ण नाव</td>
            <td>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </td>
          </tr>

          <tr>
            <td>Username</td>
            <td>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
              />
            </td>
          </tr>

          <tr>
            <td>Password</td>
            <td>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </td>
          </tr>

          <tr>
            <td>Role</td>
            <td>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option>Admin</option>
                <option>Teacher</option>
                <option>Clerk</option>
                <option>Principal</option>
              </select>
            </td>
          </tr>

          <tr>
            <td>Mobile</td>
            <td>
              <input
                type="text"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
              />
            </td>
          </tr>

          <tr>
            <td>Email</td>
            <td>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </td>
          </tr>

        </tbody>
      </table>

      <br />
      <button onClick={() => {
        if (!form.name || !form.username || !form.password) {
          alert("कृपया नाव, username आणि password भरा");
          return;
        }

        setUsers([
          ...users,
          {
            id: Date.now(),
            ...form,
          },
        ]);

        setForm({
          name: "",
          username: "",
          password: "",
          role: "Admin",
          mobile: "",
          email: ""
        });

        alert("User Save झाला");
      }}>
        Save User
      </button>

      <br /><br />

      <h3>Saved Users</h3>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>नाव</th>
            <th>Username</th>
            <th>Role</th>
            <th>मोबाईल</th>
            <th>Email</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.mobile}</td>
              <td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
  );
}