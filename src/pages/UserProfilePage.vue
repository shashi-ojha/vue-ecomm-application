
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";
import { useRouter } from "vue-router";

const toast = useToastStore();
const router = useRouter();

// Profile fields
const name = ref("");
const email = ref("");
const phone = ref("");

// Saved addresses
const addresses = ref<any[]>([]);
const orders = ref<any[]>([]);
const loading = ref(true);

// ✅ Address Modal State
const showModal = ref(false);
const editData = ref<any>({
  _id: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  tag: ""
});

// ✅ Open Edit Modal
function openEditModal(a: any) {
  editData.value = { ...a };
  showModal.value = true;
}

// ✅ Close Modal
function closeModal() {
  showModal.value = false;
}

// ✅ Save edited address
async function saveEditedAddress() {
  try {
    const payload = { ...editData.value };

    const { data } = await http.patch(
      `/api/auth/addresses/${payload._id}`,
      payload
    );

    addresses.value = data.addresses;
    toast.show("Address updated successfully!", "success");
    showModal.value = false;
  } catch (err) {
    toast.show("Failed to update address", "error");
  }
}

// ✅ Load Profile
async function loadProfile() {
  try {
    const { data: me } = await http.get("/api/auth/me");

    name.value = me.user.name;
    email.value = me.user.email;
    phone.value = me.user.phone;

    const { data: addrs } = await http.get("/api/auth/addresses");
    addresses.value = addrs;

    const { data: ord } = await http.get("/api/orders/me");
    orders.value = ord;
  } catch {
    toast.show("Failed to load profile", "error");
  } finally {
    loading.value = false;
  }
}

function goToEdit() {
  router.push("/profile/edit");
}

onMounted(loadProfile);
</script>

<template>
  <section class="profile-wrapper">

    <!-- Page Header -->
    <div class="profile-header glass">
      <div class="avatar-box">
        {{ name?.charAt(0)?.toUpperCase() }}
      </div>

      <div class="user-info">
        <h1>{{ name }}</h1>
        <p>{{ email }}</p>
        <p class="small" v-if="phone">📞 {{ phone }}</p>

        <button class="edit-btn" @click="goToEdit">
          Edit Profile
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="profile-grid">

      <!-- ✅ SAVED ADDRESSES -->
      <div class="card-section glass">
        <h2>Saved Addresses</h2>

        <div class="address-grid">

          <div 
            v-for="a in addresses"
            :key="a._id"
            class="address-card"
          >
            <div class="addr-header">
              <span class="tag">{{ a.tag || "Home" }}</span>
            </div>

            <p class="addr-name">{{ a.fullName }}</p>
            <p class="addr-line">{{ a.addressLine1 }}</p>
            <p v-if="a.addressLine2" class="addr-line">{{ a.addressLine2 }}</p>
            <p class="addr-line">{{ a.city }}, {{ a.state }} - {{ a.pincode }}</p>
            <p class="addr-line small">Phone: {{ a.phone }}</p>

            <button class="addr-edit-btn" @click="openEditModal(a)">Edit</button>
          </div>

          <!-- Add New Address -->
          <div class="address-card add-card">
            <div class="plus">+</div>
            <p>Add New Address</p>
          </div>

        </div>
      </div>

      <!-- ✅ RECENT ORDERS -->
      <div class="card-section glass">
        <h2>Recent Orders</h2>

        <div v-if="orders.length === 0" class="empty">No orders found.</div>

        <div
          class="order-card"
          v-for="o in orders"
          :key="o.orderId"
          @click="router.push('/order/' + o.orderId)"
        >
          <div class="order-header">
            <span class="order-id">Order #{{ o.orderId }}</span>
            <span class="order-status" :class="o.status">{{ o.status }}</span>
          </div>

          <div class="order-items">
            <div class="order-item" v-for="it in o.items" :key="it.title">
              <img :src="it.image" alt="Product Image" />
              <div>
                <p class="item-title">{{ it.title }}</p>
                <small>Qty {{ it.qty }}</small>
              </div>
              <p class="price">₹{{ (it.qty * it.price).toFixed(2) }}</p>
            </div>
          </div>

          <div class="order-total">
            Total: ₹{{ (o.amount + (o.shipping ?? 0)) }}
          </div>
        </div>

      </div>

    </div>

    <!-- ✅ ADDRESS EDIT MODAL -->
