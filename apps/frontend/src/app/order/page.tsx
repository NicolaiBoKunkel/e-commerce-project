"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/UserContext";
import { useState } from "react";

export default function OrderPage() {
  const { cart, clearCart } = useCart();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  console.log("USER OBJECT IN ORDER PAGE:", user);
  const placeOrder = async () => {
    if (!user || !user.id) {
      alert("You must be logged in to place an order.");
      return;
    }

    const products = cart.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
    }));

    setSubmitting(true);

    try {
      const res = await fetch("http://localhost:4000/order/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          products,
        }),
      });

      if (res.ok) {
        clearCart();
        alert("Order placed successfully!");
        router.push("/profile");
      } else {
        const errorData = await res.json();
        alert(`Failed to place order: ${errorData.error}`);
      }
    } catch (err) {
      alert("Something went wrong while placing your order.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading user info...</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.product._id}
              className="flex justify-between border-b pb-2"
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

          <div className="flex justify-between font-semibold text-lg pt-4">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={submitting}
            className={`w-full mt-6 px-4 py-2 rounded text-white ${
              submitting ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}
