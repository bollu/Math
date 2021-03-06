import { EPSILON } from "../core/equal";
import {
  cross2,
  subtract,
} from "../core/algebra";
import {
  include_l, include_r, include_s,
  exclude_l, exclude_r, exclude_s,
} from "../intersection/lines";

/**
 * lines(
 *   vector for line A,
 *   origin for line A,
 *   vector for line B,
 *   origin for line B
 *   function for line A,
 *   function for line B
 * );
 * 
 * lines, rays, and segments are defined by vector-origin form,
 * and differentiated by the last two function parameters.
 * the input for these functions is (t) which is scaled between 0 and 1
 * along the length of the vector, allowing rays and segments to ignore
 * overlaps beyond their bounds.
 */

/**
 * for example, ray-segment overlap can be tested given a ray (rayVec, rayPt)
 * and a segment defined by points (pt0, pt1) by calling:
 *
 * lines(
 *   rayVec,
 *   rayPt,
 *   subtract(pt1, pt0),
 *   pt0,
 *   include_r,
 *   include_s);
 */

/**
 * the generalized vector intersection function
 * requires a compFunction to describe valid bounds checking
 * line always returns true, ray is true for t > 0, segment must be between 0 < t < 1
*/
export const overlap_lines = (aVec, aPt, bVec, bPt, compA, compB, epsilon = EPSILON) => {
  const denominator0 = cross2(aVec, bVec);
  const denominator1 = -denominator0;
  const numerator0 = cross2(subtract(bPt, aPt), bVec);
  const numerator1 = cross2(subtract(aPt, bPt), aVec);
  if (Math.abs(denominator0) < epsilon) { // parallel
    // todo:
    // if parallel and one point is inside another's vector (two are on top)
    // return true
    // else
    return false;
  }
  const t0 = numerator0 / denominator0;
  const t1 = numerator1 / denominator1;
  return compA(t0, epsilon) && compB(t1, epsilon);
};

export const overlap_line_line_inclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, include_l, include_l, ep);
export const overlap_line_ray_inclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, include_l, include_r, ep);
export const overlap_line_segment_inclusive = (aV, aP, b0, b1, ep = EPSILON) =>
  overlap_lines(aV, aP, subtract(b1, b0), b0, include_l, include_s, ep);
export const overlap_ray_ray_inclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, include_r, include_r, ep);
export const overlap_ray_segment_inclusive = (aV, aP, b0, b1, ep = EPSILON) =>
  overlap_lines(aV, aP, subtract(b1, b0), b0, include_r, include_s, ep);
export const overlap_segment_segment_inclusive = (a0, a1, b0, b1, ep = EPSILON) =>
  overlap_lines(subtract(a1, a0), a0, subtract(b1, b0), b0, include_s, include_s, ep);

export const overlap_line_line_exclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, exclude_l, exclude_l, ep);
export const overlap_line_ray_exclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, exclude_l, exclude_r, ep);
export const overlap_line_segment_exclusive = (aV, aP, b0, b1, ep = EPSILON) =>
  overlap_lines(aV, aP, subtract(b1, b0), b0, exclude_l, exclude_s, ep);
export const overlap_ray_ray_exclusive = (aV, aP, bV, bP, ep = EPSILON) =>
  overlap_lines(aV, aP, bV, bP, exclude_r, exclude_r, ep);
export const overlap_ray_segment_exclusive = (aV, aP, b0, b1, ep = EPSILON) =>
  overlap_lines(aV, aP, subtract(b1, b0), b0, exclude_r, exclude_s, ep);
export const overlap_segment_segment_exclusive = (a0, a1, b0, b1, ep = EPSILON) =>
  overlap_lines(subtract(a1, a0), a0, subtract(b1, b0), b0, exclude_s, exclude_s, ep);
