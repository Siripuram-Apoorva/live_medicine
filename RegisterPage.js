import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    pharmacyLicenseNo: "",
    pharmacyStoreName: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (form.password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    try {
      await api.post("/auth/register", form);
      setMessage("Registration successful. Please login.");
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      setMessage(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="card small">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="form">
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          minLength={8}
          onChange={handleChange}
          required
        />
        <select name="role" onChange={handleChange} value={form.role}>
          <option value="user">User</option>
          <option value="pharmacy">Pharmacy</option>
        </select>
        {form.role === "pharmacy" && (
          <>
            <input
              name="pharmacyStoreName"
              placeholder="Pharmacy Store Name"
              onChange={handleChange}
              required
            />
            <input
              name="pharmacyLicenseNo"
              placeholder="Pharmacy License Number"
              onChange={handleChange}
              required
            />
          </>
        )}
        <button className="btn" type="submit">
          Register
        </button>
        <p className="auth-helper">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default RegisterPage;
