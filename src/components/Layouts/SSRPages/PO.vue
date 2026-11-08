<template>
    <div class="layout-body" :class="{ 'sidebar-full': isSidebarFullWidth }">
        <aside class="SideBar" ref="sidebarRef" :style="sidebarStyle">
            <div class="sidebar-content">
                <SideBarTable ref="sideBarTableRef" />
            </div>
        </aside>
    </div>
</template>

<script setup>
import { ref } from 'vue';
const isSidebarFullWidth = ref(false)
const sideBarTableRef = ref(null)
import SideBarTable from '../../../components/Data/SideBarTableRSR.vue';

</script>
