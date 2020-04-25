const math = require("../math");

test("rect", () => {
  expect(true).toBe(true);
});

// // static
// test("fromPoints", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.fromPoints();
// });

// native
test("area", () => {
  const r = math.rect(1, 2, 3, 4);
  expect(r.area()).toBe(3 * 4);
});

test("scale", () => {
  const r = math.rect(1, 2, 3, 4);
  expect(r.scale(2).area()).toBe(3 * 4 * 4);
});

// test("midpoint", () => {
//   const r = math.rect(1, 2, 3, 4);
//   const mid = r.midpoint();
//   expect(mid.x).toBe(1 + 1.5);
//   expect(mid.y).toBe(2 + 2);
// });

test("centroid", () => {
  const r = math.rect(1, 2, 3, 4);
  const centroid = r.centroid();
  expect(centroid.x).toBe(1 + 1.5);
  expect(centroid.y).toBe(2 + 2);
});

test("enclosingRectangle", () => {
  const r = math.rect(1, 2, 3, 4);
  const bounds = r.enclosingRectangle();
  expect(bounds.x).toBe(1);
  expect(bounds.y).toBe(2);
  expect(bounds.width).toBe(3);
  expect(bounds.height).toBe(4);
});

test("contains", () => {
  const r = math.rect(1, 2, 3, 4);
  expect(r.contains(0, 0)).toBe(false);
  expect(r.contains(3, 3)).toBe(true);
});

// test("rotate", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.rotate();
// });

// test("translate", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.translate();
// });

// test("transform", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.transform();
// });

// test("sectors", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.sectors();
// });

// test("nearest", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.nearest();
// });

// test("clipSegment", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.clipSegment();
// });

// test("clipLine", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.clipLine();
// });

// test("clipRay", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.clipRay();
// });

// test("split", () => {
//   const r = math.rect(1, 2, 3, 4);
//   r.split();
// });