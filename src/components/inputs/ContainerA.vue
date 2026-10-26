<template>
    <div class="wrapper">
        <slot/>
      
    </div>
</template>

<script setup>
 import { APP_COLORS } from '../../constants/colors.js' // Import variabel warna umum

</script>

<style scoped>
    .wrapper{
        background : v-bind('APP_COLORS.bgPrimaryGrad') ;
        display : flex;
        flex-direction:column;
        gap: 5px;
        padding: 5px;
        border-width: 1px;
        border-color: rgba(203, 203, 203, 0.408);
        border-style: solid;
        border-radius: 6px;
    }
</style>