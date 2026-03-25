<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useCartStore } from "@/stores/cart";
import { useToastStore } from "@/stores/toast";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { http } from "@/api/http";

const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();
const router = useRouter();

/* -------------------------------------------------
   SAVED ADDRESS SYSTEM
--------------------------------------------------*/
const savedAddresses = ref<any[]>([]);
const selectedAddressId = ref("");
const addNew = ref(false);

// form fields
const fullName = ref("");
const email = ref(auth.user?.email ?? "");
const phone = ref("");
const addressLine1 = ref("");
const addressLine2 = ref("");
const city = ref("");
const state = ref("");
const zip = ref("");
const country = ref("India");
const landmark = ref("");
const tag = ref("");

const errors = ref<{ [k: string]: string }>({});

/* Load saved addresses */
async function loadAddresses() {
  try {
    const { data } = await http.get("/api/auth/addresses");
    savedAddresses.value = data ?? [];

    const def = savedAddresses.value.find((a) => a.isDefault);
    if (def) applyAddress(def);
  } catch {
    toast.show("Failed to load saved addresses", "error");
  }
}

/* Fill form */
function applyAddress(a: any) {
  addNew.value = false;
  selectedAddressId.value = a._id;

  fullName.value = a.fullName;
  phone.value = a.phone;
  zip.value = a.pincode;
  state.value = a.state;
  city.value = a.city;
  addressLine1.value = a.addressLine1;
  addressLine2.value = a.addressLine2;
  landmark.value = a.landmark;
  tag.value = a.tag;
}

/* Add new address */
function addNewAddressCard() {
  addNew.value = true;
  selectedAddressId.value = "";

  fullName.value = "";
  phone.value = "";
  zip.value = "";
  state.value = "";
  city.value = "";
  addressLine1.value = "";
  addressLine2.value = "";
  landmark.value = "";
  tag.value = "";
}

/* Save new address */
async function saveAddress() {
  try {
    const payload = {
      fullName: fullName.value,
      phone: phone.value,
      pincode: zip.value,
      state: state.value,
      city: city.value,
      addressLine1: addressLine1.value,
      addressLine2: addressLine2.value,
      landmark: landmark.value,
      tag: tag.value,
      isDefault: false,
    };

    await http.post("/api/auth/addresses", payload);
    toast.show("Address saved!", "success");
    addNew.value = false;
    loadAddresses();
  } catch {
    toast.show("Failed to save address", "error");
  }
}

/* -------------------------------------------------
   VALIDATION
--------------------------------------------------*/
function validate() {
  errors.value = {};
  if (!fullName.value) errors.value.fullName = "Enter full name";
  if (!email.value) errors.value.email = "Enter valid email";
  if (!phone.value) errors.value.phone = "Enter valid phone";
  if (!addressLine1.value) errors.value.addressLine1 = "Enter address";
  if (!city.value) errors.value.city = "Enter city";
  if (!zip.value) errors.value.zip = "ZIP/PIN required";
  return Object.keys(errors.value).length === 0;
}

/* -------------------------------------------------
   PROCEED TO PAYMENT
--------------------------------------------------*/
async function goToPayment() {
  if (!validate()) {
    toast.show("Please fix the errors", "error");
    return;
  }

  if (!cart.items.length) {
    toast.show("Your cart is empty", "error");
    return;
  }

  try {
    const items = cart.items.map((it) => ({
      productId: it.id,
      title: it.title,
      price: it.price,
      qty: it.qty,
      image: it.image,
    }));

    const billingAddress = {
      fullName: fullName.value,
      email: email.value,
      phone: phone.value,
      address: `${addressLine1.value}, ${addressLine2.value}`,
      city: city.value,
      state: state.value,
      zip: zip.value,
      country: country.value,
    };

    const { data } = await http.post("/api/create-order", {
      items,
      address: billingAddress,
      userId: auth.user?.email,
      pricing: {
        subtotal: cart.subtotal,
        discount: cart.discount,
        taxRate: cart.taxRate,
        tax: cart.tax,
        total: cart.total,
      },
      coupon: cart.coupon?.code ?? null,
    });

    router.push({
      path: "/payment",
      query: { orderId: data.orderId, amount: String(data.amount) },
    });
  } catch {
    toast.show("Failed to create order", "error");
  }
}

