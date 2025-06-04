import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "../../services/api";
import "../../assets/AdminCategories.css";
import "react-toastify/dist/ReactToastify.css";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await getCategories(token);
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories");
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCategory) {
        const res = await updateCategory(editCategory._id, formData, token);
        setCategories(
          categories.map((c) => (c._id === editCategory._id ? res.data : c))
        );
        toast.success("Category updated successfully!");
      } else {
        const res = await addCategory(formData, token);
        setCategories([...categories, res.data]);
        toast.success("Category added successfully!");
      }
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setEditCategory(null);
      // Refresh categories after adding/updating
      fetchCategories();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to save category";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const handleDelete = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(categoryId, token);
        setCategories(categories.filter((c) => c._id !== categoryId));
        toast.success("Category deleted successfully!");
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Failed to delete category";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditCategory(category);
    setFormData({ name: category.name, description: category.description });
    setShowModal(true);
  };

  // Reset form and close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditCategory(null);
    setFormData({ name: "", description: "" });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-categories-container">
      <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
        <FaArrowLeft /> Back to Dashboard
      </button>
      <h1>Manage Categories</h1>
      <button className="add-btn" onClick={() => setShowModal(true)}>
        Add New Category
      </button>

      {/* Category List */}
      <div className="categories-table">
        <div className="table-header">
          <span>Name</span>
          <span>Description</span>
          <span>Products</span>
          <span>Actions</span>
        </div>
        {categories.length === 0 ? (
          <p>No categories available</p>
        ) : (
          categories.map((category) => (
            <div key={category._id} className="table-row">
              <span>{category.name}</span>
              <span>{category.description || "N/A"}</span>
              <span>{category.productCount || 0}</span>
              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(category)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(category._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editCategory ? "Edit Category" : "Add Category"}</h2>
            <form onSubmit={handleSubmit} className="category-form">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Category Name"
                required
              />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description (optional)"
                rows="4"
              />
              <div className="modal-actions">
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editCategory ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
