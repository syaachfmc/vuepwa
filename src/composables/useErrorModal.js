
import { ref } from 'vue';

const showError = ref(false);
const errorTitle = ref('Terjadi Kesalahan');
const errorMessage = ref('');
const showRetry = ref(false);
const showRelogin = ref(false);

let retryCallback = null;
let reloginCallback = null;

export function useErrorModal() {
  function openError({
    title = 'Terjadi Kesalahan',
    message = 'Terjadi kesalahan yang tidak diketahui.',
    retry = null,
    relogin = null
  } = {}) {
    errorTitle.value = title;
    errorMessage.value = message;

    retryCallback = retry;
    reloginCallback = relogin;

    showRetry.value = typeof retry === 'function';
    showRelogin.value = typeof relogin === 'function';

    showError.value = true;
  }

  function closeError() {
    showError.value = false;
  }

  function handleRetry() {
    const callback = retryCallback;
    closeError();

    if (callback) callback();
  }

  function handleRelogin() {
    const callback = reloginCallback;
    closeError();

    if (callback) callback();
  }

  return {
    showError,
    errorTitle,
    errorMessage,
    showRetry,
    showRelogin,
    openError,
    closeError,
    handleRetry,
    handleRelogin
  };
}
