<template>
    <!-- 1. SVG ClipPath (Tetap di atas) Render raw SVG string secara inline -->
<div v-html="trapesiumSvgRaw" ></div>

    <div class="app-layout" :class="{ 'is-resizing': isResizing }">

        <!-- TOP BAR -->
        <header class="TopBar">
            TopBar
            <button @click="handleLogout" :disabled="loading" class="btn-logout">
                {{ loading ? "Memproses..." : "Logout" }}
            </button>
        </header>

        <!-- BODY -->
        <div class="layout-body" :class="{ 'sidebar-full': isSidebarFullWidth }">

            <!-- SIDE BAR (DIV-2 & DIV-5 Tempat Tabulator) -->
            <aside class="SideBar" ref="sidebarRef" :style="sidebarStyle">
                <div class="sidebar-content">
                    <SideBarTable />
                </div>
            </aside>

            <!-- RESIZE HANDLE -->
            <div v-if="!isSidebarFullWidth" class="resize-handle" :class="{ active: isResizing }"
                title="Drag untuk mengatur lebar. Double-click untuk full width." @pointerdown="startResize"
                @dblclick="toggleSidebarFullWidth">
                <span class="resize-indicator"></span>
            </div>

            <!-- MAIN AREA -->
            <main v-if="!isSidebarFullWidth" class="main-area">
                <div class="ShipmentNo">
                    <label for="col_2" class="label">{{ shipmentColumnTitle }}:</label>
                    <label id="col_2" class="shipment-no-title">
                        {{ SelectedRowStore.selectedRow.value['2'] || '-' }}
                    </label>
                    <label id="col_9" class="shipment-desc-title">
                        {{ SelectedRowStore.selectedRow.value['9'] || '-' }}
                    </label>
                </div>
                <section class="MainContent">
                    <!-- KeepAlive menjaga state komponen agar tidak di-reset saat berpindah tab -->
                    <KeepAlive>
                        <component :is="activeComponent" :key="activeTab" />
                    </KeepAlive>
                </section>

                <nav class="ContentTabs">
                    <button v-for="tab in tabs" :key="tab.id" class="content-tab"
                        :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
                        {{ tab.label }}
                    </button>
                </nav>
            </main>

            <!-- SIDEBAR FULL WIDTH CONTENT -->
            <main v-if="isSidebarFullWidth" class="main-area sidebar-full-content">
                <section class="MainContent">
                    SideBar Full Width
                </section>

                <nav class="ContentTabs">
                    <button v-for="tab in tabs" :key="tab.id" class="content-tab"
                        :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
                        {{ tab.label }}
                    </button>
                </nav>
            </main>

        </div>

        <!-- STATUS BAR -->
        <footer class="StatusBar">
            <span>
                {{ isSidebarFullWidth
                    ? 'Sidebar: Full Width'
                    : `Sidebar Width: ${Math.round(sidebarWidth)}px`
                }}
            </span>

            <button class="status-button" @click="toggleSidebarFullWidth">
                {{ isSidebarFullWidth ? 'Restore Sidebar' : 'Full Width' }}
            </button>
        </footer>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, markRaw } from 'vue'
import trapesiumSvgRaw from '../../assets/trapesium.svg?raw'
import { APP_COLORS } from '../../constants/colors.js'
import SideBarTable from '../../components/Data/SideBarTable.vue'
import POInformation from '../../components/Layouts/SSRPages/PO.vue'
import { SelectedRowStore } from '../../stores/selectedRowStore.js'
import Shipment from '../../components/Layouts/SSRPages/Shipment.vue'
import Dates from '../../components/Layouts/SSRPages/Dates.vue'
import { logout } from '../../api/auth.js'

// ========================================
// REFS & LAYOUT SETTINGS
// ========================================
const sidebarRef = ref(null)
const defaultSidebarWidth = 320 // Disesuaikan agar Tabulator cukup ruang awal
const minSidebarWidth = 150
const maxSidebarWidth = 800

const sidebarWidth = ref(defaultSidebarWidth)
const previousSidebarWidth = ref(defaultSidebarWidth)

const isSidebarFullWidth = ref(false)
const isResizing = ref(false)

let resizeObserver = null

// Computed untuk mengambil Judul Kolom dengan ID '2' secara dinamis dari Store
const shipmentColumnTitle = computed(() => {
    const col = SelectedRowStore.columns.value.find(c => String(c.id) === '2')
    return col ? col.title : 'Shipment No'
})

