/* Geometry (c) Robby Kraft, MIT License */
const EPSILON_LOW  = 3e-6;
const EPSILON      = 1e-10;
const EPSILON_HIGH = 1e-14;

/** clean floating point numbers
 *  example: 15.0000000000000002 into 15
 * the adjustable epsilon is default 15, Javascripts 16 digit float
 */
function clean_number(num, decimalPlaces = 15) {
	// todo, this fails when num is a string, consider checking
	return (num == null
		? undefined
		: parseFloat(num.toFixed(decimalPlaces)));
}

// all points are array syntax [x,y]

///////////////////////////////////////////////////////////////////////////////
// the following operations neatly generalize for n-dimensions
//
/** @param [number]
 *  @returns [number]
 */
function normalize(v) {
	let m = magnitude(v);
	// todo: do we need to intervene for a divide by 0?
	return v.map(c => c / m);
}

/** @param [number]
 *  @returns number
 */
function magnitude(v) {
	let sum = v
		.map(component => component * component)
		.reduce((prev,curr) => prev + curr);
	return Math.sqrt(sum);
}

/** @param [number]
 *  @returns boolean
 */
function degenerate(v) {
	return Math.abs(v.reduce((a, b) => a + b, 0)) < EPSILON;
}

///////////////////////////////////////////////////////////////////////////////
// these *can* generalize to n-dimensions, but lengths of arguments must match
// if the second argument larger than the first it will ignore leftover components
//
function dot(a, b) {
	return a
		.map((ai,i) => ai * b[i])
		.reduce((prev,curr) => prev + curr, 0);
}

function midpoint(a, b) {
	return a.map((ai,i) => (ai+b[i])*0.5);
}

function equivalent(a, b, epsilon = EPSILON) {
	// rectangular bounds test for fast calculation
	return a
		.map((ai,i) => Math.abs(ai - b[i]) < epsilon)
		reduce((a,b) => a && b, true);
}

function parallel(a, b, epsilon = EPSILON) {
	return 1 - Math.abs(dot(normalize(a), normalize(b))) < epsilon;
}


///////////////////////////////////////////////////////////////////////////////
// everything else that follows is hard-coded to certain dimensions
//

/** There are 2 interior angles between 2 absolute angle measurements, from A to B return the clockwise one
 * @param {number} angle in radians, angle PI/2 is along the +Y axis
 * @returns {number} clockwise interior angle (from a to b) in radians
 */
function clockwise_angle2_radians(a, b) {
	// this is on average 50 to 100 times faster than clockwise_angle2
	while (a < 0) { a += Math.PI*2; }
	while (b < 0) { b += Math.PI*2; }
	var a_b = a - b;
	return (a_b >= 0)
		? a_b
		: Math.PI*2 - (b - a);
}
function counter_clockwise_angle2_radians(a, b) {
	// this is on average 50 to 100 times faster than counter_clockwise_angle2
	while (a < 0) { a += Math.PI*2; }
	while (b < 0) { b += Math.PI*2; }
	var b_a = b - a;
	return (b_a >= 0)
		? b_a
		: Math.PI*2 - (a - b);
}

/** There are 2 angles between 2 vectors, from A to B return the clockwise one.
 * @param {[number, number]} vector
 * @returns {number} clockwise angle (from a to b) in radians
 */
function clockwise_angle2(a, b) {
	var dotProduct = b[0]*a[0] + b[1]*a[1];
	var determinant = b[0]*a[1] - b[1]*a[0];
	var angle = Math.atan2(determinant, dotProduct);
	if (angle < 0) { angle += Math.PI*2; }
	return angle;
}
function counter_clockwise_angle2(a, b) {
	var dotProduct = a[0]*b[0] + a[1]*b[1];
	var determinant = a[0]*b[1] - a[1]*b[0];
	var angle = Math.atan2(determinant, dotProduct);
	if (angle < 0) { angle += Math.PI*2; }
	return angle;
}
/** There are 2 interior angles between 2 vectors, return both, the smaller first
 * @param {[number, number]} vector
 * @returns {[number, number]} 2 angle measurements between vectors
 */
function interior_angles2(a, b) {
	var interior1 = clockwise_angle2(a, b);
	var interior2 = Math.PI*2 - interior1;
	return (interior1 < interior2)
		? [interior1, interior2]
		: [interior2, interior1];
}
/** This bisects 2 vectors, returning both smaller and larger outside angle bisections [small, large]
 * @param {[number, number]} vector
 * @returns {[[number, number],[number, number]]} 2 vectors, the smaller angle first
 */
function bisect_vectors(a, b) {
	let aV = normalize(a);
	let bV = normalize(b);
	let sum = aV.map((_,i) => aV[i] + bV[i]);
	let vecA = normalize( sum );
	let vecB = aV.map((_,i) => -aV[i] + -bV[i]);
	return [vecA, normalize(vecB)];
}

/** This bisects 2 lines
 * @param {[number, number]} all vectors, lines defined by points and vectors
 * @returns [ [number,number], [number,number] ] // line, defined as point, vector, in that order
 */
function bisect_lines2(pointA, vectorA, pointB, vectorB) {
	let denominator = vectorA[0] * vectorB[1] - vectorB[0] * vectorA[1];
	if (Math.abs(denominator) < EPSILON) { /* parallel */
		return [midpoint(pointA, pointB), vectorA.slice()];
	}
	let vectorC = [pointB[0]-pointA[0], pointB[1]-pointA[1]];
	// var numerator = vectorC[0] * vectorB[1] - vectorB[0] * vectorC[1];
	let numerator = (pointB[0]-pointA[0]) * vectorB[1] - vectorB[0] * (pointB[1]-pointA[1]);
	var t = numerator / denominator;
	let x = pointA[0] + vectorA[0]*t;
	let y = pointA[1] + vectorA[1]*t;
	var bisect = bisect_vectors(vectorA, vectorB);
	bisects[1] = [ bisects[1][1], -bisects[1][0] ];
	// swap to make smaller interior angle first
	if (Math.abs(cross2(vectorA, bisects[1])) <
	   Math.abs(cross2(vectorA, bisects[0]))) {
		var swap = bisects[0];
		bisects[0] = bisects[1];
		bisects[1] = swap;
	}
	return bisects.map((el) => [[x,y], el]);
}

// todo: check the implementation above, if it works, delete this:

