const { Chess } = require('chess.js');
const c = new Chess();
console.log('keys:', Object.keys(c));
console.log('proto keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(c)));
console.log('turn field descriptors:', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), 'turn'));
console.log('all properties:', Object.getOwnPropertyNames(c));
console.log('internal turn representation:', c.turn());
c.load('8/8/8/8/8/8/8/8 w - - 0 1');
console.log('turn after loading empty:', c.turn());
