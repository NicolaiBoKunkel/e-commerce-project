"use client";

import { useEffect, useState } from "react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "", // used for either base64 OR direct URL
  });

  useEffect(() => {
    fetch("http://localhost:4000/product/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products", err);
        setLoading(false);
      });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.toString() || "";
      setForm((prev) => ({ ...prev, imageUrl: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const addProduct = async () => {
    const res = await fetch("http://localhost:4000/product/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const newProduct = await res.json();
      setProducts((prev) => [...prev, newProduct]);

      setForm({
        name: "",
        description: "",
        price: "",
        category: "",
        stock: "",
        imageUrl: "",
      });
    } else {
      alert("Failed to add product");
    }
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`http://localhost:4000/product/products/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p._id !== id));
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {products.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow-md p-4 space-y-2 relative"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-40 object-cover rounded"
            />
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p>{product.description}</p>
            <p className="text-sm text-gray-500">Category: {product.category}</p>
            <p className="text-lg font-bold">${product.price}</p>
            <p className="text-sm">Stock: {product.stock}</p>
            <button
              onClick={() => deleteProduct(product._id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-md space-y-3">
        <h2 className="text-xl font-semibold">Add New Product</h2>

        {/* Image preview (if any) */}
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt="Preview"
            className="w-full h-40 object-cover rounded border"
          />
        )}

        {/* Text inputs */}
        {Object.entries(form).map(([key, value]) => (
          key !== "imageUrl" && (
            <input
              key={key}
              name={key}
              value={value}
              onChange={handleInput}
              placeholder={key}
              className="w-full p-2 border rounded"
            />
          )
        ))}

        {/* Image URL (manually entered) */}
        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleInput}
          placeholder="Image URL"
          className="w-full p-2 border rounded"
        />

        {/* File picker (overwrites imageUrl) */}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="w-full p-2 border rounded"
        />

        <button
          onClick={addProduct}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Add Product
        </button>
      </div>
    </div>
  );
}
