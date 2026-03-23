<script setup lang="ts">
import axios from "axios";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToastStore } from "@/stores/toast";
import { useCartStore } from "@/stores/cart";

const router = useRouter();
const toast = useToastStore();
const cart = useCartStore();

const route = useRoute();
const orderId = route.query.orderId


// Payment method options
type Method = "card" | "upi" | "netbanking" | "cod";
const selected = ref<Method>("card");

// Card details
const cardNumber = ref("");
const cardName = ref("");
const expiry = ref("");
const cvv = ref("");

// UPI
const upiId = ref("");

// Netbanking
const bank = ref("");

// COD
const codConfirmed = ref(false);

// Validation errors
const errors = ref<{ [k: string]: string }>({});

function validate(): boolean {
  errors.value = {};

  if (selected.value === "card") {
    if (!/^\d{16}$/.test(cardNumber.value.replace(/\s+/g, "")))
      errors.value.cardNumber = "Enter valid 16-digit card number";
    if (!cardName.value) errors.value.cardName = "Name required";
    if (!expiry.value || !/^\d{2}\/\d{2}$/.test(expiry.value))
      errors.value.expiry = "Expiry format MM/YY";
    if (!/^\d{3}$/.test(cvv.value))
      errors.value.cvv = "Enter valid CVV";
  }

  if (selected.value === "upi") {
    if (!/^[\w.-]+@[\w.-]+$/.test(upiId.value))
      errors.value.upi = "Enter valid UPI ID (e.g., name@upi)";
  }

  if (selected.value === "netbanking") {
    if (!bank.value) errors.value.bank = "Please select a bank";
  }

  if (selected.value === "cod") {
    if (!codConfirmed.value) errors.value.cod = "Please confirm COD payment";
  }

  return Object.keys(errors.value).length === 0;
}

async function payNow() {
  if (!validate()) {
    toast.show("Please fix the errors", "error");
    return;
  }

  if (!cart.items.length) {
    toast.show("Your cart is empty", "error");
    return;
  }

  toast.show("Processing payment...", "info");
  
const response = await axios.post("http://localhost:5000/api/pay-order", {
    orderId,
    method: selected.value,
  });
  
if (response.data.success) {
  setTimeout(() => {
    toast.show("Payment successful!", "success");
    cart.clear();
    router.push(`/order-success?orderId=${orderId}`);
  }, 1000);
  }

  setTimeout(() => {
    toast.show("Payment successful!", "success");
    cart.clear();
    router.push("/order-success");
  }, 1000);
}
</script>