// export function bisect_lines2(pointA, vectorA, pointB, vectorB) {
// 	if (parallel(vectorA, vectorB)) {
// 		return [midpoint(pointA, pointB), vectorA.slice()];
// 	} else{
// 		var inter = Intersection.line_line(pointA, vectorA, pointB, vectorB);
// 		var bisect = bisect_vectors(vectorA, vectorB);
// 		bisects[1] = [ bisects[1][1], -bisects[1][0] ];
// 		// swap to make smaller interior angle first
// 		if (Math.abs(cross2(vectorA, bisects[1])) <
// 		   Math.abs(cross2(vectorA, bisects[0]))) {
// 			var swap = bisects[0];
// 			bisects[0] = bisects[1];
// 			bisects[1] = swap;
// 		}
// 		return bisects.map((el) => [inter, el]);
// 	}
// }

/** apply a matrix transform on a point */
function multiply_vector2_matrix2(vector, matrix) {
	return [ vector[0] * matrix[0] + vector[1] * matrix[2] + matrix[4],
	         vector[0] * matrix[1] + vector[1] * matrix[3] + matrix[5] ];
}

/** 
 * These all standardize a row-column order
 */
function make_matrix2_reflection(vector, origin) {
	// the line of reflection passes through origin, runs along vector
	let angle = Math.atan2(vector[1], vector[0]);
	let cosAngle = Math.cos(angle);
	let sinAngle = Math.sin(angle);
	let _cosAngle = Math.cos(-angle);
	let _sinAngle = Math.sin(-angle);
	let a = cosAngle *  _cosAngle +  sinAngle * _sinAngle;
	let b = cosAngle * -_sinAngle +  sinAngle * _cosAngle;
	let c = sinAngle *  _cosAngle + -cosAngle * _sinAngle;
	let d = sinAngle * -_sinAngle + -cosAngle * _cosAngle;
	let tx = origin[0] + a * -origin[0] + -origin[1] * c;
	let ty = origin[1] + b * -origin[0] + -origin[1] * d;
	return [a, b, c, d, tx, ty];
}
function make_matrix2_rotation(angle, origin) {
	var a = Math.cos(angle);
	var b = Math.sin(angle);
	var c = -Math.sin(angle);
	var d = Math.cos(angle);
	var tx = (origin != null) ? origin[0] : 0;
	var ty = (origin != null) ? origin[1] : 0;
	return [a, b, c, d, tx, ty];
}
function make_matrix2_inverse(m) {
	var det = m[0] * m[3] - m[1] * m[2];
	if (!det || isNaN(det) || !isFinite(m[4]) || !isFinite(m[5])) { return undefined; }
	return [
		m[3]/det,
		-m[1]/det,
		-m[2]/det,
		m[0]/det, 
		(m[2]*m[5] - m[3]*m[4])/det,
		(m[1]*m[4] - m[0]*m[5])/det
	];
}
function multiply_matrices2(m1, m2) {
	let a = m1[0] * m2[0] + m1[2] * m2[1];
	let c = m1[0] * m2[2] + m1[2] * m2[3];
	let tx = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
	let b = m1[1] * m2[0] + m1[3] * m2[1];
	let d = m1[1] * m2[2] + m1[3] * m2[3];
	let ty = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
	return [a, b, c, d, tx, ty];
}

// these are all hard-coded to certain vector lengths
// the length is specified by the number at the end of the function name

function cross2(a, b) {
	return [ a[0]*b[1], a[1]*b[0] ];
}

function cross3(a, b) {
	return [
		a[1]*b[2] - a[2]*b[1],
		a[0]*b[2] - a[2]*b[0],
		a[0]*b[1] - a[1]*b[0]
	];
}

function distance2(a, b) {
	return Math.sqrt(
		Math.pow(a[0] - b[0], 2) +
		Math.pow(a[1] - b[1], 2)
	);
}

function distance3(a, b) {
	return Math.sqrt(
		Math.pow(a[0] - b[0], 2) +
		Math.pow(a[1] - b[1], 2) +
		Math.pow(a[2] - b[2], 2)
	);
}

// need to test:
// do two polygons overlap if they share a point in common? share an edge?

var algebra = /*#__PURE__*/Object.freeze({
	normalize: normalize,
	magnitude: magnitude,
	degenerate: degenerate,
	dot: dot,
	midpoint: midpoint,
	equivalent: equivalent,
	parallel: parallel,
	clockwise_angle2_radians: clockwise_angle2_radians,
	counter_clockwise_angle2_radians: counter_clockwise_angle2_radians,
	clockwise_angle2: clockwise_angle2,
	counter_clockwise_angle2: counter_clockwise_angle2,
	interior_angles2: interior_angles2,
	bisect_vectors: bisect_vectors,
	bisect_lines2: bisect_lines2,
	multiply_vector2_matrix2: multiply_vector2_matrix2,
	make_matrix2_reflection: make_matrix2_reflection,
	make_matrix2_rotation: make_matrix2_rotation,
	make_matrix2_inverse: make_matrix2_inverse,
	multiply_matrices2: multiply_matrices2,
	cross2: cross2,
	cross3: cross3,
	distance2: distance2,
	distance3: distance3
});

/** 
 *  all intersection functions are inclusive and return true if 
 *  intersection lies directly on an edge's endpoint. to exclude
 *  endpoints, use "exclusive" functions
 */

function equivalent2(a, b, epsilon = EPSILON) {
	return Math.abs(a[0]-b[0]) < epsilon && Math.abs(a[1]-b[1]) < epsilon;
}


function line_line(aPt, aVec, bPt, bVec, epsilon) {
	return vector_intersection(aPt, aVec, bPt, bVec, line_line_comp, epsilon);
}
function line_ray(linePt, lineVec, rayPt, rayVec, epsilon) {
	return vector_intersection(linePt, lineVec, rayPt, rayVec, line_ray_comp, epsilon);
}
function line_edge(point, vec, edge0, edge1, epsilon) {
	let edgeVec = [edge1[0]-edge0[0], edge1[1]-edge0[1]];
	return vector_intersection(point, vec, edge0, edgeVec, line_edge_comp, epsilon);
}
function ray_ray(aPt, aVec, bPt, bVec, epsilon) {
	return vector_intersection(aPt, aVec, bPt, bVec, ray_ray_comp, epsilon);
}
function ray_edge(rayPt, rayVec, edge0, edge1, epsilon) {
	let edgeVec = [edge1[0]-edge0[0], edge1[1]-edge0[1]];
	return vector_intersection(rayPt, rayVec, edge0, edgeVec, ray_edge_comp, epsilon);
}
function edge_edge(a0, a1, b0, b1, epsilon) {
	let aVec = [a1[0]-a0[0], a1[1]-a0[1]];
	let bVec = [b1[0]-b0[0], b1[1]-b0[1]];
	return vector_intersection(a0, aVec, b0, bVec, edge_edge_comp, epsilon);
}

