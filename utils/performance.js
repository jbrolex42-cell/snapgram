export function isDevelopment() {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

export function measurePerformance(
  name,
  callback
) {
  const start = Date.now();

  try {
    const result = callback();

    if (
      result &&
      typeof result.then === "function"
    ) {
      return result.finally(() => {
        if (isDevelopment()) {
          console.log(
            `[PERFORMANCE] ${name}: ${
              Date.now() - start
            }ms`
          );
        }
      });
    }

    if (isDevelopment()) {
      console.log(
        `[PERFORMANCE] ${name}: ${
          Date.now() - start
        }ms`
      );
    }

    return result;
  } catch (error) {
    if (isDevelopment()) {
      console.log(
        `[PERFORMANCE] ${name} FAILED: ${
          Date.now() - start
        }ms`
      );
    }

    throw error;
  }
}

export function debounce(
  callback,
  delay = 300
) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export function throttle(
  callback,
  delay = 300
) {
  let lastCall = 0;
  let timeoutId = null;

  const throttled = (...args) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      lastCall = now;
      callback(...args);
      return;
    }

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCall = Date.now();
        callback(...args);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

export function normalizePagination(
  page = 1,
  limit = 20,
  maxLimit = 50
) {
  const safePage = Math.max(
    1,
    Number(page) || 1
  );

  const safeLimit = Math.min(
    maxLimit,
    Math.max(1, Number(limit) || 20)
  );

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}