<template>
  <section class="payment-page">

    <div class="card glass">
      <h1>Payment</h1>
      <p class="subtitle">Choose your payment method</p>

      <!-- Payment method buttons -->
      <div class="methods">
        <button
          class="method"
          :class="{ active: selected === 'card' }"
          @click="selected = 'card'"
        >
          💳 Card
        </button>

        <button
          class="method"
          :class="{ active: selected === 'upi' }"
          @click="selected = 'upi'"
        >
          🔗 UPI
        </button>

        <button
          class="method"
          :class="{ active: selected === 'netbanking' }"
          @click="selected = 'netbanking'"
        >
          🏦 NetBanking
        </button>

        <button
          class="method"
          :class="{ active: selected === 'cod' }"
          @click="selected = 'cod'"
        >
          📦 COD
        </button>
      </div>

      <!-- CARD PAYMENT UI -->
      <div v-if="selected === 'card'" class="section">
        <label>Card Number</label>
        <input v-model="cardNumber" placeholder="1234 5678 9012 3456" />
        <p class="err" v-if="errors.cardNumber">{{ errors.cardNumber }}</p>

        <label>Name on Card</label>
        <input v-model="cardName" placeholder="John Doe" />
        <p class="err" v-if="errors.cardName">{{ errors.cardName }}</p>

        <div class="row">
          <div>
            <label>Expiry</label>
            <input v-model="expiry" placeholder="MM/YY" />
            <p class="err" v-if="errors.expiry">{{ errors.expiry }}</p>
          </div>
          <div>
            <label>CVV</label>
            <input v-model="cvv" placeholder="123" />
            <p class="err" v-if="errors.cvv">{{ errors.cvv }}</p>
          </div>
        </div>
      </div>

      <!-- UPI PAYMENT -->
      <div v-if="selected === 'upi'" class="section upi-box">
  
        <h3 class="upi-title">Pay using UPI</h3>

        <!-- QR Code Box -->
        <div class="qr-container">
            <img 
            class="qr-img"
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=eshop@upi&pn=E-Shop"
            alt="QR Code"
            />

            <p class="scan-text">Scan this QR using any UPI app</p>

            <div class="app-row">
            <img class="upi-app" src="https://upload.wikimedia.org/wikipedia/commons/5/55/Google_Pay_Logo.svg" />
            <img class="upi-app" src="https://upload.wikimedia.org/wikipedia/commons/1/16/PhonePe-Logo.png" />
            <img class="upi-app" src="https://upload.wikimedia.org/wikipedia/commons/f/fb/BHIM_UPI_Logo.png" />
            <img class="upi-app" src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Paytm_Logo_2019.png" />
            </div>
        </div>

        <div class="divider">OR</div>

        <!-- Manual UPI Field -->
        <label>Enter UPI ID</label>
        <input v-model="upiId" placeholder="yourname@upi" />
        <p class="err" v-if="errors.upi">{{ errors.upi }}</p>

        </div>

      <!-- NETBANKING -->
      <div v-if="selected === 'netbanking'" class="section">
        <label>Select Bank</label>
        <select v-model="bank">
          <option disabled value="">Select</option>
          <option>HDFC Bank</option>
          <option>ICICI Bank</option>
          <option>Axis Bank</option>
          <option>SBI</option>
        </select>
        <p class="err" v-if="errors.bank">{{ errors.bank }}</p>
      </div>
      <!-- COD -->
      <div v-if="selected === 'cod'" class="section">
        <label class="cod-checkbox">
          <input type="checkbox" v-model="codConfirmed" />
          I agree to pay cash on delivery
        </label>
        <p class="err" v-if="errors.cod">{{ errors.cod }}</p>
      </div>

      <button class="pay-btn" @click="payNow">Pay Now</button>
    </div>

  </section>
</template>

<style scoped>
.payment-page {
  min-height: calc(100vh - 80px);
  padding: 30px 20px;
  display: grid;
  place-items: center;
}

/* Card container */
.card {
  width: min(500px, 95vw);
  background: rgba(13,17,23,0.7);
  border: 1px solid #2f363d;
  padding: 30px;
  border-radius: 16px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  color: var(--text, #e6edf3);
}

.subtitle {
  margin: -6px 0 20px;
  color: #9da7b1;
}

/* Payment method buttons */
.methods {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.method {
  padding: 10px 6px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  opacity: .8;
  transition: .2s;
}
.method.active {
  background: #238636;
  color: white;
  border-color: #238636;
  opacity: 1;
}
.method:hover {
  opacity: 1;
}

/* Sections input fields */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 22px;
}
input, select {
  width: 100%;
  padding: 12px;
  background: #0b0f14;
  border: 1px solid #30363d;
  border-radius: 10px;
  color: var(--text);
}
.row {
  display: flex;
  gap: 14px;
}
.err {
  color: #ef4444;
  font-size: .85rem;
}

/* Pay now button */
.pay-btn {
  width: 100%;
  padding: 14px;
  background: #238636;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 10px;
  transition: .2s;
}
.pay-btn:hover {
  transform: translateY(-2px);
  opacity: .9;
}

/* COD */
.cod-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* Razorpay style UPI box */
.upi-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-container {
  margin: 14px auto;
  background: rgba(0,0,0,0.4);
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #30363d;
  display: grid;
  justify-items: center;
}

.qr-img {
  width: 170px;
  height: 170px;
  border-radius: 10px;
}

.scan-text {
  margin-top: 10px;
  font-size: 0.9rem;
  opacity: .85;
}

.app-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.upi-app {
  height: 26px;
  filter: invert(1);
  opacity: 0.9;
}

.divider {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.6;
  margin: 8px 0;
}
</style>