<!-- 
<template>
  <textbox :isDirty="'true'"/>
</template>

<script setup>
  import textbox from './components/textbox.vue';
</script> -->

  <script setup>
  import {ref} from 'vue'
 import SSRLayouts from "./Layouts/SSRLayouts.vue";
 import Dropdown from "./components/Dropdown.vue";

 const ab=ref([1,2])
 </script>
 
 <template>
     <SSRLayouts />
     <!-- <Dropdown
     v-model="w"
     :options="ab"
     />

     <div class="form-group">
      <label>Dropdown Role (Validasi Error):</label>
      <Dropdown
        ref="dropdownRoleRef"
        v-model="formrole"
        :options="ab"
        placeholder="Pilih Role"
        :error="isRoleError"
        errorMessage="Role harus 'Admin'"
        :editable="true"
      />
    </div> -->


 </template>
 
 <style>
 body {
     margin: 0;
 
 }
 </style> 
