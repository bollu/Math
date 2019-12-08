import {
  get_line,
  get_matrix2,
  get_two_vec2,
} from "../parsers/arguments";

import {
  normalize,
  average
} from "../core/algebra";

import { multiply_line_matrix2 } from "../core/matrix";
import { limit_line } from "../core/intersection";
import Vector from "./vector";
import Prototype from "./prototypes/line";

const Line = function (...args) {
  const { origin, vector } = get_line(args);

  const transform = function (...innerArgs) {
    const mat = get_matrix2(innerArgs);
    const line = multiply_line_matrix2(origin, vector, mat);
    return Line(line[0], line[1]);
  };

  const proto = Prototype.bind(this);
  const line = Object.create(proto(Line));
  const compare_function = function () { return true; };

  Object.defineProperty(line, "compare_function", { value: compare_function });
  Object.defineProperty(line, "clip_function", { value: limit_line });

  Object.defineProperty(line, "origin", { get: () => Vector(origin) });
  Object.defineProperty(line, "vector", { get: () => Vector(vector) });
  Object.defineProperty(line, "length", { get: () => Infinity });
  Object.defineProperty(line, "transform", { value: transform });

  // return Object.freeze(line);
  return line;
};

// static methods
Line.fromPoints = function (...args) {
  const points = get_two_vec2(args);
  return Line({
    origin: points[0],
    vector: normalize([
      points[1][0] - points[0][0],
      points[1][1] - points[0][1],
    ]),
  });
};

Line.perpendicularBisector = function (...args) {
  const points = get_two_vec2(args);
  const vec = normalize([
    points[1][0] - points[0][0],
    points[1][1] - points[0][1],
  ]);
  return Line({
    origin: average(points[0], points[1]),
    vector: [vec[1], -vec[0]],
    // vector: cross3(vec, [0,0,1])
  });
};

export default Line;
