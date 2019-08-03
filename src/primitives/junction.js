import Sector from "./sector";

import { get_vector_of_vectors } from "../parsers/arguments";

import {
  counter_clockwise_angle2,
  counter_clockwise_vector_order
} from "../core/geometry";

/**
 * use static initializers! at bottom of page
 */
const Junction = function (...args) {
  const vectors = get_vector_of_vectors(args);
  if (vectors === undefined) {
    // todo, best practices here
    return undefined;
  }

  const sorted_order = counter_clockwise_vector_order(...vectors);

  const sectors = function () {
    return sorted_order.map(i => vectors[i])
      .map((v, i, arr) => [v, arr[(i + 1) % arr.length]])
      .map(pair => Sector.fromVectors(pair[0], pair[1]));
  };

  const angles = function () {
    return sorted_order.map(i => vectors[i])
      .map((v, i, arr) => [v, arr[(i + 1) % arr.length]])
      .map(pair => counter_clockwise_angle2(pair[0], pair[1]));
  };

  // return Object.freeze( {
  return {
    sectors,
    angles,
    get vectors() { return vectors; },
    // get angles() { return angles(); },
    // get sectors() { return sectors(); },
    get vectorOrder() { return [...sorted_order]; },
  };
};

// this is the default initializer
Junction.fromVectors = function (...vectors) {
  return Junction(...vectors);
};

Junction.fromPoints = function (center, edge_adjacent_points) {
  const vectors = edge_adjacent_points
    .map(p => p.map((_, i) => p[i] - center[i]));
  return Junction.fromVectors(vectors);
};

// this doesn't seem possible, we would need an initial angle for our vector
// (x-axis?) but that's assuming too much.
// Junction.fromSectorAngles = function (...angles) {
// };

export default Junction;
