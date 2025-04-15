/**
    * Check if a line is inside or intersects with a rectangular object
    * @param {number} lineStartX - X coordinate of line start point
    * @param {number} lineStartY - Y coordinate of line start point
    * @param {number} lineEndX - X coordinate of line end point
    * @param {number} lineEndY - Y coordinate of line end point
    * @param {number} rectX - X coordinate of rectangle's top-left corner
    * @param {number} rectY - Y coordinate of rectangle's top-left corner
    * @param {number} rectWidth - Width of the rectangle
    * @param {number} rectHeight - Height of the rectangle
    * @returns {boolean} - True if the line is inside or intersects with the rectangle
    */
export function isLineInObject(lineStartX: number, lineStartY: number, lineEndX: number, lineEndY: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
    // Check if either end of the line is inside the rectangle
    const isStartPointInside = isPointInRectangle(lineStartX, lineStartY, rectX, rectY, rectWidth, rectHeight);
    const isEndPointInside = isPointInRectangle(lineEndX, lineEndY, rectX, rectY, rectWidth, rectHeight);

    // If either point is inside, the line at least partially intersects the rectangle
    if (isStartPointInside || isEndPointInside) {
        return true;
    }

    // Check if the line intersects any of the rectangle's sides
    // Calculate rectangle corners
    const rectRight = rectX + rectWidth;
    const rectBottom = rectY + rectHeight;

    // Check intersection with each of the rectangle's sides
    const intersectsTop = lineIntersectsSegment(lineStartX, lineStartY, lineEndX, lineEndY, rectX, rectY, rectRight, rectY);
    const intersectsRight = lineIntersectsSegment(lineStartX, lineStartY, lineEndX, lineEndY, rectRight, rectY, rectRight, rectBottom);
    const intersectsBottom = lineIntersectsSegment(lineStartX, lineStartY, lineEndX, lineEndY, rectX, rectBottom, rectRight, rectBottom);
    const intersectsLeft = lineIntersectsSegment(lineStartX, lineStartY, lineEndX, lineEndY, rectX, rectY, rectX, rectBottom);

    return intersectsTop || intersectsRight || intersectsBottom || intersectsLeft;
}

/**
 * Helper function to check if a point is inside a rectangle
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @param {number} rectX - X coordinate of rectangle's top-left corner
 * @param {number} rectY - Y coordinate of rectangle's top-left corner
 * @param {number} rectWidth - Width of the rectangle
 * @param {number} rectHeight - Height of the rectangle
 * @returns {boolean} - True if the point is inside the rectangle
 */
function isPointInRectangle(x: number, y: number, rectX: number, rectY: number, rectWidth: number, rectHeight: number): boolean {
    return x >= rectX && x <= rectX + rectWidth && y >= rectY && y <= rectY + rectHeight;
}

/**
 * Helper function to check if two line segments intersect
 * Uses the line intersection formula to determine if two line segments intersect
 * @param {number} x1 - X coordinate of first line's start point
 * @param {number} y1 - Y coordinate of first line's start point
 * @param {number} x2 - X coordinate of first line's end point
 * @param {number} y2 - Y coordinate of first line's end point
 * @param {number} x3 - X coordinate of second line's start point
 * @param {number} y3 - Y coordinate of second line's start point
 * @param {number} x4 - X coordinate of second line's end point
 * @param {number} y4 - Y coordinate of second line's end point
 * @returns {boolean} - True if the line segments intersect
 */
function lineIntersectsSegment(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
    // Calculate the direction vectors
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const dx2 = x4 - x3;
    const dy2 = y4 - y3;

    // Calculate the determinant
    const det = dx1 * dy2 - dy1 * dx2;

    // If determinant is zero, lines are parallel or collinear
    if (det === 0) {
        return false;
    }

    // Calculate parameters for the intersection point
    const t1 = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / det;
    const t2 = ((x3 - x1) * dy1 - (y3 - y1) * dx1) / det;

    // Check if the intersection point is within both line segments
    return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
}