
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

// ✅ ADD NEW ADDRESS MODAL
const showAddModal = ref(false);

const newAddress = ref({
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

// ✅ Open Add Modal
function openAddModal() {
  newAddress.value = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    tag: ""
  };
  showAddModal.value = true;
}

// ✅ Close Add Modal
function closeAddModal() {
  showAddModal.value = false;
}

// ✅ Save New Address
async function saveNewAddress() {
  try {
    const payload = { ...newAddress.value };

    const { data } = await http.post("/api/auth/addresses", payload);

    addresses.value = data.addresses; // update saved list
    toast.show("Address added successfully!", "success");

    showAddModal.value = false;
  } catch (err) {
    toast.show("Failed to save address", "error");
  }
}

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


async function setDefaultAddress(id: string) {
  try {
    const { data } = await http.patch(`/api/auth/addresses/${id}/default`);
    addresses.value = data.addresses;
    toast.show("Default address updated", "success");
  } catch {
    toast.show("Failed to set default address", "error");
  }
}


// ✅ Delete Address Modal
const showDeleteModal = ref(false);
const deleteId = ref("");

function openDeleteModal(id: string) {
  deleteId.value = id;
  showDeleteModal.value = true;
}
function closeDeleteModal() {
  showDeleteModal.value = false;
}


async function deleteAddress() {
  try {
    const { data } = await http.delete(`/api/auth/addresses/${deleteId.value}`);
    addresses.value = data.addresses;
    toast.show("Address deleted", "success");
    showDeleteModal.value = false;
  } catch {
    toast.show("Failed to delete address", "error");
  }
}


// ✅ GOOGLE AUTOCOMPLETE
let autocomplete: any = null;


function initGoogleAutocomplete() {
  if (!window.google) return;

  const input = document.getElementById("autocomplete-input") as HTMLInputElement;
  autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: ["address"],
    componentRestrictions: { country: "in" }
  });

  autocomplete.addListener("place_changed", fillAddressFromGoogle);
}


