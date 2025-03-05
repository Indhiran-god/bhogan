import React, { useEffect } from "react";

const App = () => {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://cdnjs.cloudflare.com/ajax/libs/wow/1.1.2/wow.min.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement("script");
    script2.src = "https://checkout.razorpay.com/v1/checkout.js";
    script2.async = true;
    document.body.appendChild(script2);

    script1.onload = () => {
      if (window.WOW) new window.WOW().init();
    };
  }, []);

  useEffect(() => {
    const handleSubmit = async (e) => {
      e.preventDefault();

      const formData = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        age: document.getElementById("age").value.trim(),
        gender: document.getElementById("gender").value,
        category: document.getElementById("category").value,
      };

      try {
        const keyResponse = await fetch("http://localhost:8000/get-razorpay-key");
        if (!keyResponse.ok) throw new Error("Failed to fetch Razorpay key");
        const { key } = await keyResponse.json();

        const orderResponse = await fetch("http://localhost:8000/createOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 100 }),
        });

        if (!orderResponse.ok) throw new Error("Failed to create order");
        const order = await orderResponse.json();

        const options = {
          key,
          amount: order.amount,
          currency: "INR",
          name: "Polo Marathon",
          description: "Marathon Registration Fee",
          order_id: order.id,
          handler: async function (response) {
            if (!response.razorpay_payment_id) {
              alert("Payment failed or cancelled. Please try again.");
              return;
            }

            const saveResponse = await fetch("http://localhost:8000/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...formData,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!saveResponse.ok) {
              const result = await saveResponse.json();
              alert("Registration failed: " + (result.msg || "Unknown error"));
              return;
            }

            alert("🎉 Registration and Payment Successful!");
            document.getElementById("registrationForm").reset();
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: { color: "#3399cc" },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response) {
          alert("Payment failed: " + response.error.description);
        });
        razorpay.open();
      } catch (error) {
        alert("An error occurred: " + error.message);
      }
    };

    document.getElementById("registrationForm")?.addEventListener("submit", handleSubmit);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f4f4f4", padding: "20px" }}>
    <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "8px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", width: "100%", maxWidth: "500px" }}>
      <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: "600", marginBottom: "20px" }}>Register for the Marathon</h2>
      <form id="registrationForm" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="text" id="name" name="name" placeholder="Enter your name" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required />
        <input type="email" id="email" name="email" placeholder="Enter your email" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required />
        <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required />
        <input type="number" id="age" name="age" placeholder="Enter your age" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required />
        <select id="gender" name="gender" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required>
          <option value="" disabled selected>Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select id="category" name="category" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} required>
          <option value="" disabled selected>Select Category</option>
          <option value="5km">5 km</option>
          <option value="10km">10 km</option>
          <option value="20km">20 km</option>
        </select>
        <button type="submit" id="payNow" style={{ backgroundColor: "#28a745", color: "white", padding: "12px", borderRadius: "4px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>Register & Pay</button>
      </form>
    </div>
  </div>
  );
};

export default App;
