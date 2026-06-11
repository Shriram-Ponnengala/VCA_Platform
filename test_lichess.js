const https = require('https');
https.get('https://explorer.lichess.org/master?fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR%20w%20KQkq%20-%200%201', {
  headers: { 'Accept': 'application/json' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('MASTER API RESPONSE:', data.substring(0, 1000)));
});
