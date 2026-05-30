const plugin = require('nativewind/babel');
console.log('NativeWind Babel export type:', typeof plugin);
if (typeof plugin === 'function') {
    const result = plugin({ cache: () => {} }, {});
    console.log('NativeWind Babel function return keys:', Object.keys(result || {}));
    if (result.plugins) {
        console.log('Inner plugins:', result.plugins.map(p => Array.isArray(p) ? p[0] : p));
    }
}
