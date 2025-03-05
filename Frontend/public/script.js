const registrationForm = document.getElementById("registrationForm");

registrationForm.addEventListener("submit", async (e) => {
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
    // Fetch the Razorpay Key from the backend
    const keyResponse = await fetch("http://localhost:3000/get-razorpay-key");
    const { key } = await keyResponse.json();

    const orderResponse = await fetch("http://localhost:3000/createOrder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    });
    
    const order = await orderResponse.json();
    if (!order.id) {
      alert("Error creating order. Please try again.");
      return;
    }

    const options = {
      key: key, // Dynamically fetched Razorpay key
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
        
        const saveResponse = await fetch("http://localhost:3000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            paymentId: response.razorpay_payment_id || "N/A",
            orderId: response.razorpay_order_id || "N/A",
            signature: response.razorpay_signature || "N/A",
          }),
        });

        const result = await saveResponse.json();
        if (!saveResponse.ok) {
          alert("Registration failed: " + result.msg);
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
    razorpay.open();
  } catch (error) {
    console.error("❌ Payment Error:", error);
    alert("An error occurred. Please try again later.");
  }
});