const total = computed(() => cart.total.toFixed(2));

onMounted(loadAddresses);
</script>

<template>
  <section class="checkout-page">

    <!-- STEP HEADER -->
    <div class="step-header">
      <span class="step-number">1</span>
      <h1>Shipping Address</h1>
    </div>

    <div class="checkout-grid">

      <!-- ✅ LEFT SIDE -->
      <div>

        <!-- ✅ SAVED ADDRESS GRID (Flipkart/Amazon style) -->
        <div class="address-grid">

          <!-- Saved addresses -->
          <div 
            v-for="a in savedAddresses"
            :key="a._id"
            class="address-card"
            :class="{ active: selectedAddressId === a._id }"
            @click="applyAddress(a)"
          >
            <div class="addr-top">
              <span class="tag" v-if="a.tag">{{ a.tag }}</span>
              <span class="name">{{ a.fullName }}</span>
            </div>

            <div class="addr-detail">{{ a.addressLine1 }}</div>
            <div v-if="a.addressLine2" class="addr-detail">{{ a.addressLine2 }}</div>
            <div class="addr-detail">{{ a.city }}, {{ a.state }} - {{ a.pincode }}</div>
            <div class="addr-detail small">📞 {{ a.phone }}</div>

            <button class="deliver-btn">Deliver Here</button>
          </div>

          <!-- Add New Address -->
          <div class="address-card add-card" @click="addNewAddressCard">
            <div class="plus-icon">+</div>
            <h4>Add New Address</h4>
          </div>

        </div>

        <!-- ✅ FORM SECTION (Flipkart-style inputs) -->
        <div class="section-box">
          <h2 class="form-title">Enter Address Details</h2>

          <div class="form-grid">

            <div class="form-field">
              <label>Full Name</label>
              <input v-model="fullName" placeholder="John Doe">
            </div>

            <div class="form-field">
              <label>Email</label>
              <input v-model="email" placeholder="john@email.com">
            </div>

            <div class="form-field">
              <label>Phone Number</label>
              <input v-model="phone" placeholder="9876543210">
            </div>

            <div class="form-field">
              <label>Pincode</label>
              <input v-model="zip" placeholder="400001">
            </div>

            <div class="form-field">
              <label>State</label>
              <input v-model="state" placeholder="Maharashtra">
            </div>

            <div class="form-field">
              <label>City</label>
              <input v-model="city" placeholder="Mumbai">
            </div>

            <div class="form-field full">
              <label>Address Line 1</label>
              <input v-model="addressLine1" placeholder="Flat / House No.">
            </div>

            <div class="form-field full">
              <label>Address Line 2</label>
              <input v-model="addressLine2" placeholder="Road / Area / Locality">
            </div>

            <div class="form-field">
              <label>Landmark</label>
              <input v-model="landmark" placeholder="Near SBI Bank">
            </div>

            <div class="form-field">
              <label>Tag</label>
              <input v-model="tag" placeholder="Home / Work">
            </div>

          </div>

          <button 
            v-if="addNew"
            class="save-address-btn"
            @click="saveAddress"
          >
            Save Address
          </button>
        </div>

      </div>

      <!-- ✅ RIGHT SIDE: Order Summary -->
      <div class="summary-box">
        <h2>Order Summary</h2>

        <div
          class="summary-item premium-item" 
          v-for="item in cart.items" 
          :key="item.id"
        >
          <!-- ✅ Product Image -->
          <img 
            :src="item.image" 
            alt="Product"
            class="product-img"
          />

          <!-- ✅ Product Summary -->
          <div class="item-details">

            <!-- Title (max 2 lines) -->
            <p class="item-title">
              {{ item.title }}
            </p>

            <!-- Optional: Ratings (Amazon style) -->
            <div class="rating-row">
              ★★★★☆ <span class="rating-count">(120)</span>
            </div>

            <!-- Qty -->
            <p class="item-qty">Qty: {{ item.qty }}</p>

            <!-- Optional delivery text -->
            <p class="delivery-text">Delivery in 2–4 days</p>

          </div>

          <!-- ✅ Price -->
          <div class="item-price">
            ₹{{ (item.qty * item.price).toFixed(2) }}
          </div>
        </div>

        <div class="summary-total">
          <span>Total:</span>
          <strong>₹{{ total }}</strong>
        </div>

        <button class="pay-btn" @click="goToPayment">
          Proceed to Payment
        </button>
      </div>

    </div>

  </section>
