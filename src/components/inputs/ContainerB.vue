
<template>
    <fieldset class="wrapper">
        <legend v-if="title" class="wrapper-title">
            {{ title }}
        </legend>

        <slot />
    </fieldset>
</template>

<script setup>
import { APP_COLORS } from '../../constants/colors.js'

defineProps({
    title: {
        type: String,
        default: ''
    }
})
</script>

<style scoped>
.wrapper {
    background: v-bind('APP_COLORS.bgPrimary');
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 0px 10px 0px 10px;

    border: 1px solid rgba(203, 203, 203, 0.408);
    border-radius: 6px;

    min-width: 0;
}

.wrapper-title {
    padding: 0 6px;
    margin-left: 5px;

    font-size: 1.2em;
    font-weight: 300;
    font-style: italic;

    color: inherit;
}
</style>
