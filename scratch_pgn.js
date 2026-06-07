const { parse } = require('@mliebelt/pgn-parser');

const pgn = `[Event "Study: Chapter 1"]
[Site "VCA"]
[Result "1-0"]

1. e4 $1 {comment} *`;

try {
  const result = parse(pgn, { startRule: 'game' });
  console.log("SUCCESS!");
  console.log("Moves JSON:", JSON.stringify(result.moves, null, 2));
} catch (e) {
  console.error("ERROR:", e);
}