// ========================================
// TABS
// ========================================
// Dynamic components dikemas dengan markRaw untuk mencegah overhead reaksi Vue
const tabs = ref([
    { id: 1, label: 'Shipment', component: markRaw(Shipment) },
    { id: 2, label: 'PO', component: markRaw(POInformation) },
    { id: 3, label: 'Dates', component: markRaw(Dates) },

])

const activeTab = ref(1)

// Computed untuk memilih komponen aktif berdasarkan tab
const activeComponent = computed(() => {
    const currentTab = tabs.value.find(tab => tab.id === activeTab.value)
    return currentTab ? currentTab.component : markRaw(Shipment)
})

// ========================================
// SIDEBAR STYLE
// ========================================
const sidebarStyle = computed(() => {
    if (isSidebarFullWidth.value) {
        return {
            width: '100%',
            flex: '1 1 100%',
        }
    }

    return {
        width: `${sidebarWidth.value}px`,
        flex: `0 0 ${sidebarWidth.value}px`,
    }
})

// ========================================
// RESIZE SIDEBAR & TABULATOR REDRAW
// ========================================
let startX = 0
let startWidth = 0

function startResize(event) {
    if (isSidebarFullWidth.value) return
    if (event.button !== 0) return

    event.preventDefault()

    isResizing.value = true
    startX = event.clientX
    startWidth = sidebarWidth.value

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('pointermove', resizeSidebar)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)
}

function resizeSidebar(event) {
    if (!isResizing.value) return

    const deltaX = event.clientX - startX

    sidebarWidth.value = Math.min(
        maxSidebarWidth,
        Math.max(minSidebarWidth, startWidth + deltaX)
    )
}

function stopResize() {
    isResizing.value = false

    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    window.removeEventListener('pointermove', resizeSidebar)
    window.removeEventListener('pointerup', stopResize)
    window.removeEventListener('pointercancel', stopResize)
}

function toggleSidebarFullWidth() {
    stopResize()

    if (!isSidebarFullWidth.value) {
        previousSidebarWidth.value = sidebarWidth.value
        isSidebarFullWidth.value = true
    } else {
        isSidebarFullWidth.value = false
        sidebarWidth.value = previousSidebarWidth.value
    }
}

// ========================================
// OBSERVER UNTUK TABULATOR AUTORESIZE
// ========================================
onMounted(() => {
    if (sidebarRef.value) {
        resizeObserver = new ResizeObserver(() => {
            // Memicu event custom agar komponen SideBarTable/Tabulator melakukan redraw
            window.dispatchEvent(new Event('sidebar-resized'))
        })
        resizeObserver.observe(sidebarRef.value)
    }
})

onBeforeUnmount(() => {
    stopResize()
    if (resizeObserver && sidebarRef.value) {
        resizeObserver.unobserve(sidebarRef.value)
    }
})

// ----------HANDLE LOGOUT-------------

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  token: {
    type: String,
    required: true
  }
});
const emit = defineEmits(["logout-success"]);
const loading = ref(false);
const errorMessage = ref("");

async function handleLogout() {
  loading.value = true;
  errorMessage.value = "";

  try {
    if (props.token) {
      await logout(props.token);
    }
  } catch (error) {
    console.error("Logout server gagal:", error);
  } finally {
    sessionStorage.removeItem("authToken");
    loading.value = false;
    emit("logout-success");
  }
}

</script>

<!-- --------------------------------------------------------------------------------->

<style scoped>
/* ========================================
   GLOBAL LAYOUT
======================================== */
.app-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
    font-family: "Courier New", monospace;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
}

.app-layout *,
.app-layout *::before,
.app-layout *::after {
    box-sizing: border-box;
}

/* ========================================
   TOP BAR
======================================== */
.TopBar {
    flex: 0 0 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2px;
    border: 1px solid v-bind('APP_COLORS.borderDefault');
    border-radius: 6px;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
}

/* ========================================
   SHIPMENT NO CONTAINER
======================================== */
.ShipmentNo {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    margin-bottom: 4px;
}
 
.shipment-no-title {
    font-weight: bold;
    font-size: 150%;
    color: v-bind('APP_COLORS.textPrimaryAksen');
}

.shipment-desc-title {
    font-size: 120%;
    font-style: italic;
    color: v-bind('APP_COLORS.textPrimaryAksen');
}



