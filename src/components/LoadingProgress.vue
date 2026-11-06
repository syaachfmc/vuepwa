<template>
    <Transition name="loading-fade">
        <div v-if="show" class="loading-overlay">
            <div class="loading-card">
                <div class="loading-header">
                    <span class="loading-spinner"></span>
                    <span class="loading-title">{{ message }}</span>
                </div>

                <div class="progress-track">
                    <div class="progress-bar"></div>
                </div>

                <div class="loading-caption">Please wait...</div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
defineProps({
    show: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        default: 'Loading data'
    }
})
</script>

<style scoped>
.loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;

    display: flex;
    align-items: flex-start;
    justify-content: center;

    padding-top: 25vh;

    background: rgba(90, 90, 90, 0.30);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
}

.loading-card {
    width: 280px;
    padding: 22px 24px;

    background: linear-gradient(145deg,
            #ffffff,
            #f7f7f7,
            #eeeeee);

    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 12px;

    box-shadow:
        0 12px 30px rgba(0, 0, 0, 0.22),
        0 3px 8px rgba(0, 0, 0, 0.12);
}

.loading-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
}

.loading-title {
    font-family: Calibri, sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #444;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #d5d5d5;
    border-top-color: #4776a8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
}

.progress-track {
    width: 100%;
    height: 6px;
    overflow: hidden;
    background: #dcdcdc;
    border-radius: 10px;
}

.progress-bar {
    width: 35%;
    height: 100%;
    background: linear-gradient(90deg, #4776a8, #79a9d4);
    border-radius: 10px;
    animation: progress-move 1.4s ease-in-out infinite;
}

.loading-caption {
    margin-top: 10px;
    text-align: right;
    font-family: Calibri, sans-serif;
    font-size: 12px;
    color: #888;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
    transition: opacity 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
    opacity: 0;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes progress-move {
    0% {
        transform: translateX(-110%);
    }

    100% {
        transform: translateX(310%);
    }
}
</style>