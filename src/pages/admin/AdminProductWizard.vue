<script setup lang="ts">
import { ref, computed } from "vue";
import { http } from "@/api/http";
import { useToastStore } from "@/stores/toast";

const toast = useToastStore();

// ✅ Wizard Step 
const step = ref(1);

// ✅ Form Data (Client JSON Structure)
const form = ref({
  id: "",

  title: "",
  description: "",
  category: "",
  price: 0,
  discountPercentage: 0,
  rating: 0,
  stock: 0,
  tags: [] as string[],
  brand: "",
  sku: "",
  weight: 0,

  dimensions: {
    width: 0,
    height: 0,
    depth: 0
  },

  warrantyInformation: "",
  shippingInformation: "",
  availabilityStatus: "",
  reviews: [],
  returnPolicy: "",
  minimumOrderQuantity: 1,

  images: [] as string[],
  imagesText: "",
  thumbnail: "",

  meta: {
    createdAt: new Date(),
    updatedAt: new Date(),
    barcode: "",
    qrCode: ""
  }
});

// ✅ Step Navigation
const nextStep = () => step.value++;
const prevStep = () => step.value--;

// ✅ Validation
const canProceedStep1 = computed(() =>
  form.value.title.length > 2 && form.value.category.length > 1
);

const canProceedStep2 = computed(() =>
  form.value.images.length > 0 && form.value.thumbnail !== ""
);

// ✅ Submit Product (Create)
async function submitProduct() {
  try {
    const res = await http.post("/api/products", form.value);
    toast.show("Product Created Successfully!", "success");
    console.log(res.data);

    step.value = 1;
  } catch (err) {
    toast.show("Error creating product", "error");
  }
}
</script>

<template>
  <section class="wizard-page">

    <!-- ✅ Progress Bar -->
    <div class="wizard-steps">
      <div :class="['step', { active: step >= 1 }]">1. Basic Info</div>
      <div :class="['step', { active: step >= 2 }]">2. Media & Details</div>
      <div :class="['step', { active: step >= 3 }]">3. Shipping & Warranty</div>
      <div :class="['step', { active: step >= 4 }]">4. Confirm</div>
    </div>

    <!-- ✅ STEP 1 — Basic Info -->
    <div v-if="step === 1" class="step-card glass">
      <h2>Basic Product Information</h2>

      <div class="form-grid">
        <div class="field full">
          <label>Title</label>
          <input v-model="form.title" placeholder="Product title" />
        </div>

        <div class="field full">
          <label>Description</label>
          <textarea v-model="form.description"></textarea>
        </div>

        <div class="field">
          <label>Category</label>
          <input v-model="form.category" placeholder="beauty, electronics..." />
        </div>

        <div class="field">
          <label>Brand</label>
          <input v-model="form.brand" />
        </div>

        <div class="field">
          <label>Price</label>
          <input type="number" v-model="form.price" />
        </div>

        <div class="field">
          <label>Discount %</label>
          <input type="number" v-model="form.discountPercentage" />
        </div>

        <div class="field">
          <label>Stock</label>
          <input type="number" v-model="form.stock" />
        </div>

        <div class="field">
          <label>SKU</label>
          <input v-model="form.sku" />
        </div>

      </div>

      <div class="actions">
        <button class="btn next" :disabled="!canProceedStep1" @click="nextStep">Next</button>
      </div>
    </div>

    <!-- ✅ STEP 2 — Media -->
    <div v-if="step === 2" class="step-card glass">
      <h2>Images & Media</h2>

      <div class="form-grid">
        <div class="field full">
          <label>Thumbnail</label>
          <input v-model="form.thumbnail" placeholder="Main preview image URL" />
        </div>

        <div class="field full">
          <label>Images (comma separated)</label>
          <textarea
            v-model="form.imagesText"
            placeholder="https://image1,..."
            @input="form.images = form.imagesText.split(',')"
          ></textarea>
        </div>
      </div>

      <div class="actions space">
        <button class="btn back" @click="prevStep">Back</button>
        <button class="btn next" :disabled="!canProceedStep2" @click="nextStep">Next</button>
      </div>
    </div>

    
    <!-- ✅ STEP 3 — Shipping & Warranty -->
    <div v-if="step === 3" class="step-card glass">
      <h2>Shipping, Warranty & Policies</h2>

      <div class="form-grid">
        <div class="field full">
          <label>Shipping Information</label>
          <input v-model="form.shippingInformation" />
        </div>

        <div class="field full">
          <label>Warranty Information</label>
          <input v-model="form.warrantyInformation" />
        </div>

        <div class="field full">
          <label>Return Policy</label>
          <input v-model="form.returnPolicy" />
        </div>

        <div class="field">
          <label>Availability Status</label>
          <input v-model="form.availabilityStatus" />
        </div>

        <div class="field">
          <label>Min Order Qty</label>
          <input type="number" v-model="form.minimumOrderQuantity" />
        </div>

        <div class="field">
          <label>Weight (gm)</label>
          <input type="number" v-model="form.weight" />
        </div>

        <div class="field">
          <label>Width</label>
          <input type="number" v-model="form.dimensions.width" />
        </div>

        <div class="field">
          <label>Height</label>
          <input type="number" v-model="form.dimensions.height" />
        </div>

        <div class="field">
          <label>Depth</label>
          <input type="number" v-model="form.dimensions.depth" />
        </div>

      </div>

      <div class="actions">
        <button class="btn back" @click="prevStep">Back</button>
        <button class="btn next" @click="nextStep">Next</button>
      </div>
    </div>

    <!-- ✅ STEP 4 — Confirmation -->
    <div v-if="step === 4" class="step-card glass">
      <h2>Review & Submit</h2>

      <p>Check details and click submit to save product.</p>

      <pre class="preview">{{ form }}</pre>

      <div class="actions">
        <button class="btn back" @click="prevStep">Back</button>
        <button class="btn submit" @click="submitProduct">Submit Product</button>
      </div>
    </div>

  </section>
</template>

<style scoped>
.wizard-page {
  padding: 28px;
  min-height: 100vh;
  background: #0b0f14;
  color: #e6edf3;
}

/* Steps */
.wizard-steps {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.step {
  padding: 10px 20px;
  border: 1px solid #30363d;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  opacity: .5;
  font-weight: 600;
  transition: .3s;
}

.step.active {
  opacity: 1;
  background: #238636;
  border-color: #238636;
  color: white;
}

/* Step Containers */
.step-card {
  padding: 24px;
  border-radius: 15px;
  border: 1px solid #30363d;
  background: rgba(13,17,23,.55);
  box-shadow: 0 8px 25px rgba(0,0,0,.35);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.full {
  grid-column: span 2;
}

.field label {
  opacity: .75;
  font-size: .85rem;
  margin-bottom: 4px;
  display: block;
}

.field input,
.field textarea {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #30363d;
  background: #0e141b;
  color: white;
}

/* Buttons */
.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 14px;
}

.btn {
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  border: none;
}

.next {
  background: #238636;
  color: white;
}

.back {
  background: transparent;
  border: 1px solid #3b414b;
  color: #9da7b1;
}

.submit {
  background: #1f6feb;
  color: white;
}

.preview {
  background: #11161d;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid #30363d;
  max-height: 300px;
  overflow-y: auto;
}
</style>