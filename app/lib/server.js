const net = require("net");
const parseRequest = require("./reqParser");
const buildResponse = require("./resBuilder");
const { engine } = require("./templates");

module.exports = function () {
  const config = {
    registeredRouters: new Map(),
    registeredStaticRouters: new Map(),
    registeredGlobalStaticRouter: null,
    templateEngine: null,
  };

  function registerTemplateEngine(templateEngine, options, renderStrategy) {
    if (config.templateEngine) {
      throw {
        name: "TemplateEngineError",
        message: `Template engine already registered`,
        code: 500,
      };
    } else {
      config.templateEngine = engine(templateEngine)
        .setEngineOptions(options)
        .setRenderStrategy(renderStrategy);
    }
    return this;
  }

  function registerRouter(router) {
    if (config.registeredRouters.has(router.basePath)) {
      throw new Error(
        `Router with base path of ${router.basePath} already exists`
      );
    } else {
      config.registeredRouters.set(router.basePath, router);
    }
    return this;
  }

  function registerStaticRouter(router) {
    if (config.registeredStaticRouters.has(router.basePath)) {
      throw new Error(
        `Static router with base path of ${router.basePath} already exists`
      );
    } else {
      config.registeredStaticRouters.set(router.basePath, router);
    }
    return this;
  }

  function registerGlobalStaticRouter(router) {
    if (config.registeredGlobalStaticRouter) {
      throw new Error(
        `Static router with base path of ${router.basePath} already exists`
      );
    } else {
      config.registeredGlobalStaticRouter = router;
    }
    return this;
  }

  const server = net.createServer((socket) => {
    socket.on("close", () => {
      socket.end();
    });

    socket.on("data", (data) => {
      try {
        const req = parseRequest(data);
        const res = buildResponse(config.templateEngine);

        const isRequestedFile = req.path.full.match(/\.[0-9a-z]+$/i)?.[0];
        if (isRequestedFile) {
          if (config.registeredStaticRouters.has(req.path.base)) {
            socket.write(
              config.registeredStaticRouters
                .get(req.path.base)
                .handleRout(req, res)
            );
          } else if (config.registeredGlobalStaticRouter) {
            socket.write(
              config.registeredGlobalStaticRouter.handleRout(req, res)
            );
          } else
            throw {
              name: "RoutingError",
              message: `Unhandled {${req.path.base}} does not match any static routers`,
              code: 404,
            };
          return;
        }

        if (config.registeredRouters.has(req.path.base)) {
          socket.write(
            config.registeredRouters.get(req.path.base).handleRout(req, res)
          );
        } else
          throw {
            name: "RoutingError",
            message: `Unhandled {${req.path.base}} does not match any registered routers`,
            code: 404,
          };
      } catch (err) {
        console.error(
          `${err.name}: ${err.message}, respond with ${err.code} code`
        );
        socket.write(
          buildResponse()
            .status(err.code || 500)
            .send()
        );
      }
      socket.end();
    });
  });

  return {
    server,
    registerRouter,
    registerStaticRouter,
    registerGlobalStaticRouter,
    registerTemplateEngine,
  };
};