function fillAddressFromGoogle() {
  const place = autocomplete.getPlace();
  if (!place.address_components) return;

  place.address_components.forEach((c: any) => {
    const type = c.types[0];

    if (type === "locality") newAddress.value.city = c.long_name;
    if (type === "administrative_area_level_1") newAddress.value.state = c.long_name;
    if (type === "postal_code") newAddress.value.pincode = c.long_name;
  });

  newAddress.value.addressLine1 = place.formatted_address;
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

// onMounted(loadProfile);

onMounted(() => {
  loadProfile();
  setTimeout(initGoogleAutocomplete, 800)
});
</script>

<template>
  <section class="profile-page">

    <!-- ⭐ PREMIUM PROFILE HEADER -->
    <div class="profile-header glass">
      <div class="avatar">{{ name?.charAt(0)?.toUpperCase() }}</div>

      <div class="profile-info">
        <h1>{{ name }}</h1>
        <p class="email">{{ email }}</p>
        <p v-if="phone" class="phone">📞 {{ phone }}</p>

        <button class="edit-btn" @click="goToEdit">Edit Profile</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- ⭐ Balanced two-column layout -->
    <div v-else class="layout-grid">

      <!-- ✅ LEFT: Saved Addresses -->
      <div class="left">
        <div class="section glass">
          <h2 class="sec-title">Saved Addresses</h2>

          <div class="address-grid">

            <!-- Address Card -->
            <div v-for="a in addresses" :key="a._id" class="address-card">
              
              <div class="card-top">
                <span class="tag">{{ a.tag || "Home" }}</span>

                <label class="default-toggle">
                  <input 
                    type="radio"
                    name="defaultAddress"
                    :checked="a.isDefault"
                    @change="setDefaultAddress(a._id)"
                  />
                  Default
                </label>
              </div>

              <div class="addr-body">
                <p class="name">{{ a.fullName }}</p>
                <p>{{ a.addressLine1 }}</p>
                <p v-if="a.addressLine2">{{ a.addressLine2 }}</p>
                <p>{{ a.city }}, {{ a.state }} - {{ a.pincode }}</p>
                <p class="phone-small">📞 {{ a.phone }}</p>
              </div>

              <div class="addr-actions">
                <button class="btn-sm edit" @click="openEditModal(a)">Edit</button>
                <button class="btn-sm del" @click="openDeleteModal(a._id)">Delete</button>
              </div>
            </div>

            <!-- Add New -->
            <div class="address-card add-card" @click="openAddModal">
              <div class="plus">+</div>
              <p>Add New Address</p>
            </div>

          </div>
        </div>
      </div>

      <!-- ✅ RIGHT: Recent Orders (MAX 3) -->
      <div class="right">
        <div class="section glass">
          <h2 class="sec-title">Recent Orders</h2>

          <div v-if="orders.length === 0" class="empty">No recent orders.</div>

          <div class="order-card" 
               v-for="o in orders" 
               :key="o.orderId"
               @click="router.push('/order-details/' + o.orderId)">

            <div class="order-header">
              <span class="order-id">Order #{{ o.orderId }}</span>
              <span class="order-status">{{ o.status }}</span>
            </div>

            <div class="order-items">
              <div v-for="it in o.items" :key="it.title" class="order-item">
                <img :src="it.image" alt="Product Image" width="50" height="50" />

                <div class="item-content">
                  <p class="item-title">{{ it.title }}</p>
                  <p class="qty">Qty {{ it.qty }}</p>
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

    </div>

    <!-- ✅ Your existing modals remain UNCHANGED -->
    <slot name="modals">
      <!-- ⭐ ADD ADDRESS MODAL -->
      <div v-if="showAddModal" class="modal-backdrop">
        <div class="modal glass">
          <h2>Add Address</h2>
          <div class="modal-grid">
            <div class="field"><label>Full Name</label><input v-model="newAddress.fullName" /></div>
            <div class="field"><label>Phone</label><input v-model="newAddress.phone" /></div>
            <div class="field full"><label>Address Line 1</label><input id="autocomplete-input" v-model="newAddress.addressLine1" /></div>
            <div class="field full"><label>Address Line 2</label><input v-model="newAddress.addressLine2" /></div>
            <div class="field"><label>City</label><input v-model="newAddress.city" /></div>
            <div class="field"><label>State</label><input v-model="newAddress.state" /></div>
            <div class="field"><label>Pincode</label><input v-model="newAddress.pincode" /></div>
            <div class="field"><label>Landmark</label><input v-model="newAddress.landmark" /></div>
            <div class="field"><label>Tag</label><input v-model="newAddress.tag" placeholder="Home / Work" /></div>
          </div>

          <div class="modal-actions">
            <button class="btn primary" @click="saveNewAddress">Save</button>
            <button class="btn ghost" @click="closeAddModal">Cancel</button>
          </div>
        </div>
      </div>

      <!-- ⭐ EDIT ADDRESS MODAL -->
      <div v-if="showModal" class="modal-backdrop">
        <div class="modal glass">
          <h2>Edit Address</h2>
          <div class="modal-grid">
            <div class="field"><label>Full Name</label><input v-model="editData.fullName" /></div>
            <div class="field"><label>Phone</label><input v-model="editData.phone" /></div>
            <div class="field full"><label>Address Line 1</label><input v-model="editData.addressLine1" /></div>
            <div class="field full"><label>Address Line 2</label><input v-model="editData.addressLine2" /></div>
            <div class="field"><label>City</label><input v-model="editData.city" /></div>
            <div class="field"><label>State</label><input v-model="editData.state" /></div>
            <div class="field"><label>Pincode</label><input v-model="editData.pincode" /></div>
            <div class="field"><label>Tag</label><input v-model="editData.tag" /></div>
          </div>

          <div class="modal-actions">
            <button class="btn primary" @click="saveEditedAddress">Save</button>
            <button class="btn ghost" @click="closeModal">Cancel</button>
          </div>
        </div>
      </div>

      <!-- ⭐ DELETE MODAL -->
      <div v-if="showDeleteModal" class="modal-backdrop">
        <div class="modal glass small">
          <h2>Delete Address?</h2>
          <p class="confirm-text">This cannot be undone.</p>

          <div class="modal-actions">
            <button class="btn ghost" @click="closeDeleteModal">Cancel</button>
            <button class="btn danger" @click="deleteAddress">Delete</button>
          </div>
        </div>
      </div>
    </slot>

  </section>
</template>

<style scoped>
.profile-page {
  padding: 32px 26px;
  background: #0b0f14;
  min-height: 100vh;
  color: #e6edf3;
  font-family: "Inter", sans-serif;
}

/* ⭐ PROFILE HEADER */
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  border-radius: 18px;
  margin-bottom: 32px;
}