function line_edge_exclusive(point, vec, edge0, edge1) {
	let edgeVec = [edge1[0]-edge0[0], edge1[1]-edge0[1]];
	let x = vector_intersection(point, vec, edge0, edgeVec, line_edge_comp);
	if (x == null) { return undefined; }
	if (equivalent2(x, edge0) || equivalent2(x, edge1)) {
		return undefined;
	}
	return x;
}

/** comparison functions for a generalized vector intersection function */
const line_line_comp = function() { return true; };
const line_ray_comp = function(t0, t1, epsilon = EPSILON) {
	return t1 >= -epsilon;
};
const line_edge_comp = function(t0, t1, epsilon = EPSILON) {
	return t1 >= -epsilon && t1 <= 1+epsilon;
};
const ray_ray_comp = function(t0, t1, epsilon = EPSILON) {
	return t0 >= -epsilon && t1 >= -epsilon;
};
const ray_edge_comp = function(t0, t1, epsilon = EPSILON) {
	return t0 >= -epsilon && t1 >= -epsilon && t1 <= 1+epsilon;
};
const edge_edge_comp = function(t0, t1, epsilon = EPSILON) {
	return t0 >= -epsilon && t0 <= 1+epsilon &&
	       t1 >= -epsilon && t1 <= 1+epsilon;
};


/** 
 * the generalized vector intersection function
 * requires a compFunction to describe valid bounds checking 
 * line always returns true, ray is true for t > 0, edge must be between 0 < t < 1
*/
var vector_intersection = function(aPt, aVec, bPt, bVec, compFunction, epsilon = EPSILON) {
	function det(a,b) { return a[0] * b[1] - b[0] * a[1]; }
	var denominator0 = det(aVec, bVec);
	var denominator1 = -denominator0;
	if (Math.abs(denominator0) < epsilon) { return undefined; } /* parallel */
	var numerator0 = det([bPt[0]-aPt[0], bPt[1]-aPt[1]], bVec);
	var numerator1 = det([aPt[0]-bPt[0], aPt[1]-bPt[1]], aVec);
	var t0 = numerator0 / denominator0;
	var t1 = numerator1 / denominator1;
	if (compFunction(t0, t1, epsilon)) {
		return [aPt[0] + aVec[0]*t0, aPt[1] + aVec[1]*t0];
	}
};



/** 
 *  Boolean tests
 *  collinearity, overlap, contains
 */


/** is a point collinear to a line, within an epsilon */
function point_on_line(linePoint, lineVector, point, epsilon = EPSILON) {
	let pointPoint = [point[0] - linePoint[0], point[1] - linePoint[1]];
	let cross = pointPoint[0]*lineVector[1] - pointPoint[1]*lineVector[0];
	return Math.abs(cross) < epsilon;
}

/** is a point collinear to an edge, between endpoints, within an epsilon */
function point_on_edge(edge0, edge1, point, epsilon = EPSILON) {
	// distance between endpoints A,B should be equal to point->A + point->B
	let dEdge = Math.sqrt(Math.pow(edge0[0]-edge1[0],2) +
	                      Math.pow(edge0[1]-edge1[1],2));
	let dP0 = Math.sqrt(Math.pow(point[0]-edge0[0],2) +
	                    Math.pow(point[1]-edge0[1],2));
	let dP1 = Math.sqrt(Math.pow(point[0]-edge1[0],2) +
	                    Math.pow(point[1]-edge1[1],2));
	return Math.abs(dEdge - dP0 - dP1) < epsilon;
}


/**
 * Tests whether or not a point is contained inside a polygon.
 * @returns {boolean} whether the point is inside the polygon or not
 * @example
 * var isInside = point_in_poly(polygonPoints, [0.5, 0.5])
 */
