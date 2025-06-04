import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaArrowLeft, FaImage } from "react-icons/fa";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "../../services/api";
import { getImageUrl } from "../../utils/imageUpload";
import "../../assets/AdminCommon.css";
import "../../assets/AdminProducts.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    image: null,
  });
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!token || !user || user.role !== "admin") {
      setError("Access denied. Admins only.");
      setLoading(false);
      navigate("/login");
      return;
    }
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(user.restaurantId),
        getCategories(user.restaurantId),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [token, user, navigate]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await fetchData();
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchData]);

  const handleChange = (e) => {
    if (e.target.name === 'image') {
      const file = e.target.files[0];
      if (file) {
        setSelectedImage(file);
        setFormData(prev => ({
          ...prev,
          image: URL.createObjectURL(file)
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', parseInt(formData.stock));
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }
      formDataToSend.append('restaurantId', user.restaurantId);

      if (editProduct) {
        await updateProduct(editProduct._id, formDataToSend);
      } else {
        await addProduct(formDataToSend);
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        image: null,
      });
      setSelectedImage(null);
      setEditProduct(null);
      setShowModal(false);
      
      // Fetch fresh data
      await fetchData();
      
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        await fetchData(); // Fetch fresh data after deletion
      } catch (err) {
        setError(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category?._id || "",
      stock: product.stock.toString(),
      image: product.image?.url || null,
    });
    setSelectedImage(null);
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-products-container">
      <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
        <FaArrowLeft /> Back to Dashboard
      </button>
      <h1>Manage Products</h1>
      <button className="add-btn" onClick={() => {
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "",
          stock: "",
          image: null,
        });
        setSelectedImage(null);
        setEditProduct(null);
        setShowModal(true);
      }}>
        Add New Product
      </button>

      <div className="products-table">
        <div className="table-header">
          <span>Image</span>
          <span>Name</span>
          <span>Price</span>
          <span>Category</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>
        {products.length === 0 ? (
          <p>No products available</p>
        ) : (
          products.map((product) => (
            <div key={product._id} className="table-row">
              <span className="product-image">
                <img src={getImageUrl(product.image)} alt={product.name} />
              </span>
              <span>{product.name}</span>
              <span>PKR {product.price.toFixed(2)}</span>
              <span>{product.category?.name || "Uncategorized"}</span>
              <span>{product.stock}</span>
              <div className="actions">
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editProduct ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-layout">
                <div className="image-upload">
                  {formData.image ? (
                    <div className="image-preview">
                      <img src={formData.image} alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: null }));
                          setSelectedImage(null);
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      <FaImage />
                      <p>Click to upload image</p>
                    </div>
                  )}
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="upload-button">
                    {formData.image ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>

                <div className="form-fields">
                  <div className="form-group">
                    <label>Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Product Name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Product Description"
                      rows="4"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="Price"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Stock"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" disabled={loading}>
                  {loading
                    ? "Saving..."
                    : editProduct
                    ? "Update Product"
                    : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditProduct(null);
                    setFormData({
                      name: "",
                      description: "",
                      price: "",
                      category: "",
                      stock: "",
                      image: null,
                    });
                    setSelectedImage(null);
                  }}
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

export default Products;
