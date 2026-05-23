import React, { useEffect, useState } from "react";
import api from "../api/axios";

function PharmacyAddStockPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [addForm, setAddForm] = useState({
    medicineName: "",
    category: "",
    stock: "",
    price: "",
  });
  const [updateForm, setUpdateForm] = useState({
    medicineId: "",
    stock: "",
    price: "",
  });

  const loadStock = async () => {
    try {
      const { data } = await api.get("/pharmacy/my-stock");
      setRows(data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load medicine list");
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/pharmacy/add-medicine", {
        medicineName: addForm.medicineName,
        category: addForm.category,
        stock: Number(addForm.stock),
        price: Number(addForm.price),
      });
      setAddForm({ medicineName: "", category: "", stock: "", price: "" });
      setMessage("Medicine added successfully.");
      await loadStock();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not add medicine");
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/pharmacy/update-stock", {
        medicineId: Number(updateForm.medicineId),
        stock: Number(updateForm.stock),
        price: Number(updateForm.price),
      });
      setUpdateForm({ medicineId: "", stock: "", price: "" });
      setMessage("Stock updated successfully.");
      await loadStock();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not update stock");
    }
  };

  return (
    <div className="card">
      <h2>Add Stock</h2>

      <section className="section-block">
        <form onSubmit={handleAddMedicine} className="form">
          <h3>Add New Medicine</h3>
          <input
            placeholder="Medicine Name"
            value={addForm.medicineName}
            onChange={(e) => setAddForm({ ...addForm, medicineName: e.target.value })}
            required
          />
          <input
            placeholder="Category"
            value={addForm.category}
            onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
            required
          />
          <input
            placeholder="Quantity (stock)"
            type="number"
            value={addForm.stock}
            onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
            required
          />
          <input
            placeholder="Price"
            type="number"
            value={addForm.price}
            onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
            required
          />
          <button className="btn" type="submit">
            Add Medicine
          </button>
        </form>
      </section>

      <section className="section-block">
        <form onSubmit={handleUpdateStock} className="form">
          <h3>Update Existing Stock</h3>
          <select
            value={updateForm.medicineId}
            onChange={(e) => setUpdateForm({ ...updateForm, medicineId: e.target.value })}
            required
          >
            <option value="">Select medicine</option>
            {rows.map((item) => (
              <option key={item.medicine_id} value={item.medicine_id}>
                {item.medicine_name}
              </option>
            ))}
          </select>
          <input
            placeholder="New Quantity (stock)"
            type="number"
            value={updateForm.stock}
            onChange={(e) => setUpdateForm({ ...updateForm, stock: e.target.value })}
            required
          />
          <input
            placeholder="New Price"
            type="number"
            value={updateForm.price}
            onChange={(e) => setUpdateForm({ ...updateForm, price: e.target.value })}
            required
          />
          <button className="btn secondary" type="submit">
            Update Stock
          </button>
        </form>
      </section>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default PharmacyAddStockPage;