function point_in_poly(poly, point, epsilon = EPSILON) {
	// W. Randolph Franklin https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
	let isInside = false;
	for(let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		if ( (poly[i][1] > point[1]) != (poly[j][1] > point[1]) &&
		point[0] < (poly[j][0] - poly[i][0]) * (point[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0] ) {
			isInside = !isInside;
		}
	}
	return isInside;
}

/** is a point inside of a convex polygon? 
 * including along the boundary within epsilon 
 *
 * @param poly is an array of points [ [x,y], [x,y]...]
 * @returns {boolean} true if point is inside polygon
 */
function point_in_convex_poly(poly, point, epsilon = EPSILON) {
	if (poly == undefined || !(poly.length > 0)) { return false; }
	return poly.map( (p,i,arr) => {
		let nextP = arr[(i+1)%arr.length];
		let a = [ nextP[0]-p[0], nextP[1]-p[1] ];
		let b = [ point[0]-p[0], point[1]-p[1] ];
		return a[0] * b[1] - a[1] * b[0] > -epsilon;
	}).map((s,i,arr) => s == arr[0]).reduce((prev,curr) => prev && curr, true)
}

/** do two convex polygons overlap one another */
function convex_polygons_overlap(ps1, ps2) {
	// convert array of points into edges [point, nextPoint]
	let e1 = ps1.map((p,i,arr) => [p, arr[(i+1)%arr.length]] );
	let e2 = ps2.map((p,i,arr) => [p, arr[(i+1)%arr.length]] );
	for (let i = 0; i < e1.length; i++) {
		for (let j = 0; j < e2.length; j++) {
			if (edge_edge(e1[i][0], e1[i][1], e2[j][0], e2[j][1]) != undefined) {
				return true;
			}
		}
	}
	if (point_in_convex_poly(ps1, ps2[0])) { return true; }
	if (point_in_convex_poly(ps2, ps1[0])) { return true; }
	return false;
}

/** 
 *  Clipping operations
 *  
 */

/** clip an infinite line in a polygon, returns an edge or undefined if no intersection */
function clip_line_in_convex_poly(poly, linePoint, lineVector) {
	let intersections = poly
		.map((p,i,arr) => [p, arr[(i+1)%arr.length]] ) // poly points into edge pairs
		.map(el => line_edge(linePoint, lineVector, el[0], el[1]))
		.filter(el => el != null);
	switch (intersections.length) {
	case 0: return undefined;
	case 1: return [intersections[0], intersections[0]]; // degenerate edge
	case 2: return intersections;
	default:
	// special case: line intersects directly on a poly point (2 edges, same point)
	//  filter to unique points by [x,y] comparison.
		for (let i = 1; i < intersections.length; i++) {
			if ( !equivalent2(intersections[0], intersections[i])) {
				return [intersections[0], intersections[i]];
			}
		}
	}
}

function clip_ray_in_convex_poly(poly, linePoint, lineVector) {
	var intersections = poly
		.map((p,i,arr) => [p, arr[(i+1)%arr.length]] ) // poly points into edge pairs
		.map(el => ray_edge(linePoint, lineVector, el[0], el[1]))
		.filter(el => el != null);
	switch (intersections.length) {
	case 0: return undefined;
	case 1: return [linePoint, intersections[0]];
	case 2: return intersections;
	// default: throw "clipping ray in a convex polygon resulting in 3 or more points";
	default:
		for (let i = 1; i < intersections.length; i++) {
			if ( !equivalent2(intersections[0], intersections[i])) {
				return [intersections[0], intersections[i]];
			}
		}
	}
}

function clip_edge_in_convex_poly(poly, edgeA, edgeB) {
	let intersections = poly
		.map((p,i,arr) => [p, arr[(i+1)%arr.length]] ) // poly points into edge pairs
		.map(el => edge_edge(edgeA, edgeB, el[0], el[1]))
		.filter(el => el != null);
	// more efficient if we make sure these are unique
	for (var i = 0; i < intersections.length; i++) {
		for (var j = intersections.length-1; j > i; j--) {
			if (equivalent2(intersections[i], intersections[j])) {
				intersections.splice(j, 1);
			}
		}
	}
	let aInside = point_in_convex_poly(edgeA, poly);
	switch (intersections.length) {
		case 0: return ( aInside 
			? [[...edgeA], [...edgeB]] 
			: undefined );
		case 1: return ( aInside 
			? [[...edgeA], intersections[0]] 
			: [[...edgeB], intersections[0]] );
		case 2: return intersections;
		default: throw "clipping ray in a convex polygon resulting in 3 or more points";
	}
}


function intersection_circle_line(center, radius, p0, p1) {
	var r_squared =  Math.pow(radius, 2);
	var x1 = p0[0] - center[0];
	var y1 = p0[1] - center[1];
	var x2 = p1[0] - center[0];
	var y2 = p1[1] - center[1];
	var dx = x2 - x1;
	var dy = y2 - y1;
	var dr_squared = dx*dx + dy*dy;
	var D = x1*y2 - x2*y1;
	function sgn(x) { if (x < 0) {return -1;} return 1; }
	var x1 = (D*dy + sgn(dy)*dx*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var x2 = (D*dy - sgn(dy)*dx*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var y1 = (-D*dx + Math.abs(dy)*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	var y2 = (-D*dx - Math.abs(dy)*Math.sqrt(r_squared*dr_squared - (D*D)))/(dr_squared);
	let x1NaN = isNaN(x1);
	let x2NaN = isNaN(x2);
	if (!x1NaN && !x2NaN) {
		return [
			[x1 + center[0], y1 + center[1]],
			[x2 + center[0], y2 + center[1]]
		];
	}
	if (x1NaN && x2NaN) { return undefined; }
	if (!x1NaN) {
		return [ [x1 + center[0], y1 + center[1]] ];
	}
	if (!x2NaN) {
		return [ [x2 + center[0], y2 + center[1]] ];
	}
}

var intersection = /*#__PURE__*/Object.freeze({
	line_line: line_line,
	line_ray: line_ray,
	line_edge: line_edge,
	ray_ray: ray_ray,
	ray_edge: ray_edge,
	edge_edge: edge_edge,
	line_edge_exclusive: line_edge_exclusive,
	point_on_line: point_on_line,
	point_on_edge: point_on_edge,
	point_in_poly: point_in_poly,
	point_in_convex_poly: point_in_convex_poly,
	convex_polygons_overlap: convex_polygons_overlap,
	clip_line_in_convex_poly: clip_line_in_convex_poly,
	clip_ray_in_convex_poly: clip_ray_in_convex_poly,
	clip_edge_in_convex_poly: clip_edge_in_convex_poly,
	intersection_circle_line: intersection_circle_line
});

function convex_hull(points, include_collinear = false, epsilon = EPSILON_HIGH) {
	// # points in the convex hull before escaping function
	var INFINITE_LOOP = 10000;
	// sort points by y. if ys are equivalent, sort by x
	var sorted = points.slice().sort((a,b) =>
		(Math.abs(a[1]-b[1]) < epsilon
			? a[0] - b[0]
			: a[1] - b[1]));
	var hull = [];
	hull.push(sorted[0]);
	// the current direction the perimeter walker is facing
	var ang = 0;  
	var infiniteLoop = 0;
	do{
		infiniteLoop++;
		var h = hull.length-1;
		var angles = sorted
			// remove all points in the same location from this search
			.filter(el => 
				!( Math.abs(el[0] - hull[h][0]) < epsilon
				&& Math.abs(el[1] - hull[h][1]) < epsilon))
			// sort by angle, setting lowest values next to "ang"
			.map(el => {
				var angle = Math.atan2(hull[h][1] - el[1], hull[h][0] - el[0]);
				while(angle < ang) { angle += Math.PI*2; }
				return {node:el, angle:angle, distance:undefined};
			})  // distance to be set later
			.sort((a,b) => (a.angle < b.angle)?-1:(a.angle > b.angle)?1:0);
		if (angles.length === 0) { return undefined; }
		// narrowest-most right turn
		var rightTurn = angles[0];
		// collect all other points that are collinear along the same ray
		angles = angles.filter(el => Math.abs(rightTurn.angle - el.angle) < epsilon)
		// sort collinear points by their distances from the connecting point
			.map(el => { 
				var distance = Math.sqrt(Math.pow(hull[h][0]-el.node[0], 2) + Math.pow(hull[h][1]-el.node[1], 2));
				el.distance = distance;
				return el;
			})
		// (OPTION 1) exclude all collinear points along the hull 
		.sort((a,b) => (a.distance < b.distance)?1:(a.distance > b.distance)?-1:0);
		// (OPTION 2) include all collinear points along the hull
		// .sort(function(a,b) {return (a.distance < b.distance)?-1:(a.distance > b.distance)?1:0});
		// if the point is already in the convex hull, we've made a loop. we're done
		// if (contains(hull, angles[0].node)) {
		// if (includeCollinear) {
		// 	points.sort(function(a,b) {return (a.distance - b.distance)});
		// } else{
		// 	points.sort(function(a,b) {return b.distance - a.distance});
		// }

		if (hull.filter(el => el === angles[0].node).length > 0) {
			return hull;
		}
		// add point to hull, prepare to loop again
		hull.push(angles[0].node);
		// update walking direction with the angle to the new point
		ang = Math.atan2( hull[h][1] - angles[0].node[1], hull[h][0] - angles[0].node[0]);
	} while(infiniteLoop < INFINITE_LOOP);
	return undefined;
}

function split_convex_polygon(poly, linePoint, lineVector) {
	// todo: should this return undefined if no intersection? 
	//       or the original poly?

	//    point: intersection [x,y] point or null if no intersection
	// at_index: where in the polygon this occurs
	let vertices_intersections = poly.map((v,i) => {
		let intersection = point_on_line(linePoint, lineVector, v);
		return { point: intersection ? v : null, at_index: i };
	}).filter(el => el.point != null);
	let edges_intersections = poly.map((v,i,arr) => {
		let intersection = line_edge_exclusive(linePoint, lineVector, v, arr[(i+1)%arr.length]);
		return { point: intersection, at_index: i };
	}).filter(el => el.point != null);

	// three cases: intersection at 2 edges, 2 points, 1 edge and 1 point
	if (edges_intersections.length == 2) {
		let sorted_edges = edges_intersections.slice()
			.sort((a,b) => a.at_index - b.at_index);

		let face_a = poly
			.slice(sorted_edges[1].at_index+1)
			.concat(poly.slice(0, sorted_edges[0].at_index+1));
		face_a.push(sorted_edges[0].point);
		face_a.push(sorted_edges[1].point);

		let face_b = poly
			.slice(sorted_edges[0].at_index+1, sorted_edges[1].at_index+1);
		face_b.push(sorted_edges[1].point);
		face_b.push(sorted_edges[0].point);
		return [face_a, face_b];
	} else if (edges_intersections.length == 1 && vertices_intersections.length == 1) {
		vertices_intersections[0]["type"] = "v";
		edges_intersections[0]["type"] = "e";
		let sorted_geom = vertices_intersections.concat(edges_intersections)
			.sort((a,b) => a.at_index - b.at_index);

		let face_a = poly.slice(sorted_geom[1].at_index+1)
			.concat(poly.slice(0, sorted_geom[0].at_index+1));
		if (sorted_geom[0].type === "e") { face_a.push(sorted_geom[0].point); }
		face_a.push(sorted_geom[1].point); // todo: if there's a bug, it's here. switch this

		let face_b = poly
			.slice(sorted_geom[0].at_index+1, sorted_geom[1].at_index+1);
		if (sorted_geom[1].type === "e") { face_b.push(sorted_geom[1].point); }
		face_b.push(sorted_geom[0].point); // todo: if there's a bug, it's here. switch this
		return [face_a, face_b];
	} else if (vertices_intersections.length == 2) {
		let sorted_vertices = vertices_intersections.slice()
			.sort((a,b) => a.at_index - b.at_index);
		let face_a = poly
			.slice(sorted_vertices[1].at_index)
			.concat(poly.slice(0, sorted_vertices[0].at_index+1));
		let face_b = poly
			.slice(sorted_vertices[0].at_index, sorted_vertices[1].at_index+1);
		return [face_a, face_b];
	}
	return [poly.slice()];
}

var geometry = /*#__PURE__*/Object.freeze({
	convex_hull: convex_hull,
	split_convex_polygon: split_convex_polygon
});

function axiom1(a, b) {
	// n-dimension
	return [a, a.map((_,i) => b[i] - a[i])];
}
function axiom2(a, b) {
	// 2-dimension
	let mid = midpoint(a, b);
	let vec = a.map((_,i) => b[i] - a[i]);
	return [mid, [vec[1], -vec[0]] ];
}
function axiom3(pointA, vectorA, pointB, vectorB){
	return bisect_lines2(pointA, vectorA, pointB, vectorB);
}
function axiom4(line, point){
	// return new CPLine(this, new M.Line(point, new M.Edge(line).vector().rotate90()));
}
function axiom5(origin, point, line){
	// var radius = Math.sqrt(Math.pow(origin.x - point.x, 2) + Math.pow(origin.y - point.y, 2));
	// var intersections = new M.Circle(origin, radius).intersection(new M.Edge(line).infiniteLine());
	// var lines = [];
	// for(var i = 0; i < intersections.length; i++){ lines.push(this.axiom2(point, intersections[i])); }
	// return lines;
}
function axiom6(){
}
function axiom7(point, ontoLine, perp){
	// var newLine = new M.Line(point, new M.Edge(perp).vector());
	// var intersection = newLine.intersection(new M.Edge(ontoLine).infiniteLine());
	// if(intersection === undefined){ return undefined; }
	// return this.axiom2(point, intersection);
}

var origami = /*#__PURE__*/Object.freeze({
	axiom1: axiom1,
	axiom2: axiom2,
	axiom3: axiom3,
	axiom4: axiom4,
	axiom5: axiom5,
	axiom6: axiom6,
	axiom7: axiom7
});

/** 
 * this searches user-provided inputs for a valid n-dimensional vector 
 * which includes objects {x:, y:}, arrays [x,y], or sequences of numbers
 * 
 * @returns (number[]) array of number components
 *   invalid/no input returns an emptry array
*/
function get_vec() {
	let params = Array.from(arguments);
	if (params.length == 0) { return []; }
	if (params[0].vector != null && params[0].vector.constructor == Array) {
		return params[0].vector; // Vector type
	}
	let arrays = params.filter((param) => param.constructor === Array);
	if (arrays.length >= 1) { return arrays[0]; }
	let numbers = params.filter((param) => !isNaN(param));
	if (numbers.length >= 1) { return numbers; }
	if (!isNaN(params[0].x)) {
		// todo, we are relying on convention here. should 'w' be included?
		// todo: if y is not defined but z is, it will move z to index 1
		return ['x','y','z'].map(c => params[0][c]).filter(a => a != null);
	}
	return [];
}

/** 
 * @returns (number[]) array of number components
 *  invalid/no input returns the identity matrix
*/
function get_matrix() {
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if (params.length == 0) { return [1,0,0,1,0,0]; }
	if (params[0].m != null && params[0].m.constructor == Array) {
		numbers = params[0].m.slice(); // Matrix type
	}
	if (numbers.length == 0 && arrays.length >= 1) { numbers = arrays[0]; }
	if (numbers.length >= 6) { return numbers.slice(0,6); }
	else if (numbers.length >= 4) {
		let m = numbers.slice(0,4);
		m[4] = 0;
		m[5] = 0;
		return m;
	}
	return [1,0,0,1,0,0];
}


/** 
 * @returns [[2,3],[10,11]]
*/
function get_edge() {
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if (params.length == 0) { return undefined; }
	if (!isNaN(params[0]) && numbers.length >= 4) {
		return [
			[params[0], params[1]],
			[params[2], params[3]]
		];
	}
	if (arrays.length > 0) {
		if (arrays.length == 2) {
			return [
				[arrays[0][0], arrays[0][1]],
				[arrays[1][0], arrays[1][1]]
			];
		}
		if (arrays.length == 4) {
			return [
				[arrays[0], arrays[1]],
				[arrays[2], arrays[3]]
			];
		}
	}
}


/** 
 * @returns ({ point:[], vector:[] })
*/
function get_line() {
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if (params.length == 0) { return {vector: [], point: []}; }
	if (!isNaN(params[0]) && numbers.length >= 4) {
		return {
			point: [params[0], params[1]],
			vector: [params[2], params[3]]
		};
	}
	if (arrays.length > 0) {
		if (arrays.length == 2) {
			return {
				point: [arrays[0][0], arrays[0][1]],
				vector: [arrays[1][0], arrays[1][1]]
			};
		}
		if (arrays.length == 4) {
			return {
				point: [arrays[0], arrays[1]],
				vector: [arrays[2], arrays[3]]
			};
		}
	}
	if (params[0].constructor === Object) {
		let vector = [], point = [];
		if (params[0].vector != null)         { vector = get_vec(params[0].vector); }
		else if (params[0].direction != null) { vector = get_vec(params[0].direction); }
		if (params[0].point != null)       { point = get_vec(params[0].point); }
		else if (params[0].origin != null) { point = get_vec(params[0].origin); }
		return {point, vector};
	}
	return {point: [], vector: []};
}

function get_two_vec2() {
	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	let arrays = params.filter((param) => param.constructor === Array);
	if (numbers.length >= 4) {
		return [
			[numbers[0], numbers[1]],
			[numbers[2], numbers[3]]
		];
	}
	if (arrays.length >= 2 && !isNaN(arrays[0][0])) {
		return arrays;
	}
	if (arrays.length == 1 && !isNaN(arrays[0][0][0])) {
		return arrays[0];
	}
}

function get_array_of_vec() {
	let params = Array.from(arguments);
	let arrays = params.filter((param) => param.constructor === Array);
	if (arrays.length == 1 && arrays[0].length > 0 && arrays[0][0].length > 0 && !isNaN(arrays[0][0][0])) {
		return arrays[0];
	}
	if (params[0].constructor === Object) {
		if (params[0].points != null) {
			return params[0].points;
		}
	}
}

/** n-dimensional vector */
function Vector$1() {
	let _v = get_vec(...arguments);

	const normalize$$1 = function() {
		return Vector$1( normalize(_v) );
	};
	const magnitude$$1 = function() {
		return magnitude(_v);
	};
	const dot$$1 = function() {
		let vec = get_vec(...arguments);
		return _v.length > vec.length
			? dot(vec, _v)
			: dot(_v, vec);
	};
	const cross = function() {
		let b = get_vec(...arguments);
		let a = _v.slice();
		if(a[2] == null){ a[2] = 0; }
		if(b[2] == null){ b[2] = 0; }
		return Vector$1( cross3(a, b) );
	};
	const distanceTo = function() {
		let vec = get_vec(...arguments);
		let length = (_v.length < vec.length) ? _v.length : vec.length;
		let sum = Array.from(Array(length))
			.map((_,i) => Math.pow(_v[i] - vec[i], 2))
			.reduce((prev, curr) => prev + curr, 0);
		return Math.sqrt(sum);
	};
	const transform = function() {
		let m = get_matrix(...arguments);
		return Vector$1( multiply_vector2_matrix2(_v, m) );
	};
	const add = function(){
		let vec = get_vec(...arguments);
		return Vector$1( _v.map((v,i) => v + vec[i]) );
	};
	const subtract = function(){
		let vec = get_vec(...arguments);
		return Vector$1( _v.map((v,i) => v - vec[i]) );
	};
	// these are implicitly 2D functions, and will convert the vector into 2D
	const rotateZ = function(angle, origin) {
		var m = make_matrix2_rotation(angle, origin);
		return Vector$1( multiply_vector2_matrix2(_v, m) );
	};
	const rotateZ90 = function() {
		return Vector$1(-_v[1], _v[0]);
	};
	const rotateZ180 = function() {
		return Vector$1(-_v[0], -_v[1]);
	};
	const rotateZ270 = function() {
		return Vector$1(_v[1], -_v[0]);
	};
	const reflect = function() {
		let reflect = get_line(...arguments);
		let m = make_matrix2_reflection(reflect.vector, reflect.point);
		return Vector$1( multiply_vector2_matrix2(_v, m) );
	};
	const lerp = function(vector, pct) {
		let vec = get_vec(vector);
		let inv = 1.0 - pct;
		let length = (_v.length < vec.length) ? _v.length : vec.length;
		let components = Array.from(Array(length))
			.map((_,i) => _v[i] * pct + vec[i] * inv);
		return Vector$1(components);
	};
	const isEquivalent = function(vector) {
		// rect bounding box for now, much cheaper than radius calculation
		let vec = get_vec(vector);
		let sm = (_v.length < vec.length) ? _v : vec;
		let lg = (_v.length < vec.length) ? vec : _v;
		return equivalent(sm, lg);
	};
	const isParallel = function(vector) {
		let vec = get_vec(vector);
		let sm = (_v.length < vec.length) ? _v : vec;
		let lg = (_v.length < vec.length) ? vec : _v;
		return parallel(sm, lg);
	};
	const scale = function(mag) {
		return Vector$1( _v.map(v => v * mag) );
	};
	const midpoint$$1 = function() {
		let vec = get_vec(...arguments);
		let sm = (_v.length < vec.length) ? _v.slice() : vec;
		let lg = (_v.length < vec.length) ? vec : _v.slice();
		for(var i = sm.length; i < lg.length; i++){ sm[i] = 0; }
		return Vector$1(lg.map((_,i) => (sm[i] + lg[i]) * 0.5));
	};
	const bisect = function(vector){
		let vec = get_vec(vector);
		return bisect_vectors(_v, vec);
	};

	return Object.freeze(
		Object.assign({
			normalize: normalize$$1,
			magnitude: magnitude$$1,
			dot: dot$$1,
			cross,
			distanceTo,
			transform,
			add,
			subtract,
			rotateZ,
			rotateZ90,
			rotateZ180,
			rotateZ270,
			reflect,
			lerp,
			isEquivalent,
			isParallel,
			scale,
			midpoint: midpoint$$1,
			bisect,
			get x() { return _v[0]; },
			get y() { return _v[1]; },
			get z() { return _v[2]; },
		}, _v)
	);
}

function Circle(){
	let _origin, _radius;

	let params = Array.from(arguments);
	let numbers = params.filter((param) => !isNaN(param));
	if(numbers.length == 3){
		_origin = numbers.slice(0,2);
		_radius = numbers[2];
	}

	const intersectionLine = function(){
		let line = get_line(...arguments);
		let point2 = [
			line.point[0] + line.vector[0],
			line.point[1] + line.vector[1]
		];
		let intersection = intersection_circle_line(_origin, _radius, line.point, point2);
		return Vector(intersection);
	};

	const intersectionEdge = function(){
		let points = get_two_vec2(...arguments);
		let intersection = intersection_circle_line(_origin, _radius, points[0], points[1]);
		return Vector(intersection);
	};

	return Object.freeze( {
		intersectionLine,
		intersectionEdge,
		get origin() { return _origin; },
		get radius() { return _radius; },
	} );
}

function Polygon() {

	let _points = get_array_of_vec(...arguments);

	/** 
	 * Tests whether or not a point is contained inside a polygon.
	 * @returns {boolean}
	 * @example
	 * var isInside = polygon.contains( [0.5, 0.5] )
	 */
	const contains = function(point) {
		return point_in_poly(_points, point);
	};

	/** Calculates the signed area of a polygon. This requires the polygon be non-intersecting.
	 * @returns {number} the area of the polygon
	 * @example
	 * var area = polygon.signedArea()
	 */
	const signedArea = function() {
		return 0.5 * _points.map((el,i,arr) => {
			var next = arr[(i+1)%arr.length];
			return el[0] * next[1] - next[0] * el[1];
		})
		.reduce((a, b) => a + b, 0);
	};
	/** Calculates the centroid or the center of mass of the polygon.
	 * @returns {XY} the location of the centroid
	 * @example
	 * var centroid = polygon.centroid()
	 */
	const centroid = function() {
		return _points.map((el,i,arr) => {
			var next = arr[(i+1)%arr.length];
			var mag = el[0] * next[1] - next[0] * el[1];
			return Vector$1( (el[0]+next[0])*mag, (el[1]+next[1])*mag );
		})
		.reduce((prev, curr) => prev.add(curr), Vector$1(0,0))
		.scale(1/(6 * signedArea(_points)));
	};
	/** Calculates the center of the bounding box made by the edges of the polygon.
	 * @returns {XY} the location of the center of the bounding box
	 * @example
	 * var boundsCenter = polygon.center()
	 */
	const center = function() {
		// this is not an average / means
		var xMin = Infinity, xMax = 0, yMin = Infinity, yMax = 0;
		_points.forEach(p => {
			if (p[0] > xMax) { xMax = p[0]; }
			if (p[0] < xMin) { xMin = p[0]; }
			if (p[1] > yMax) { yMax = p[1]; }
			if (p[1] < yMin) { yMin = p[1]; }
		});
		return Vector$1( xMin+(xMax-xMin)*0.5, yMin+(yMax-yMin)*0.5 );
	};

	const scale = function(magnitude, centerPoint) {
		if (centerPoint == null) { centerPoint = centroid(); }
		let newPoints = _points.map(p => {
			let vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
			return [centerPoint[0] + vec[0]*magnitude, centerPoint[0] + vec[0]*magnitude];
		});
		return Polygon(newPoints);
	};

	const rotate = function(angle, centerPoint) {
		if (centerPoint == null) { centerPoint = centroid(); }
		let newPoints = _points.map(p => {
			let vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
			let mag = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));
			let a = Math.atan2(vec[1], vec[0]);
			return [
				centerPoint[0] + Math.cos(a+angle) * mag, 
				centerPoint[1] + Math.sin(a+angle) * mag
			];
		});
		return Polygon(newPoints);
	};

	// todo: replace with non-convex
	const clipEdge = function() {
		let edge = get_edge(...arguments);
		return clip_edge_in_convex_poly(_points, edge[0], edge[1]);
	};
	const clipLine = function() {
		let line = get_line(...arguments);
		return clip_line_in_convex_poly(_points, line.point, line.vector);
	};
	const clipRay = function() {
		let line = get_line(...arguments);
		return clip_ray_in_convex_poly(_points, line.point, line.vector);
	};

	return Object.freeze( {
		contains,
		signedArea,
		centroid,
		center,
		scale,
		rotate,
		clipEdge,
		clipLine,
		clipRay,
		get points() { return _points; },
	} );

}


// Polygon.withPoints = function(points) {
// 	var poly = new Polygon();
// 	poly.edges = points.map(function(el,i) {
// 		var nextEl = points[ (i+1)%points.length ];
// 		return new Edge(el, nextEl);
// 	},this);
// 	return poly;
// }
Polygon.regularPolygon = function(sides, x = 0, y = 0, radius = 1) {
	var halfwedge = 2*Math.PI/sides * 0.5;
	var r = radius / Math.cos(halfwedge);
	var points = Array.from(Array(Math.floor(sides))).map((_,i) => {
		var a = -2 * Math.PI * i / sides + halfwedge;
		var px = clean_number(x + r * Math.sin(a), 14);
		var py = clean_number(y + r * Math.cos(a), 14);
		return [px, py]; // align point along Y
	});
	return Polygon(points);
};
Polygon.convexHull = function(points, includeCollinear = false) {
	// validate input
	if (points == null || points.length === 0) { return undefined; }
	let hull = convex_hull(points);
	return Polygon(hull);
};



function ConvexPolygon() {

	let {
		contains,
		signedArea,
		centroid,
		center,
		points
	} = Polygon(...arguments);

	let _points = points;


	// const liesOnEdge = function(p) {
	// 	for(var i = 0; i < this.edges.length; i++) {
	// 		if (this.edges[i].collinear(p)) { return true; }
	// 	}
	// 	return false;
	// }
	const clipEdge = function() {
		let edge = get_edge(...arguments);
		return clip_edge_in_convex_poly(_points, edge[0], edge[1]);
	};
	const clipLine = function() {
		let line = get_line(...arguments);
		return clip_line_in_convex_poly(_points, line.point, line.vector);
	};
	const clipRay = function() {
		let line = get_line(...arguments);
		return clip_ray_in_convex_poly(_points, line.point, line.vector);
	};
	const enclosingRectangle = function() {
		var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		_points.forEach(p => {
			if (p[0] > maxX) { maxX = p[0]; }
			if (p[0] < minX) { minX = p[0]; }
			if (p[1] > maxY) { maxY = p[1]; }
			if (p[1] < minY) { minY = p[1]; }
		});
		return Rect(minX, minY, maxX-minX, maxY-minY);
	};

	const split = function() {
		let line = get_line(...arguments);
		return split_convex_polygon(_points, line.point, line.vector)
			.map(poly => ConvexPolygon(poly));
	};

	const overlaps = function() {
		let points = get_array_of_vec(...arguments);
		return convex_polygons_overlap(_points, points);
	};

	const scale = function(magnitude, centerPoint) {
		if (centerPoint == null) { centerPoint = centroid(); }
		let newPoints = _points.map(p => {
			let vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
			return [centerPoint[0] + vec[0]*magnitude, centerPoint[0] + vec[0]*magnitude];
		});
		return ConvexPolygon(newPoints);
	};

	const rotate = function(angle, centerPoint) {
		if (centerPoint == null) { centerPoint = centroid(); }
		let newPoints = _points.map(p => {
			let vec = [p[0] - centerPoint[0], p[1] - centerPoint[1]];
			let mag = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));
			let a = Math.atan2(vec[1], vec[0]);
			return [
				centerPoint[0] + Math.cos(a+angle) * mag, 
				centerPoint[1] + Math.sin(a+angle) * mag
			];
		});
		return ConvexPolygon(newPoints);
	};

	return Object.freeze( {
		signedArea,
		centroid,
		center,
		contains,
		clipEdge,
		clipLine,
		clipRay,
		enclosingRectangle,
		split,
		overlaps,
		scale,
		rotate,
		get points() { return _points; },
	} );
}

