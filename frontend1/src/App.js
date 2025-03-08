import React, { useEffect, useState } from "react";
import './App.css';
import background from './background.jpg';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

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

  const validateForm = (formData) => {
    const errors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const nameRegex = /^[A-Za-z\s]+$/;

    document.querySelectorAll('.error').forEach(el => el.textContent = '');

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (!nameRegex.test(formData.name)) {
      errors.name = 'Please enter a valid name (letters and spaces only)';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format (valid format: user@example.com)';
    } else if (formData.email.length > 50) {
      errors.email = 'Email must be less than 50 characters';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid 10-digit Indian phone number';
    }

    if (!formData.age.trim()) {
      errors.age = 'Age is required';
    } else if (isNaN(formData.age) || formData.age < 18 || formData.age > 100) {
      errors.age = 'Age must be between 18 and 100 years';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender';
    }

    if (!formData.category) {
      errors.category = 'Please select a run category';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRegistrationResult(null);

    const formData = {
      name: e.target.name.value.trim(),
      email: e.target.email.value.trim(),
      phone: e.target.phone.value.trim(),
      age: e.target.age.value.trim(),
      gender: e.target.gender.value,
      category: e.target.category.value,
    };

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        const errorElement = document.getElementById(`${field}Error`);
        if (errorElement) errorElement.textContent = message;
      });
      setLoading(false);
      return;
    }

    try {
      // Get Razorpay key
      const keyResponse = await fetch("https://bhogan-hpdi.vercel.app/get-razorpay-key");
      if (!keyResponse.ok) throw new Error("Failed to fetch Razorpay key");
      const { key } = await keyResponse.json();

 const orderResponse = await fetch("https://bhogan-hpdi.vercel.app/createOrder", {
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
        description: `Marathon Registration (${formData.category})`,
        order_id: order.id,
        handler: async (response) => {
          try {
            if (!response.razorpay_payment_id) {
              throw new Error("Payment failed or cancelled");
            }

            // Prepare registration data
            const registrationData = {
              ...formData,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            };

            // Submit registration
            const registerResponse = await fetch("https://bhogan-hpdi.vercel.app/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(registrationData),
            });

            const result = await registerResponse.json();
            
            if (!registerResponse.ok) {
              throw new Error(result.msg || "Registration failed");
            }

            setRegistrationResult(result);
            e.target.reset();
          } catch (error) {
            alert(`❌ Error: ${error.message}`);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: { color: "#3399cc" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        alert(`Payment failed: ${response.error.description}`);
      });
      razorpay.open();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section 
        id="home" 
        className="hero wow animate__fadeIn" 
        data-wow-duration="1.5s"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${background})` }}
      >
        <div className="hero-content">
          <h1>Welcome to the Polo Marathon</h1>
          <p>Run For Horses</p>
          <a href="#register" className="btn">Register Now</a>
        </div>
      </section>

      <section id="register" className="wow animate__fadeIn" data-wow-duration="1.5s">
        <div className="container">
          <h2>Marathon Registration Form</h2>
          {registrationResult && (
            <div className="success-message">
              <h3>Registration Successful!</h3>
              <p>Chest Number: {registrationResult.chestNumber}</p>
              <p>Check your email for confirmation details</p>
            </div>
          )}
          
          <form id="registrationForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Enter your Full name" 
                required 
              />
              <div id="nameError" className="error"></div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="Enter your Email" 
                required 
              />
              <div id="emailError" className="error"></div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                placeholder="Enter your Phone number"
                pattern="[6-9]\d{9}" 
                required 
              />
              <div id="phoneError" className="error"></div>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input 
                type="number" 
                id="age" 
                name="age" 
                placeholder="Enter your Age"
                min="18" 
                max="100" 
                required 
              />
              <div id="ageError" className="error"></div>
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" required>
                <option value="" disabled defaultValue>Choose Gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div id="genderError" className="error"></div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Run Category</label>
              <select id="category" name="category" required>
                <option value="" disabled defaultValue>Choose Category...</option>
                <option value="5km">5 km </option>
                <option value="10km">10 km </option>
                <option value="20km">20 km </option>
              </select>
              <div id="categoryError" className="error"></div>
            </div>

            <button type="submit" id="payNow" disabled={loading}>
              {loading ? 'Processing...' : 'Register Now'}
            </button>
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
