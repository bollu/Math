import {
  get_vector,
  get_matrix2,
  get_matrix4,
  clean_number,
} from "../parsers/arguments";

import {
  make_matrix2_rotation,
  make_matrix2_reflection,
  make_matrix2_inverse,
  multiply_matrices2,
  multiply_vector2_matrix2,
  make_matrix2_scale,
  multiply_matrices4,
  multiply_vector4_matrix4,
  make_matrix4_scale,
  make_matrix4_inverse,
} from "../core/matrix";

import Vector from "./vector";
/**
 * 2D Matrix (2x3) with translation component in x,y
 */
const Matrix2 = function (...args) {
  const matrix = [1, 0, 0, 1, 0, 0];
  const argsMatrix = get_matrix2(args);
  if (argsMatrix !== undefined) {
    argsMatrix.forEach((n, i) => { matrix[i] = n; });
  }

  const inverse = function () {
    return Matrix2(make_matrix2_inverse(matrix)
      .map(n => clean_number(n, 13)));
  };
  const multiply = function (...innerArgs) {
    const m2 = get_matrix2(innerArgs);
    return Matrix2(multiply_matrices2(matrix, m2)
      .map(n => clean_number(n, 13)));
  };
  const transform = function (...innerArgs) {
    const v = get_vector(innerArgs);
    return Vector(multiply_vector2_matrix2(v, matrix)
      .map(n => clean_number(n, 13)));
  };

  Object.defineProperty(matrix, "inverse", { value: inverse });
  Object.defineProperty(matrix, "multiply", { value: multiply });
  Object.defineProperty(matrix, "transform", { value: transform });

  return Object.freeze(matrix);
};

// static methods
Matrix2.makeIdentity = () => Matrix2(1, 0, 0, 1, 0, 0);
Matrix2.makeTranslation = (tx, ty) => Matrix2(1, 0, 0, 1, tx, ty);
Matrix2.makeScale = (...args) => Matrix2(...make_matrix2_scale(...args));
Matrix2.makeRotation = ((angle, origin) => Matrix2(
  make_matrix2_rotation(angle, origin).map(n => clean_number(n, 13))
));
Matrix2.makeReflection = ((vector, origin) => Matrix2(
  make_matrix2_reflection(vector, origin).map(n => clean_number(n, 13))
));


/**
 * 2D Matrix (2x3) with translation component in x,y
 */
const Matrix = function (...args) {
  const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const argsMatrix = get_matrix4(args);
  if (argsMatrix !== undefined) {
    argsMatrix.forEach((n, i) => { matrix[i] = n; });
  }

  const inverse = function () {
    return Matrix(make_matrix4_inverse(matrix)
      .map(n => clean_number(n, 13)));
  };
  const multiply = function (...innerArgs) {
    const m2 = get_matrix4(innerArgs);
    return Matrix(multiply_matrices4(matrix, m2)
      .map(n => clean_number(n, 13)));
  };
  const transform = function (...innerArgs) {
    const v = get_vector(innerArgs);
    return Vector(multiply_vector4_matrix4(v, matrix)
      .map(n => clean_number(n, 13)));
  };

  Object.defineProperty(matrix, "inverse", { value: inverse });
  Object.defineProperty(matrix, "multiply", { value: multiply });
  Object.defineProperty(matrix, "transform", { value: transform });

  return Object.freeze(matrix);
};

// static methods
Matrix.makeIdentity = () => Matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
// todo, is the translation in the right place?
Matrix.makeTranslation = (tx, ty, tz) => Matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
Matrix.makeScale = (...args) => Matrix(...make_matrix4_scale(...args));
// Matrix.makeRotation = ((angle, origin) => Matrix(
//   make_matrix4_rotation(angle, origin).map(n => clean_number(n, 13))
// ));
// Matrix.makeReflection = ((vector, origin) => Matrix(
//   make_matrix4_reflection(vector, origin).map(n => clean_number(n, 13))
// ));

export {
  Matrix2,
  Matrix
};