ConvexPolygon.regularPolygon = function(sides, x = 0, y = 0, radius = 1) {
	var halfwedge = 2*Math.PI/sides * 0.5;
	var r = radius / Math.cos(halfwedge);
	var points = Array.from(Array(Math.floor(sides))).map((_,i) => {
		var a = -2 * Math.PI * i / sides + halfwedge;
		var px = clean_number(x + r * Math.sin(a), 14);
		var py = clean_number(y + r * Math.cos(a), 14);
		return [px, py]; // align point along Y
	});
	return ConvexPolygon(points);
};
ConvexPolygon.convexHull = function(points, includeCollinear = false) {
	// validate input
	if (points == null || points.length === 0) { return undefined; }
	let hull = convex_hull(points);
	return ConvexPolygon(hull);
};

/** 
 * 2D Matrix (2x3) with translation component in x,y
 */
function Matrix() {
	let _m = get_matrix(...arguments);

	const inverse = function() {
		return Matrix( make_matrix2_inverse(_m) );
	};
	const multiply = function() {
		let m2 = get_matrix(...arguments);
		return Matrix( multiply_matrices2(_m, m2) );
	};
	const transform = function(){
		let v = get_vec(...arguments);
		return Vector$1( multiply_vector2_matrix2(v, _m) );
	};
	return Object.freeze( {
		inverse,
		multiply,
		transform,
		get m() { return _m; },
	} );
}
// static methods
Matrix.makeIdentity = function() {
	return Matrix(1,0,0,1,0,0);
};
Matrix.makeRotation = function(angle, origin) {
	return Matrix( make_matrix2_rotation(angle, origin) );
};
Matrix.makeReflection = function(vector, origin) {
	return Matrix( make_matrix2_reflection(vector, origin) );
};