<div class="modal-backdrop" v-if="showModal">
  <div class="modal glass">

    <h2>Edit Address</h2>

    <div class="modal-grid">

      <div class="field">
        <label>Full Name</label>
        <input v-model="editData.fullName" />
      </div>

      <div class="field">
        <label>Phone</label>
        <input v-model="editData.phone" />
      </div>

      <div class="field full">
        <label>Address Line 1</label>
        <input v-model="editData.addressLine1" />
      </div>

      <div class="field full">
        <label>Address Line 2</label>
        <input v-model="editData.addressLine2" />
      </div>

      <div class="field">
        <label>City</label>
        <input v-model="editData.city" />
      </div>
      <div class="field">
        <label>State</label>
        <input v-model="editData.state" />
      </div>
      <div class="field">
        <label>Pincode</label>
        <input v-model="editData.pincode" />
      </div>
      <div class="field">
        <label>Tag</label>
        <input v-model="editData.tag" placeholder="e.g. Home, Work" />
      </div>

    </div>
    <div class="modal-actions">
      <button class="edit-btn" @click="saveEditedAddress">Save Changes</button>
      <button class="edit-btn" @click="closeModal">Cancel</button>
    </div>
  </div>
</div>
  </section>
</template>

<style scoped>
/* Page Wrapper */
.profile-wrapper {
  padding: 30px 20px;
  background:
    radial-gradient(900px 420px at 20% -10%, rgba(35,134,54,0.15), transparent 60%),
    radial-gradient(700px 380px at 100% 90%, rgba(99,102,241,0.15), transparent 60%),
    #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
}

/* Header Card */
.profile-header {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 28px;
  padding: 24px;
  border-radius: 18px;
}

.avatar-box {
  width: 80px;
  height: 80px;
  background: #238636;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 800;
  color: white;
}

.user-info h1 {
  margin-bottom: 6px;
  font-size: 1.8rem;
  font-weight: 800;
}

.user-info p.small {
  opacity: .75;
  font-size: .9rem;
}

/* Edit button */
.edit-btn {
  margin-top: 12px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #58a6ff;
  background: transparent;
  color: #58a6ff;
  font-weight: 600;
  cursor: pointer;
}
.edit-btn:hover {
  background: #58a6ff22;
}

/* Shared Glass Effect */
.glass {
  background: rgba(13,17,23,.6);
  border: 1px solid #2e3540;
  box-shadow: 0 10px 26px rgba(0,0,0,.35);
  backdrop-filter: blur(12px);
}

/* Layout Grid */
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

/* Sections */
.card-section h2 {
  font-size: 1.4rem;
  margin-bottom: 16px;
}

/* Address Cards */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
  gap: 16px;
}

.address-card {
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #30363d;
  background: #0f141a;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
}

.address-card.add-card {
  border-style: dashed;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.plus {
  font-size: 32px;
  opacity: .6;
}

.addr-name {
  font-weight: 700;
  margin-bottom: 4px;
}

.addr-line {
  opacity: .85;
  margin-bottom: 2px;
}
.addr-line.small {
  opacity: .65;
  font-size: .85rem;
}

.addr-edit-btn {
  margin-top: 10px;
  background: #238636;
  padding: 8px;
  border-radius: 8px;
  border: none;
  color: #fff;
  width: 100%;
  font-weight: 700;
}

/* Order Cards */
.order-card {
  border: 1px solid #30363d;
  padding: 16px;
  border-radius: 14px;
  margin-bottom: 14px;
  background: #0f141a;
  transition: .15s;
  cursor: pointer;
}
.order-card:hover {
  border-color: #238636;
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.order-status {
  font-weight: 600;
  text-transform: capitalize;
}
.order-status.delivered {
  color: #22c55e;
}
.order-status.cancelled {
  color: #ef4444;
}

.order-items {
  margin-top: 6px;
}
.order-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.order-item img {
  width: 55px;
  height: 55px;
  object-fit: contain;
  background: #1a1f25;
  border-radius: 8px;
  border: 1px solid #30363d;
  padding: 4px;
}

.item-title {
  font-size: .95rem;
}

.price {
  margin-left: auto;
  font-weight: 700;
}

.order-total {
  margin-top: 8px;
  font-weight: 700;
  padding-top: 8px;
  border-top: 1px solid #30363d;
}

.empty {
  opacity: .65;
}

/* ✅ MODAL BACKDROP */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 9999;
}

/* ✅ MODAL BOX */
.modal {
  width: min(480px, 92vw);
  padding: 24px;
  background: rgba(13,17,23,0.85);
  border: 1px solid #30363d;
  border-radius: 16px;
  box-shadow: 0 15px 40px rgba(0,0,0,0.65);
  animation: popin 0.25s ease;
}

@keyframes popin {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-grid .full {
  grid-column: span 2;
}

/* Modal buttons */
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn.ghost {
  background: transparent;
  border: 1px solid #4a5568;
  padding: 10px 16px;
  border-radius: 10px;
  color: #cbd5e0;
}

.btn.primary {
  background: #238636;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  color: #fff;
  font-weight: 700;
}

.field label {
  font-size: 0.85rem;
  margin-bottom: 4px;
  opacity: .75;
}

.field input {
  width: 100%;
  background: #0b0f14;
  border: 1px solid #30363d;
  padding: 10px;
  border-radius: 8px;
  color: #e6edf3;
}
</style>