/* ========================================
   MAIN BODY
======================================== */
.layout-body {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    border: 1px none v-bind('APP_COLORS.borderDefault');
    border-radius: 6px;
    margin: 2px;
    overflow: hidden;
}

/* ========================================
   SIDE BAR (MEMBANGKITKAN AUTO FIT TABULATOR)
======================================== */
.SideBar {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    min-width: 0;
    height: 100%;
    /* Overflow diubah ke hidden agar scrollbar ditangani internal oleh Tabulator */
    overflow: hidden;
    border: 1px solid v-bind('APP_COLORS.borderDefault');
    border-radius: 6px;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
    transition: width 0.05s ease-out;
}

.sidebar-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
}

/* ========================================
   RESIZE HANDLE
======================================== */
.resize-handle {
    position: relative;
    z-index: 10;
    flex: 0 0 6px;
    margin: 0 1px;
    cursor: col-resize;
    touch-action: none;
    display: flex;
    justify-content: center;
    align-items: center;
    background: v-bind('APP_COLORS.bgPrimaryGradB');
}

.resize-indicator {
    display: block;
    width: 2px;
    height: 100%;
    background: transparent;
    transition: background 0.15s ease;
}

.resize-handle:hover .resize-indicator,
.resize-handle.active .resize-indicator {
    background: v-bind('APP_COLORS.borderDefault');
}

.resize-handle.active {
    background: #4169c11a;
}

/* ========================================
   MAIN CONTENT AREA
======================================== */
.main-area {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.MainContent {
    display: flex;
    flex: 1 1 0%;
    min-height: 0;
    min-width: 0;
    overflow: auto;
    border: 1px solid v-bind('APP_COLORS.borderDefault');
    border-radius: 6px;
    background: v-bind('APP_COLORS.bgPrimaryGrad');
}

/* ========================================
   CONTENT TABS & SCROLLBAR
======================================== */
.ContentTabs {
    display: flex;
    flex: 0 0 auto;
    align-items: stretch;
    gap: 0;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    filter: drop-shadow(0px 4px 6px v-bind('APP_COLORS.shadowColorNormal'));
    padding-bottom: 4px;
}

/* Kustomisasi Scrollbar Horizontal pada Tabs */
.ContentTabs::-webkit-scrollbar {
    height: 5px;
}

.ContentTabs::-webkit-scrollbar-thumb {
    background: v-bind('APP_COLORS.borderDefault');
    border-radius: 3px;
}

.content-tab {
    position: relative;
    isolation: isolate;
    flex: 0 0 145px;
    height: 32px;
    margin-right: -35px;
    padding: 0 12px;
    border: none;
    background: #b0bdd0;
    color: #ffffff;
    font: inherit;
    cursor: pointer;
    clip-path: url(#trapesium-rounded);
    transition: background 0.15s ease, color 0.15s ease;
}

.content-tab.active {
    background: #344258;
    color: #ffffff;
    z-index: 10;
}

.content-tab:hover {
    filter: brightness(0.94);
}

/* ========================================
   STATUS BAR
======================================== */
.StatusBar {
    display: flex;
    flex: 0 0 30px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 12px;
    border-top: 1px solid #d1d5db;
    background: #d8dadd;
    font-size: 12px;
}

.status-button {
    padding: 3px 8px;
    border: 1px solid #9ca3af;
    border-radius: 3px;
    background: #ffffff;
    color: #111827;
    font: inherit;
    cursor: pointer;
}

.status-button:hover {
    background: #e5e7eb;
}

/* ========================================
   FULL WIDTH SIDEBAR MODE
======================================== */
.layout-body.sidebar-full {
    display: flex;
}

.sidebar-full .SideBar {
    width: 100%;
}

.sidebar-full-content {
    display: none;
}

/* ========================================
   RESIZING STATE
======================================== */
.is-resizing .SideBar {
    transition: none;
}

.is-resizing {
    cursor: col-resize;
}

/* Matikan pointer-events pada isi sidebar saat drag berlangsung */
.app-layout.is-resizing .SideBar {
    pointer-events: none !important;
    user-select: none !important;
    transition: none !important;
}

/* ========================================
   RESPONSIVE
======================================== */
@media (max-width: 600px) {
    .TopBar {
        flex-basis: 65px;
        margin: 10px 10px 12px;
    }

    .layout-body {
        margin: 0 10px;
    }

    .resize-handle {
        flex-basis: 12px;
        width: 12px;
    }

    .content-tab {
        flex-basis: 110px;
    }
}
</style>