function Line() {
	let {point, vector} = get_line(...arguments);

	const isParallel = function() {
		let line = get_line(...arguments);
		return parallel(vector, line.vector);
	};
	const transform = function() {
		let mat = get_matrix(...arguments);
		// todo: a little more elegant of a solution, please
		let norm = normalize(vector);
		let temp = point.map((p,i) => p + norm[i]);
		if(temp == null) { return; }
		var p0 = multiply_vector2_matrix2(point, mat);
		var p1 = multiply_vector2_matrix2(temp, mat);
		return Line.withPoints([p0, p1]);
	};

	return Object.freeze( {
		isParallel,
		transform,
		get vector() { return vector; },
		get point() { return point; },
	} );
}
// static methods
Line.withPoints = function() {
	let points = get_two_vec2(...arguments);
	return Line({
		point: points[0],
		vector: normalize([
			points[1][0] - points[0][0],
			points[1][1] - points[0][1]
		])
	});
};
Line.perpendicularBisector = function() {
	let points = get_two_vec2(...arguments);
	let vec = normalize([
		points[1][0] - points[0][0],
		points[1][1] - points[0][1]
	]);
	return Line({
		point: midpoint(points[0], points[1]),
		vector: [vec[1], -vec[0]]
		// vector: Algebra.cross3(vec, [0,0,1])
	});
};


