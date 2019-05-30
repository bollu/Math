import * as Input from "../parse/input";
import * as Geometry from "../core/geometry";
import Vector from "./vector";
import Edge from "./edge";

import Prototype from "./prototypes/polygon";

const Polygon = function (...args) {
  const points = Input.get_array_of_vec(args).map(p => Vector(p));
  // todo, best practices here
  if (points === undefined) { return undefined; }
  const sides = points
    .map((p, i, arr) => [p, arr[(i + 1) % arr.length]])
    .map(ps => Edge(ps[0][0], ps[0][1], ps[1][0], ps[1][1]));

  const polygon = Object.create(Prototype());
  Object.defineProperty(polygon, "points", { get: () => points });
  Object.defineProperty(polygon, "sides", { get: () => sides });
  return polygon;
};

Polygon.regularPolygon = function (sides, x = 0, y = 0, radius = 1) {
  const points = Geometry.make_regular_polygon(sides, x, y, radius);
  return Polygon(points);
};
Polygon.convexHull = function (points, includeCollinear = false) {
  const hull = Geometry.convex_hull(points, includeCollinear);
  return Polygon(hull);
};

export default Polygon;
