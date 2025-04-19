"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

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
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});
  const { cart, addToCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "",
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

  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  if (loading) return <p>Loading...</p>;

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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

            <div className="flex gap-2 items-center mt-2">
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantities[product._id] || 1}
                onChange={(e) =>
                  handleQuantityChange(product._id, parseInt(e.target.value, 10))
                }
                className="w-16 border p-1 rounded text-center"
              />
              <button
                onClick={() =>
                  addToCart(product, quantities[product._id] || 1)
                }
                className="bg-blue-600 text-white px-2 py-1 rounded"
              >
                Add to Cart
              </button>
            </div>

            <button
              onClick={() => deleteProduct(product._id)}
              className="absolute top-2 right-2 bg-red-500 text-white text-sm px-2 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* 🛒 Cart Summary */}
      <div className="max-w-2xl mx-auto mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.product._id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <p className="font-bold">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-lg pt-2">
              <span>Total:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Link
              href="/order"
              className="block text-center bg-green-600 text-white py-2 px-4 rounded mt-4"
            >
              View Order
            </Link>
          </div>
        )}
      </div>

      {/* ➕ Product Creation Form */}
      <div className="max-w-md mt-12 space-y-3">
        <h2 className="text-xl font-semibold">Add New Product</h2>

        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt="Preview"
            className="w-full h-40 object-cover rounded border"
          />
        )}

        {Object.entries(form).map(([key, value]) =>
          key !== "imageUrl" ? (
            <input
              key={key}
              name={key}
              value={value}
              onChange={handleInput}
              placeholder={key}
              className="w-full p-2 border rounded"
            />
          ) : null
        )}

        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={handleInput}
          placeholder="Image URL"
          className="w-full p-2 border rounded"
        />

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
