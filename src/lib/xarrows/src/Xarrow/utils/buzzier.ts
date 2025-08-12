// Buzier curve calculations

/**
 * Point in 2D space
 */
interface Point2D {
  x: number
  y: number
}

/**
 * Returns a Bezier curve function with 2 control points
 * Bezier with 2 control points function (4 points total):
 * bz = (1−t)^3*p1 + 3(1−t)^2*t*p2 + 3(1−t)*t^2*p3 + t^3*p4
 *
 * @param p1 Starting point value
 * @param p2 First control point value
 * @param p3 Second control point value
 * @param p4 End point value
 * @returns Function that calculates a point on the curve at parameter t
 */
export const bzFunction =
  (p1: number, p2: number, p3: number, p4: number): ((t: number) => number) =>
  (t: number): number =>
    (1 - t) ** 3 * p1 + 3 * (1 - t) ** 2 * t * p2 + 3 * (1 - t) * t ** 2 * p3 + t ** 3 * p4

/**
 * Returns 2 solutions from extrema points for Bezier curve with 2 control points
 *
 * @param p1 Starting point value
 * @param p2 First control point value
 * @param p3 Second control point value
 * @param p4 End point value
 * @returns Array with two extrema points of the Bezier curve
 */
export const buzzierMinSols = (
  p1: number,
  p2: number,
  p3: number,
  p4: number,
): [number, number] => {
  const bz = bzFunction(p1, p2, p3, p4)
  // dt(bz) = -3 p1 (1 - t)^2 + 3 p2 (1 - t)^2 - 6 p2 (1 - t) t + 6 p3 (1 - t) t - 3 p3 t^2 + 3 p4 t^2
  // when p1=(x1,y1),p2=(cpx1,cpy1),p3=(cpx2,cpy2),p4=(x2,y2)
  // then extrema points is when dt(bz) = 0
  // solutions =>  t = ((-6 p1 + 12 p2 - 6 p3) ± sqrt((6 p1 - 12 p2 + 6 p3)^2 - 4 (3 p2 - 3 p1) (-3 p1 + 9 p2 - 9 p3 + 3 p4)))/(2 (-3 p1 + 9 p2 - 9 p3 + 3 p4))  when (p1 + 3 p3!=3 p2 + p4)
  // if we mark A=(-6 p1 + 12 p2 - 6 p3) and B=(6 p1 - 12 p2 + 6 p3)^2 - 4 (3 p2 - 3 p1) (-3 p1 + 9 p2 - 9 p3 + 3 p4)) and C =(2 (-3 p1 + 9 p2 - 9 p3 + 3 p4) then
  // tSol = A ± sqrt(B)
  // then solution we want is: bz(tSol)
  const A = -6 * p1 + 12 * p2 - 6 * p3
  const B =
    (-6 * p1 + 12 * p2 - 6 * p3) ** 2 - 4 * (3 * p2 - 3 * p1) * (-3 * p1 + 9 * p2 - 9 * p3 + 3 * p4)
  const C = 2 * (-3 * p1 + 9 * p2 - 9 * p3 + 3 * p4)

  // Safeguard against division by zero
  if (Math.abs(C) < Number.EPSILON) {
    return [p1, p4] // Return start and end points if C is close to zero
  }

  const sol1 = bz((A + Math.sqrt(Math.max(0, B))) / C)
  const sol2 = bz((A - Math.sqrt(Math.max(0, B))) / C)
  return [sol1, sol2]
}
