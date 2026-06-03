declare module "helmet" {
  function helmet(options?: helmet.HelmetOptions): import("express").RequestHandler;
  namespace helmet {}
  export = helmet;
}

declare module "pino-http" {
  function pinoHttp(options?: pinoHttp.PinoHttpOptions): import("express").RequestHandler;
  namespace pinoHttp {}
  export = pinoHttp;
}

declare module "express-rate-limit" {
  function rateLimit(options?: expressRateLimit.Options): import("express").RequestHandler;
  namespace rateLimit {}
  export = rateLimit;
}