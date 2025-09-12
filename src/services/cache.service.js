const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 }); // 1min = 60s

const get = (key) => {
  return cache.get(key);
};

const set = (key, value, ttl = 600) => {
  return cache.set(key, value, ttl);
};

const del = (key) => {
  return cache.del(key);
};

module.exports = {
  get,
  set,
  del
};
