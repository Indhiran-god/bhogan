document.addEventListener("DOMContentLoaded", function () {
  const registrationForm = document.getElementById("registrationForm");

  if (!registrationForm) {
    console.error("❌ Form element not found!");
    return;
  }

  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Collect form data
    const formData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      age: document.getElementById("age").value.trim(),
      gender: document.getElementById("gender").value,
      category: document.getElementById("category").value,
    };

    try {
      // Fetch Razorpay key from backend
      const keyResponse = await fetch("http://localhost:3000/get-razorpay-key");
      if (!keyResponse.ok) throw new Error("Failed to fetch Razorpay key");
      const { key } = await keyResponse.json();

      // Create order from backend
      const orderResponse = await fetch("http://localhost:3000/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }), // Amount in paise (1 INR = 100 paise)
      });

      if (!orderResponse.ok) throw new Error("Failed to create order");
      const order = await orderResponse.json();
      if (!order.id) throw new Error("Order ID missing from response");

      // Initialize Razorpay payment
      const options = {
        key, // Dynamically fetched Razorpay key
        amount: order.amount,
        currency: "INR",
        name: "Polo Marathon",
        description: "Marathon Registration Fee",
        order_id: order.id,
        handler: async function (response) {
          console.log("🔍 Razorpay Payment Response:", response);
          if (!response.razorpay_payment_id) {
            alert("Payment failed or cancelled. Please try again.");
            return;
          }

          // Send payment and user details to the backend for registration
          const saveResponse = await fetch("http://localhost:3000/api/auth/register", {
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
          registrationForm.reset();
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new Razorpay(options);

      // Handle payment failure
      razorpay.on("payment.failed", function (response) {
        alert("Payment failed: " + response.error.description);
        console.error("❌ Payment Failed:", response.error);
      });

      // Open Razorpay checkout
      razorpay.open();
    } catch (error) {
      console.error("❌ Error:", error.message);
      alert("An error occurred: " + error.message);
    }
  });
});
