// cacheService.js
const NodeCache = require('node-cache');

// Configure the cache:
// stdTTL: (default: 0) the standard time to live in seconds for every generated cache element. 0 = unlimited
// checkperiod: (default: 600) The period in seconds, as a number, used for the automatic delete check interval. 0 = no periodic check.
// useClones: (default: true) en/disables cloning of variables. If true, you'll get a copy of the cached variable. If false you'll get a reference to the cached variable.
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false }); // Cache for 1 hour by default

const CACHE_PREFIXES = {
    GEOCODE: 'geocode_',
    PLACE_DETAILS: 'placedetails_',
    DIRECTIONS: 'directions_',
    FARM_STANDS: 'farmstands_all' // For the main farm stand data
};

function getCacheKey(prefix, identifier) {
    // Normalize and create a consistent key
    return `${prefix}${identifier.toLowerCase().replace(/\s/g, '')}`;
}

function get(key) {
    const value = cache.get(key);
    if (value) {
        console.log(`[Cache HIT] Key: ${key}`);
        return value;
    }
    console.log(`[Cache MISS] Key: ${key}`);
    return null;
}

function set(key, value, ttlSeconds) {
    // ttlSeconds will override stdTTL if provided
    cache.set(key, value, ttlSeconds);
    console.log(`[Cache SET] Key: ${key}, TTL: ${ttlSeconds || cache.options.stdTTL}s`);
}

function del(key) {
    cache.del(key);
    console.log(`[Cache DEL] Key: ${key}`);
}

function flush() {
    cache.flushAll();
    console.log('[Cache FLUSH] All cache flushed.');
}

module.exports = {
    get,
    set,
    del,
    flush,
    getCacheKey,
    CACHE_PREFIXES
};