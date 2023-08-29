"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = Router;

var _wildcard = require("wildcard");

var _wildcard2 = _interopRequireDefault(_wildcard);

var _utilsMerge = require("utils-merge");

var _utilsMerge2 = _interopRequireDefault(_utilsMerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let proto = {};

function Router() {
    function router(socket, next) {
        router.connect(socket.server, socket, router.next(socket.server, socket));
        socket.use(function (packet, next) {
            router.handle(packet, socket, socket.server);
            next();
        });
        socket.on("disconnect", reason => {
            router.disconnect(socket.server, socket, reason, router.next(socket.server, socket));
        });
        next();
    }

    (0, _utilsMerge2.default)(router, proto);
    return router;
}

proto.handle = function (packet, socket, io) {
    const path = packet[0];
    const last = packet[packet.length - 1];
    const ack = last instanceof Function ? last : undefined;
    const params = ack ? packet.slice(1, packet.length - 1) : packet.slice(1, packet.length);
    const findPath = this.routers && (this.routers.get(path) && path || (0, _wildcard2.default)(path, this.paths)[0]);
    findPath && this.routers.get(findPath)(io, socket, path, params, ack, this.next(socket.server, socket, ack));
};

proto.next = function (io, socket, ack) {
    return err => {
        if (err) {
            this.errorHandler && this.errorHandler(io, socket, err, ack);
        }
    };
};

proto.connect = function (io, socket, next) {
    this.con && this.con(io, socket, next);
};

proto.disconnect = function (io, socket, reason, next) {

    this.dis && this.dis(io, socket, reason, next);
};

proto.use = function (pathOrFunc, func) {
    if (typeof pathOrFunc === "function") {
        this.errorHandler = pathOrFunc;
    } else {
        const path = pathOrFunc;
        if (!this.routers) {
            this.routers = new Map();
            this.paths = [];
        }
        this.paths.push(path);
        this.routers.set(path, func);
    }
    return this;
};

proto.onConnect = function (func) {
    this.con = func;
    return this;
};

proto.onDisconnect = function (func) {
    this.dis = func;
    return this;
};