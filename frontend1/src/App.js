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
    <div>
      <section id="home" className="hero wow animate__fadeIn" data-wow-duration="1.5s">
        <div className="hero-content">
          <h1>Welcome to the Polo Marathon</h1>
          <p>Run For Horses</p>
          <a href="#register" className="btn">Register Now</a>
        </div>
      </section>

      <section id="register" className="wow animate__fadeIn" data-wow-duration="1.5s">
        <div className="container">
          <h2>Marathon Registration Form</h2>
          <form id="registrationForm">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Enter your Full name" required />

            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Enter your Email" required />

            <label htmlFor="phone">Phone</label>
            <input type="tel" id="phone" name="phone" placeholder="Enter your Phone number" required />

            <label htmlFor="age">Age</label>
            <input type="number" id="age" name="age" placeholder="Enter your Age" required />

            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" required>
              <option value="" disabled selected>Choose Gender...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <label htmlFor="category">Run Category</label>
            <select id="category" name="category" required>
              <option value="" disabled selected>Choose Category...</option>
              <option value="5km">5 km</option>
              <option value="10km">10 km</option>
              <option value="20km">20 km</option>
            </select>

            <button type="submit" id="payNow">Register</button>
          </form>
        </div>
      </section>

      <footer>
        <p>&copy; 2025 Bhogan Mediasoft. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;