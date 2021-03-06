import Constructors from "../constructors";
import {
  subtract,
  distance2,
} from "../../core/algebra";
import {
  point_in_poly,
  overlap_convex_polygons_exclusive,
} from "../../overlap/polygon";
import {
  clip_line_in_convex_poly,
  clip_ray_in_convex_poly_exclusive,
  clip_ray_in_convex_poly_inclusive,
  clip_segment_in_convex_poly_exclusive,
  clip_segment_in_convex_poly_inclusive,
} from "../../clip/polygon";
import { multiply_matrix3_vector3 } from "../../core/matrix3";
import {
  signed_area,
  centroid,
  enclosing_rectangle,
  split_polygon,
  split_convex_polygon,
} from "../../core/geometry";
import {
  get_vector,
  get_matrix_3x4,
  get_line,
  get_segment,
} from "../../arguments/get";
import {
  resize,
  semi_flatten_arrays,
} from "../../arguments/resize";
import * as PolyIntersect from "../../intersection/polygon";
import Intersect from "../../intersection/index";
import {
  nearest_point_on_line,
  nearest_point_on_polygon,
} from "../../core/nearest";

// a polygon is expecting to have these properties:
// this - an array of vectors in [] form
// this.points - same as above
// this.sides - array edge pairs of points
// this.vectors - non-normalized vectors relating to this.sides.

// const makeClip = (e) => {
//   if (e === undefined) { return undefined; }
//   switch (e.length) {
//     case undefined: break;
//     case 1: return Constructors.vector(e);
//     case 2: return Constructors.segment(e);
//     default: return e;
//   }
// };

const makeClip = e => (e === undefined
  ? undefined
  : Constructors.segment(e));

const methods = {
  area: function () {
    return signed_area(this);
  },
  // midpoint: function () { return average(this); },
  centroid: function () {
    return Constructors.vector(centroid(this));
  },
  enclosingRectangle: function () {
    return Constructors.rect(enclosing_rectangle(this));
  },
  contains: function () {
    return point_in_poly(get_vector(arguments), this);
  },
  // scale will return a rect for rectangles, otherwise polygon
  scale: function (magnitude, center = centroid(this)) {
    const newPoints = this
      .map(p => [0, 1].map((_, i) => p[i] - center[i]))
      .map(vec => vec.map((_, i) => center[i] + vec[i] * magnitude));
    return this.constructor.fromPoints(newPoints);
  },
  rotate: function (angle, centerPoint = centroid(this)) {
    const newPoints = this.map((p) => {
      const vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
      const mag = Math.sqrt((vec[0] ** 2) + (vec[1] ** 2));
      const a = Math.atan2(vec[1], vec[0]);
      return [
        centerPoint[0] + Math.cos(a + angle) * mag,
        centerPoint[1] + Math.sin(a + angle) * mag,
      ];
    });
    return Constructors.polygon(newPoints);
  },
  translate: function () {
    const vec = get_vector(...arguments);
    const newPoints = this.map(p => p.map((n, i) => n + vec[i]));
    return this.constructor.fromPoints(newPoints);
  },
  transform: function () {
    const m = get_matrix_3x4(...arguments);
    const newPoints = this
      .map(p => multiply_matrix3_vector3(m, resize(3, p)));
    return Constructors.polygon(newPoints);
  },
  // sectors: function () {
  //   return this.map((p, i, arr) => {
  //     const prev = (i + arr.length - 1) % arr.length;
  //     const next = (i + 1) % arr.length;
  //     const center = p;
  //     const a = arr[prev].map((n, j) => n - center[j]);
  //     const b = arr[next].map((n, j) => n - center[j]);
  //     return Constructors.sector(b, a, center);
  //   });
  // },
  nearest: function () {
    const point = get_vector(...arguments);
    const result = nearest_point_on_polygon(this, point);
    return result === undefined
      ? undefined
      : Object.assign(result, { edge: this.sides[result.i] });
  },
  // todo: non convex too
  overlaps: function () {
    const poly2Points = semi_flatten_arrays(arguments);
    return overlap_convex_polygons_exclusive(this, poly2Points);
  },
  split: function () {
    const line = get_line(...arguments);
    const split_func = this.isConvex ? split_convex_polygon : split_polygon;
    return split_func(this, line.vector, line.origin)
      .map(poly => Constructors.polygon(poly));
  },
  // todo: need non-convex clipping functions returns an array of edges
  intersectLine: function () {
    const line = get_line(...arguments);
    return PolyIntersect.convex_poly_line(this, line.vector, line.origin);
  },
  intersectRay: function () {
    const line = get_line(...arguments);
    return PolyIntersect.convex_poly_ray_exclusive(this, line.vector, line.origin);
  },
  intersectSegment: function () {
    const seg = get_segment(...arguments);
    return PolyIntersect.convex_poly_segment_exclusive(this, seg[0], seg[1]);
  },
  clipLine: function () {
    const line = get_line(...arguments);
    const clip = clip_line_in_convex_poly(this, line.vector, line.origin);
    return makeClip(clip);
  },
  clipRay: function () {
    const ray = get_line(...arguments);
    const clip = clip_ray_in_convex_poly_exclusive(this, ray.vector, ray.origin);
    // const clip = clip_ray_in_convex_poly_inclusive(this, ray.vector, ray.origin);
    return makeClip(clip);
  },
  clipSegment: function () {
    const seg = get_segment(...arguments);
    const clip = clip_segment_in_convex_poly_exclusive(this, seg[0], seg[1]);
    // const clip = clip_segment_in_convex_poly_inclusive(this, seg[0], seg[1]);
    return makeClip(clip);
  },
  svgPath: function () {
    // make every point a Move or Line command, append with a "z" (close path)
    const pre = Array(this.length).fill("L");
    pre[0] = "M";
    return `${this.map((p, i) => `${pre[i]}${p[0]} ${p[1]}`).join("")}z`;
  },
  intersect: function (other) {
    return Intersect(this, other);
  },
};

// todo: a ConvexPolygon ConvexPolygon overlap method that returns
// the boolean space between them as another ConvexPolygon.
// then, generalize for Polygon

// const PolygonProto = () => {};

const PolygonProto = {};
PolygonProto.prototype = Object.create(Array.prototype);
PolygonProto.prototype.constructor = PolygonProto;

Object.keys(methods).forEach((key) => {
  PolygonProto.prototype[key] = methods[key];
});

export default PolygonProto;