function Ray() {
	let {point, vector} = get_line(...arguments);

	return Object.freeze( {
		get vector() { return vector; },
		get point() { return point; },
		get origin() { return point; },
	} );
}
// static methods
Ray.withPoints = function() {
	let points = get_two_vec2(...arguments);
	return Ray({
		point: points[0],
		vector: normalize([
			points[1][0] - points[0][0],
			points[1][1] - points[0][1]
		])
	});
};


function Edge() {
	let _endpoints = get_two_vec2(...arguments);

	const vector = function() {
		return Vector$1(
			_endpoints[1][0] - _endpoints[0][0],
			_endpoints[1][1] - _endpoints[0][1]
		);
	};

	const length = function() {
		return Math.sqrt(Math.pow(_endpoints[1][0] - _endpoints[0][0],2)
		               + Math.pow(_endpoints[1][1] - _endpoints[0][1],2));
	};

	const nearestPoint = function() {
		let point = get_vec(...arguments);
		var answer = nearestPointNormalTo(...arguments);
		return (answer == null)
			? Vector$1(_endpoints.map(p => ({
					point: p,
					d: Math.sqrt(Math.pow(p[0] - point[0],2) + Math.pow(p[1] - point[1],2))
				}))
				.sort((a,b) => a.d - b.d)
				.shift()
				.point)
			: answer;
	};
	const nearestPointNormalTo = function() {
		let point = get_vec(...arguments);
		let p = length();
		var u = ((point[0]-_endpoints[0][0]) * (_endpoints[1][0]-_endpoints[0][0])
		       + (point[1]-_endpoints[0][1]) * (_endpoints[1][1]-_endpoints[0][1]))
		       / (Math.pow(p, 2) );
		return (u < 0 || u > 1.0)
			? undefined
			: Vector$1(_endpoints[0][0] + u*(_endpoints[1][0]-_endpoints[0][0]),
		             _endpoints[0][1] + u*(_endpoints[1][1]-_endpoints[0][1]) );
	};

	return Object.freeze( {
		vector,
		length,
		nearestPoint,
		nearestPointNormalTo,
		get endpoints() { return _endpoints; },
	} );
}

/**
 *  Geometry library
 *  The goal of this user-facing library is to type check all arguments for a
 *  likely use case, which might slow runtime by a small fraction.
 *  Use the core library functions for fastest-possible calculations.
 */

// let core = { algebra, geometry, intersection, origami };
let core = { algebra, geometry, intersection, origami, EPSILON_LOW, EPSILON, EPSILON_HIGH, clean_number };

export { core, Vector$1 as Vector, Circle, Polygon, ConvexPolygon, Matrix, Line, Ray, Edge };
