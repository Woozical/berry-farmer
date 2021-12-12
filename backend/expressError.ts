/** ExpressError extends normal JS error so we can
 *  add a status when we make an instance of it.
 *
 *  Sub-classes are defined to quickly create errors
 *  corresponding with different HTTP status codes.
 */

export class ExpressError extends Error {
  status: number;
  constructor(message:string, status:number) {
    super();
    this.message = message;
    this.status = status;
  }
}

/** 404 NOT FOUND error. */

export class NotFoundError extends ExpressError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

/** 401 UNAUTHORIZED error. */

export class UnauthorizedError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/** 400 BAD REQUEST error. */

export class BadRequestError extends ExpressError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/** 403 FORBIDDEN error. */

export class ForbiddenError extends ExpressError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

// module.exports = {
//   ExpressError,
//   NotFoundError,
//   UnauthorizedError,
//   BadRequestError,
//   ForbiddenError,
// };