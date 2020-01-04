import {
  semi_flatten_input,
  get_vector_of_vectors
} from "../parsers/arguments";

export const EPSILON = 1e-6;

const array_similarity_test = function (list, compFunc) {
  return Array
    .from(Array(list.length - 1))
    .map((_, i) => compFunc(list[0], list[i + 1]))
    .reduce((a, b) => a && b, true);
};
/**
 * @param {...number} a sequence of numbers
 * @returns boolean
 */
export const equivalent_numbers = function (...args) {
  if (args.length === 0) { return false; }
  if (args.length === 1 && args[0] !== undefined) {
    return equivalent_numbers(...args[0]);
  }
  return array_similarity_test(args, (a, b) => Math.abs(a - b) < EPSILON);
};
/**
 * @param {...number[]} compare n number of vectors, requires a consistent dimension
 * @returns boolean
 */
export const equivalent_vectors = function (...args) {
  const list = get_vector_of_vectors(...args);
  if (list.length === 0) { return false; }
  if (list.length === 1 && list[0] !== undefined) {
    return equivalent_vectors(...list[0]);
  }
  const dimension = list[0].length;
  const dim_array = Array.from(Array(dimension));
  return Array
    .from(Array(list.length - 1))
    .map((element, i) => dim_array
      .map((_, di) => Math.abs(list[i][di] - list[i + 1][di]) < EPSILON)
      .reduce((prev, curr) => prev && curr, true))
    .reduce((prev, curr) => prev && curr, true)
  && Array
    .from(Array(list.length - 1))
    .map((_, i) => list[0].length === list[i + 1].length)
    .reduce((a, b) => a && b, true);
};

// export const equivalent_arrays = function (...args) {
//   const list = semi_flatten_input(args);
//   if (list.length === 0) { return false; }
//   if (list.length === 1 && list[0] !== undefined) {
//     return equivalent_vectors(...list[0]);
//   }
//   const dimension = list[0].length;
//   const dim_array = Array.from(Array(dimension));
//   return Array
//     .from(Array(list.length - 1))
//     .map((element, i) => dim_array
//       .map((_, di) => Math.abs(list[i][di] - list[i + 1][di]) < EPSILON)
//       .reduce((prev, curr) => prev && curr, true))
//     .reduce((prev, curr) => prev && curr, true)
//   && Array
//     .from(Array(list.length - 1))
//     .map((_, i) => list[0].length === list[i + 1].length)
//     .reduce((a, b) => a && b, true);
// };

// const equivalent_across_arrays = function (...args) {
//   const list = args;
//   const dimension = list[0].length;
//   const dim_array = Array.from(Array(dimension));
//   return Array
//     .from(Array(list.length - 1))
//     .map((element, i) => dim_array
//       .map((_, di) => Math.abs(list[i][di] - list[i + 1][di]) < EPSILON)
//       .reduce((prev, curr) => prev && curr, true))
//     .reduce((prev, curr) => prev && curr, true)
//   && Array
//     .from(Array(list.length - 1))
//     .map((_, i) => list[0].length === list[i + 1].length)
//     .reduce((a, b) => a && b, true);
// };

/**
 * @param {*} comma-separated sequence of either
 *   1. boolean
 *   2. number
 *   3. arrays of numbers (vectors)
 * @returns boolean
 */
export const equivalent = function (...args) {
  let list = semi_flatten_input(args);
  if (list.length < 1) { return false; }
  const typeofList = typeof list[0];
  // array contains undefined, cannot compare
  if (typeofList === "undefined") { return false; }
  if (list[0].constructor === Array) {
    list = list.map(el => semi_flatten_input(el));
  }
  switch (typeofList) {
    case "number":
      return array_similarity_test(list, (a, b) => Math.abs(a - b) < EPSILON);
    case "boolean":
      return array_similarity_test(list, (a, b) => a === b);
    case "string":
      return array_similarity_test(list, (a, b) => a === b);
    case "object":
      if (list[0].constructor === Array) { return equivalent_vectors(...list); }
      console.warn("comparing array of objects for equivalency by slow JSON.stringify with no epsilon check");
      return array_similarity_test(list, (a, b) => JSON.stringify(a) === JSON.stringify(b));
    default:
      console.warn("incapable of determining comparison method");
      break;
  }
  return false;
};