</template>

<style scoped>
.checkout-page {
  padding: 40px 20px;
  background: #0b0f14;
  color: #e6edf3;
  min-height: 100vh;
}

/* Step Header */
.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}
.step-header .step-number {
  background: #238636;
  height: 32px;
  width: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.checkout-title {
  font-size: 2rem;
}

/* 2-column grid like Flipkart */
.checkout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 28px;
}

/* ============================
   AMAZON STYLE ADDRESS CARDS
============================ */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.address-card {
  background: #11161d;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #2e3540;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  transition: 0.2s;
  cursor: pointer;
}
.address-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}
.address-card.active {
  border-color: #238636;
  box-shadow: 0 0 8px rgba(35,134,54,.6);
}

.addr-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.tag {
  background: #238636;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
}
.addr-title {
  font-weight: 800;
}
.addr-detail {
  opacity: .85;
  margin-bottom: 2px;
}
.addr-detail.small {
  opacity: .6;
  font-size: 0.85rem;
}

.deliver-btn {
  margin-top: 10px;
  background: #238636;
  border: none;
  padding: 8px;
  width: 100%;
  border-radius: 8px;
  color: white;
  font-weight: 600;
}
.add-card {
  border-style: dashed;
  text-align: center;
}
.plus-icon {
  font-size: 34px;
  opacity: .6;
}

/* =========================================
   FLIPKART STYLE FORM (CLEAN, PREMIUM)
========================================= */
.section-box {
  background: #11161d;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #2e3540;
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
}

.form-title {
  margin-bottom: 14px;
  font-weight: 700;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
}
.form-field label {
  font-size: 0.85rem;
  opacity: .75;
  margin-bottom: 4px;
}

.form-field input {
  background: #0c1117;
  border: 1px solid #2e3540;
  border-radius: 10px;
  padding: 12px;
  color: #e6edf3;
  transition: 0.2s ease;
  width: 100%;
}
.form-field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 4px rgba(59,130,246,.5);
  outline: none;
}

.form-field.full {
  grid-column: span 2;
}

.err {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 3px;
}

.save-address-btn {
  margin-top: 18px;
  width: 100%;
  padding: 12px;
  background: #238636;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 700;
}

/* =========================================
   ORDER SUMMARY (Right)
========================================= */
.summary-box {
  background: #11161d;
  border: 1px solid #2e3540;
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.35);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.summary-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.thumb {
  width: 50px;
  height: 50px;
  background: #222;
  border-radius: 8px;
}

.premium-item {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #2e3540;
}

/* Product image */
.product-img {
  width: 68px;
  height: 68px;
  object-fit: contain;
  border-radius: 10px;
  background: #1a1f25;
  padding: 6px;
  border: 1px solid #2e3540;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

/* Product details block */

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: .95rem;
  font-weight: 600;
  color: #e6edf3;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rating-row {
  font-size: 0.75rem;
  color: #facc15;
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-count {
  opacity: .7;
  font-size: 0.75rem;
}

.item-qty {
  font-size: 0.82rem;
  opacity: .8;
}

.delivery-text {
  font-size: 0.78rem;
  color: #22c55e;
  margin-top: 2px;
}

.item-price {
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  margin-left: auto;
  display: flex;
  align-items: center;
}

.summary-total {
  border-top: 1px solid #2e3540;
  padding-top: 12px;
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
}

.summary-item img.thumb {
  width: 60px;
  height: 60px;
  object-fit: contain;
  border-radius: 10px;
  background: #1a1f25;
  border: 1px solid #2e3540;
  padding: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
}

.pay-btn {
  margin-top: 16px;
  width: 100%;
  background: #238636;
  padding: 12px;
  border-radius: 12px;
  border: none;
  color: white;
  font-weight: 700;
}

/* MOBILE */
@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .form-field.full {
    grid-column: span 1;
  }
}
</style>