.avatar {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: #238636;
  display: grid;
  place-items: center;
  color: white;
  font-size: 2.2rem;
  font-weight: 800;
}

.profile-info h1 {
  font-size: 1.9rem;
  font-weight: 700;
}

.email {
  opacity: 0.85;
}

.phone {
  opacity: 0.75;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.edit-btn {
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid #60a5fa;
  color: #60a5fa;
  background: transparent;
  transition: 0.2s;
  margin-top: 5px;
}

.edit-btn:hover {
  background: #60a5fa25;
}

/* ⭐ LAYOUT */
.layout-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 28px;
}

/* ⭐ Section Styles */
.section {
  padding: 22px;
  border-radius: 16px;
}

.sec-title {
  font-size: 1.3rem;
  margin-bottom: 16px;
  font-weight: 700;
}

/* ⭐ ADDRESS GRID */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.address-card {
  padding: 18px;
  border: 1px solid #30363d;
  border-radius: 14px;
  background: #10151c;
  display: flex;
  flex-direction: column;
  min-height: 230px;
}

.card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tag {
  padding: 4px 10px;
  border-radius: 6px;
  background: #238636;
  font-size: 0.8rem;
}

.default-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.7;
  font-size: 0.8rem;
}

.addr-body .name {
  font-weight: 700;
  margin-bottom: 4px;
}

.addr-body p {
  margin: 2px 0;
  opacity: 0.85;
}

.phone-small {
  opacity: 0.6;
  margin-top: 4px;
}

/* ⭐ Address Actions */
.addr-actions {
  margin-top: auto;
  display: flex;
  gap: 10px;
  padding-top: 8px;
}

.btn-sm {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn-sm.edit {
  background: #238636;
  color: white;
}

.btn-sm.del {
  background: #b91c1c;
  color: white;
}

/* ⭐ Add Card */
.add-card {
  border-style: dashed;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.add-card:hover {
  border-color: #60a5fa;
}

.plus {
  font-size: 36px;
  opacity: 0.5;
}

/* ⭐ ORDERS */
.order-card {
  border: 1px solid #30363d;
  padding: 18px;
  border-radius: 14px;
  background: #10151c;
  margin-bottom: 18px;
  cursor: pointer;
  transition: 0.2s;
}

.order-card:hover {
  border-color: #238636;
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.order-status {
  opacity: 0.8;
}

.order-items {
  margin-bottom: 10px;
}

.order-item {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
}

.item-content .item-title {
  font-size: 0.9rem;
  font-weight: 600;

}

.qty {
  font-size: 0.85rem;
  opacity: 0.75;
}

.price {
  margin-left: auto;
  font-weight: 700;
}

.order-total {
  border-top: 1px solid #2e3540;
  padding-top: 10px;
  font-weight: 700;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: grid;
  place-items: center;
  backdrop-filter: blur(5px);
  z-index: 9999;
}

.modal {
  width: min(500px, 92vw);
  background: #11161d;
  padding: 26px;
  border-radius: 16px;
  border: 1px solid #30363d;
  animation: zoomIn .25s ease;
}

@keyframes zoomIn {
  from { transform: scale(.85); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-grid .full {
  grid-column: span 2;
}

.field label {
  font-size: 0.85rem;
  opacity: 0.75;
  margin-bottom: 4px;
}

.field input {
  background: #0b0f14;
  border: 1px solid #30363d;
  padding: 12px;
  border-radius: 10px;
  color: #e6edf3;
  width: 100%;
}

.modal-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn.primary {
  background: #238636;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-weight: 700;
}

.btn.ghost {
  border: 1px solid #4a5568;
  padding: 10px 14px;
  border-radius: 10px;
  color: #9ca3af;
}

.btn.danger {
  background: #b91c1c;
  padding: 10px 14px;
  border-radius: 10px;
  color: white;
}
</style>