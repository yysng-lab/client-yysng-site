function createStorage({ driver }) {
  return {
    async get(key) {
      return driver.getItem(key);
    },
    async set(key, value) {
      return driver.setItem(key, value);
    },
    async remove(key) {
      return driver.removeItem(key);
    },
    async has(key) {
      return driver.hasItem(key);
    },
    async getKeys() {
      return driver.getKeys();
    },
    async clear() {
      return driver.clear();
    }
  };
}

const noopDriver = {
  name: "noop",
  options: {},
  async getItem() { return null; },
  async setItem() {},
  async removeItem() {},
  async hasItem() { return false; },
  async getKeys() { return []; },
  async clear() {}
};

export const builtinDrivers = {
  noop: noopDriver
};

export { createStorage };