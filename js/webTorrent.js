(function(e) {
  if ("object" == typeof exports && "undefined" != typeof module)
    module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
    var t;
    (t =
      "undefined" == typeof window
        ? "undefined" == typeof global
          ? "undefined" == typeof self
            ? this
            : self
          : global
        : window),
      (t.WebTorrent = e());
  }
})(function() {
  var t = Math.abs,
    n = Math.pow,
    r = Math.floor,
    o = String.fromCharCode,
    a = Math.ceil,
    d = Math.max,
    s = Math.min,
    l;
  return (function() {
    function d(s, e, n) {
      function t(o, i) {
        if (!e[o]) {
          if (!s[o]) {
            var l = "function" == typeof require && require;
            if (!i && l) return l(o, !0);
            if (r) return r(o, !0);
            var c = new Error("Cannot find module '" + o + "'");
            throw ((c.code = "MODULE_NOT_FOUND"), c);
          }
          var a = (e[o] = { exports: {} });
          s[o][0].call(
            a.exports,
            function(e) {
              var r = s[o][1][e];
              return t(r || e);
            },
            a,
            a.exports,
            d,
            s,
            e,
            n
          );
        }
        return e[o].exports;
      }
      for (
        var r = "function" == typeof require && require, o = 0;
        o < n.length;
        o++
      )
        t(n[o]);
      return t;
    }
    return d;
  })()(
    {
      1: [
        function(e, t) {
          const n = e("debug")("webtorrent:file-stream"),
            r = e("readable-stream");
          class o extends r.Readable {
            constructor(e, t) {
              super(t), (this.destroyed = !1), (this._torrent = e._torrent);
              const n = (t && t.start) || 0,
                r = t && t.end && t.end < e.length ? t.end : e.length - 1,
                o = e._torrent.pieceLength;
              (this._startPiece = 0 | ((n + e.offset) / o)),
                (this._endPiece = 0 | ((r + e.offset) / o)),
                (this._piece = this._startPiece),
                (this._offset = n + e.offset - this._startPiece * o),
                (this._missing = r - n + 1),
                (this._reading = !1),
                (this._notifying = !1),
                (this._criticalLength = s(0 | (1048576 / o), 2));
            }
            _read() {
              this._reading || ((this._reading = !0), this._notify());
            }
            _notify() {
              if (!this._reading || 0 === this._missing) return;
              if (!this._torrent.bitfield.get(this._piece))
                return this._torrent.critical(
                  this._piece,
                  this._piece + this._criticalLength
                );
              if (this._notifying) return;
              if (((this._notifying = !0), this._torrent.destroyed))
                return this._destroy(new Error("Torrent removed"));
              const e = this._piece;
              this._torrent.store.get(e, (t, r) => {
                if (((this._notifying = !1), !this.destroyed))
                  return (
                    n(
                      "read %s (length %s) (err %s)",
                      e,
                      r.length,
                      t && t.message
                    ),
                    t
                      ? this._destroy(t)
                      : void (this._offset &&
                          ((r = r.slice(this._offset)), (this._offset = 0)),
                        this._missing < r.length &&
                          (r = r.slice(0, this._missing)),
                        (this._missing -= r.length),
                        n("pushing buffer of length %s", r.length),
                        (this._reading = !1),
                        this.push(r),
                        0 === this._missing && this.push(null))
                  );
              }),
                (this._piece += 1);
            }
            destroy(e) {
              this._destroy(null, e);
            }
            _destroy(e, t) {
              this.destroyed ||
                ((this.destroyed = !0),
                !this._torrent.destroyed &&
                  this._torrent.deselect(this._startPiece, this._endPiece, !0),
                e && this.emit("error", e),
                this.emit("close"),
                t && t());
            }
          }
          t.exports = o;
        },
        { debug: 30, "readable-stream": 85 }
      ],
      2: [
        function(e, t) {
          (function(n) {
            const { EventEmitter: r } = e("events"),
              { PassThrough: o } = e("readable-stream"),
              i = e("end-of-stream"),
              a = e("path"),
              l = e("render-media"),
              c = e("stream-to-blob"),
              u = e("stream-to-blob-url"),
              f = e("stream-with-known-length-to-buffer"),
              p = e("./file-stream");
            class h extends r {
              constructor(e, t) {
                super(),
                  (this._torrent = e),
                  (this._destroyed = !1),
                  (this.name = t.name),
                  (this.path = t.path),
                  (this.length = t.length),
                  (this.offset = t.offset),
                  (this.done = !1);
                const n = t.offset,
                  r = n + t.length - 1;
                (this._startPiece = 0 | (n / this._torrent.pieceLength)),
                  (this._endPiece = 0 | (r / this._torrent.pieceLength)),
                  0 === this.length && ((this.done = !0), this.emit("done"));
              }
              get downloaded() {
                if (!this._torrent.bitfield) return 0;
                const {
                    pieces: e,
                    bitfield: t,
                    pieceLength: n
                  } = this._torrent,
                  { _startPiece: r, _endPiece: o } = this,
                  i = e[r],
                  a = this.offset % n;
                let l = t.get(r) ? n - a : d(n - a - i.missing, 0);
                for (let i = r + 1; i <= o; ++i)
                  if (t.get(i)) l += n;
                  else {
                    const t = e[i];
                    l += n - t.missing;
                  }
                return s(l, this.length);
              }
              get progress() {
                return this.length ? this.downloaded / this.length : 0;
              }
              select(e) {
                0 === this.length ||
                  this._torrent.select(this._startPiece, this._endPiece, e);
              }
              deselect() {
                0 === this.length ||
                  this._torrent.deselect(this._startPiece, this._endPiece, !1);
              }
              createReadStream(e) {
                if (0 === this.length) {
                  const e = new o();
                  return (
                    n.nextTick(() => {
                      e.end();
                    }),
                    e
                  );
                }
                const t = new p(this, e);
                return (
                  this._torrent.select(t._startPiece, t._endPiece, !0, () => {
                    t._notify();
                  }),
                  i(t, () => {
                    this._destroyed ||
                      (!this._torrent.destroyed &&
                        this._torrent.deselect(t._startPiece, t._endPiece, !0));
                  }),
                  t
                );
              }
              getBuffer(e) {
                f(this.createReadStream(), this.length, e);
              }
              getBlob(e) {
                if ("undefined" == typeof window)
                  throw new Error("browser-only method");
                c(this.createReadStream(), this._getMimeType()).then(
                  t => e(null, t),
                  t => e(t)
                );
              }
              getBlobURL(e) {
                if ("undefined" == typeof window)
                  throw new Error("browser-only method");
                u(this.createReadStream(), this._getMimeType()).then(
                  t => e(null, t),
                  t => e(t)
                );
              }
              appendTo(e, t, n) {
                if ("undefined" == typeof window)
                  throw new Error("browser-only method");
                l.append(this, e, t, n);
              }
              renderTo(e, t, n) {
                if ("undefined" == typeof window)
                  throw new Error("browser-only method");
                l.render(this, e, t, n);
              }
              _getMimeType() {
                return l.mime[a.extname(this.name).toLowerCase()];
              }
              _destroy() {
                (this._destroyed = !0), (this._torrent = null);
              }
            }
            t.exports = h;
          }.call(this, e("_process")));
        },
        {
          "./file-stream": 1,
          _process: 61,
          "end-of-stream": 32,
          events: 33,
          path: 59,
          "readable-stream": 85,
          "render-media": 86,
          "stream-to-blob": 104,
          "stream-to-blob-url": 103,
          "stream-with-known-length-to-buffer": 105
        }
      ],
      3: [
        function(e, t, n) {
          const r = e("unordered-array-remove"),
            o = e("debug")("webtorrent:peer"),
            i = e("bittorrent-protocol"),
            a = e("./webconn");
          (n.createWebRTCPeer = (e, t) => {
            const n = new d(e.id, "webrtc");
            return (
              (n.conn = e),
              (n.swarm = t),
              n.conn.connected
                ? n.onConnect()
                : (n.conn.once("connect", () => {
                    n.onConnect();
                  }),
                  n.conn.once("error", e => {
                    n.destroy(e);
                  }),
                  n.startConnectTimeout()),
              n
            );
          }),
            (n.createTCPIncomingPeer = e => {
              const t = `${e.remoteAddress}:${e.remotePort}`,
                n = new d(t, "tcpIncoming");
              return (n.conn = e), (n.addr = t), n.onConnect(), n;
            }),
            (n.createTCPOutgoingPeer = (e, t) => {
              const n = new d(e, "tcpOutgoing");
              return (n.addr = e), (n.swarm = t), n;
            }),
            (n.createWebSeedPeer = (e, t) => {
              const n = new d(e, "webSeed");
              return (n.swarm = t), (n.conn = new a(e, t)), n.onConnect(), n;
            });
          class d {
            constructor(e, t) {
              (this.id = e),
                (this.type = t),
                o("new %s Peer %s", t, e),
                (this.addr = null),
                (this.conn = null),
                (this.swarm = null),
                (this.wire = null),
                (this.connected = !1),
                (this.destroyed = !1),
                (this.timeout = null),
                (this.retries = 0),
                (this.sentHandshake = !1);
            }
            onConnect() {
              if (!this.destroyed) {
                (this.connected = !0),
                  o("Peer %s connected", this.id),
                  clearTimeout(this.connectTimeout);
                const e = this.conn;
                e.once("end", () => {
                  this.destroy();
                }),
                  e.once("close", () => {
                    this.destroy();
                  }),
                  e.once("finish", () => {
                    this.destroy();
                  }),
                  e.once("error", e => {
                    this.destroy(e);
                  });
                const t = (this.wire = new i());
                (t.type = this.type),
                  t.once("end", () => {
                    this.destroy();
                  }),
                  t.once("close", () => {
                    this.destroy();
                  }),
                  t.once("finish", () => {
                    this.destroy();
                  }),
                  t.once("error", e => {
                    this.destroy(e);
                  }),
                  t.once("handshake", (e, t) => {
                    this.onHandshake(e, t);
                  }),
                  this.startHandshakeTimeout(),
                  e.pipe(t).pipe(e),
                  this.swarm && !this.sentHandshake && this.handshake();
              }
            }
            onHandshake(e, t) {
              if (!this.swarm) return;
              if (this.destroyed) return;
              if (this.swarm.destroyed)
                return this.destroy(new Error("swarm already destroyed"));
              if (e !== this.swarm.infoHash)
                return this.destroy(
                  new Error("unexpected handshake info hash for this swarm")
                );
              if (t === this.swarm.peerId)
                return this.destroy(
                  new Error("refusing to connect to ourselves")
                );
              o("Peer %s got handshake %s", this.id, e),
                clearTimeout(this.handshakeTimeout),
                (this.retries = 0);
              let n = this.addr;
              !n &&
                this.conn.remoteAddress &&
                this.conn.remotePort &&
                (n = `${this.conn.remoteAddress}:${this.conn.remotePort}`),
                this.swarm._onWire(this.wire, n);
              this.swarm &&
                !this.swarm.destroyed &&
                (this.sentHandshake || this.handshake());
            }
            handshake() {
              const e = { dht: !this.swarm.private && !!this.swarm.client.dht };
              this.wire.handshake(
                this.swarm.infoHash,
                this.swarm.client.peerId,
                e
              ),
                (this.sentHandshake = !0);
            }
            startConnectTimeout() {
              clearTimeout(this.connectTimeout),
                (this.connectTimeout = setTimeout(
                  () => {
                    this.destroy(new Error("connect timeout"));
                  },
                  "webrtc" === this.type ? 25e3 : 5e3
                )),
                this.connectTimeout.unref && this.connectTimeout.unref();
            }
            startHandshakeTimeout() {
              clearTimeout(this.handshakeTimeout),
                (this.handshakeTimeout = setTimeout(() => {
                  this.destroy(new Error("handshake timeout"));
                }, 25e3)),
                this.handshakeTimeout.unref && this.handshakeTimeout.unref();
            }
            destroy(e) {
              if (this.destroyed) return;
              (this.destroyed = !0),
                (this.connected = !1),
                o("destroy %s (error: %s)", this.id, e && (e.message || e)),
                clearTimeout(this.connectTimeout),
                clearTimeout(this.handshakeTimeout);
              const t = this.swarm,
                n = this.conn,
                i = this.wire;
              (this.swarm = null),
                (this.conn = null),
                (this.wire = null),
                t && i && r(t.wires, t.wires.indexOf(i)),
                n && (n.on("error", () => {}), n.destroy()),
                i && i.destroy(),
                t && t.removePeer(this.id);
            }
          }
        },
        {
          "./webconn": 6,
          "bittorrent-protocol": 14,
          debug: 30,
          "unordered-array-remove": 115
        }
      ],
      4: [
        function(e, t) {
          t.exports = class {
            constructor(e) {
              (this._torrent = e),
                (this._numPieces = e.pieces.length),
                (this._pieces = Array(this._numPieces)),
                (this._onWire = e => {
                  this.recalculate(), this._initWire(e);
                }),
                (this._onWireHave = e => {
                  this._pieces[e] += 1;
                }),
                (this._onWireBitfield = () => {
                  this.recalculate();
                }),
                this._torrent.wires.forEach(e => {
                  this._initWire(e);
                }),
                this._torrent.on("wire", this._onWire),
                this.recalculate();
            }
            getRarestPiece(e) {
              let t = [],
                n = 1 / 0;
              for (let r = 0; r < this._numPieces; ++r) {
                if (e && !e(r)) continue;
                const o = this._pieces[r];
                o === n ? t.push(r) : o < n && ((t = [r]), (n = o));
              }
              return t.length ? t[0 | (Math.random() * t.length)] : -1;
            }
            destroy() {
              this._torrent.removeListener("wire", this._onWire),
                this._torrent.wires.forEach(e => {
                  this._cleanupWireEvents(e);
                }),
                (this._torrent = null),
                (this._pieces = null),
                (this._onWire = null),
                (this._onWireHave = null),
                (this._onWireBitfield = null);
            }
            _initWire(e) {
              (e._onClose = () => {
                this._cleanupWireEvents(e);
                for (let t = 0; t < this._numPieces; ++t)
                  this._pieces[t] -= e.peerPieces.get(t);
              }),
                e.on("have", this._onWireHave),
                e.on("bitfield", this._onWireBitfield),
                e.once("close", e._onClose);
            }
            recalculate() {
              this._pieces.fill(0);
              for (const e of this._torrent.wires)
                for (let t = 0; t < this._numPieces; ++t)
                  this._pieces[t] += e.peerPieces.get(t);
            }
            _cleanupWireEvents(e) {
              e.removeListener("have", this._onWireHave),
                e.removeListener("bitfield", this._onWireBitfield),
                e._onClose && e.removeListener("close", e._onClose),
                (e._onClose = null);
            }
          };
        },
        {}
      ],
      5: [
        function(e, t) {
          (function(n, r) {
            function o(e, t) {
              return 2 + a((t * e.downloadSpeed()) / L.BLOCK_LENGTH);
            }
            function l(e, t, n) {
              return 1 + a((t * e.downloadSpeed()) / n);
            }
            function c(e) {
              return 0 | (Math.random() * e);
            }
            function u() {}
            const f = e("addr-to-ip-port"),
              p = e("bitfield"),
              h = e("chunk-store-stream/write"),
              m = e("debug")("webtorrent:torrent"),
              g = e("torrent-discovery"),
              _ = e("events").EventEmitter,
              b = e("fs"),
              i = e("fs-chunk-store"),
              y = e("simple-get"),
              w = e("immediate-chunk-store"),
              k = e("multistream"),
              E = e("net"),
              x = e("os"),
              v = e("run-parallel"),
              S = e("run-parallel-limit"),
              C = e("parse-torrent"),
              I = e("path"),
              L = e("torrent-piece"),
              T = e("pump"),
              B = e("random-iterate"),
              R = e("simple-sha1"),
              A = e("speedometer"),
              U = e("uniq"),
              P = e("ut_metadata"),
              O = e("ut_pex"),
              N = e("parse-numeric-range"),
              M = e("./file"),
              H = e("./peer"),
              q = e("./rarity-map"),
              D = e("./server"),
              j = 5e3,
              F = 3 * L.BLOCK_LENGTH,
              W = 1,
              z = n.browser ? 1 / 0 : 2,
              V = [1e3, 5e3, 15e3],
              G = e("../package.json").version,
              K = `WebTorrent/${G} (https://webtorrent.io)`;
            let Y;
            try {
              Y = I.join(b.statSync("/tmp") && "/tmp", "webtorrent");
            } catch (e) {
              Y = I.join(
                "function" == typeof x.tmpdir ? x.tmpdir() : "/",
                "webtorrent"
              );
            }
            class X extends _ {
              constructor(e, t, n) {
                super(),
                  (this._debugId = "unknown infohash"),
                  (this.client = t),
                  (this.announce = n.announce),
                  (this.urlList = n.urlList),
                  (this.path = n.path),
                  (this.skipVerify = !!n.skipVerify),
                  (this._store = n.store || i),
                  (this._getAnnounceOpts = n.getAnnounceOpts),
                  (this.strategy = n.strategy || "sequential"),
                  (this.maxWebConns = n.maxWebConns || 4),
                  (this._rechokeNumSlots =
                    !1 === n.uploads || 0 === n.uploads ? 0 : +n.uploads || 10),
                  (this._rechokeOptimisticWire = null),
                  (this._rechokeOptimisticTime = 0),
                  (this._rechokeIntervalId = null),
                  (this.ready = !1),
                  (this.destroyed = !1),
                  (this.paused = !1),
                  (this.done = !1),
                  (this.metadata = null),
                  (this.store = null),
                  (this.files = []),
                  (this.pieces = []),
                  (this._amInterested = !1),
                  (this._selections = []),
                  (this._critical = []),
                  (this.wires = []),
                  (this._queue = []),
                  (this._peers = {}),
                  (this._peersLength = 0),
                  (this.received = 0),
                  (this.uploaded = 0),
                  (this._downloadSpeed = A()),
                  (this._uploadSpeed = A()),
                  (this._servers = []),
                  (this._xsRequests = []),
                  (this._fileModtimes = n.fileModtimes),
                  null !== e && this._onTorrentId(e),
                  this._debug("new torrent");
              }
              get timeRemaining() {
                return this.done
                  ? 0
                  : 0 === this.downloadSpeed
                  ? 1 / 0
                  : 1e3 *
                    ((this.length - this.downloaded) / this.downloadSpeed);
              }
              get downloaded() {
                if (!this.bitfield) return 0;
                let e = 0;
                for (let t = 0, n = this.pieces.length; t < n; ++t)
                  if (this.bitfield.get(t))
                    e += t === n - 1 ? this.lastPieceLength : this.pieceLength;
                  else {
                    const n = this.pieces[t];
                    e += n.length - n.missing;
                  }
                return e;
              }
              get downloadSpeed() {
                return this._downloadSpeed();
              }
              get uploadSpeed() {
                return this._uploadSpeed();
              }
              get progress() {
                return this.length ? this.downloaded / this.length : 0;
              }
              get ratio() {
                return this.uploaded / (this.received || 1);
              }
              get numPeers() {
                return this.wires.length;
              }
              get torrentFileBlobURL() {
                if ("undefined" == typeof window)
                  throw new Error("browser-only property");
                return this.torrentFile
                  ? URL.createObjectURL(
                      new Blob([this.torrentFile], {
                        type: "application/x-bittorrent"
                      })
                    )
                  : null;
              }
              get _numQueued() {
                return (
                  this._queue.length + (this._peersLength - this._numConns)
                );
              }
              get _numConns() {
                let e = 0;
                for (const t in this._peers)
                  this._peers[t].connected && (e += 1);
                return e;
              }
              get swarm() {
                return (
                  console.warn(
                    "WebTorrent: `torrent.swarm` is deprecated. Use `torrent` directly instead."
                  ),
                  this
                );
              }
              _onTorrentId(e) {
                if (this.destroyed) return;
                let t;
                try {
                  t = C(e);
                } catch (e) {}
                t
                  ? ((this.infoHash = t.infoHash),
                    (this._debugId = t.infoHash
                      .toString("hex")
                      .substring(0, 7)),
                    n.nextTick(() => {
                      this.destroyed || this._onParsedTorrent(t);
                    }))
                  : C.remote(e, (e, t) =>
                      this.destroyed
                        ? void 0
                        : e
                        ? this._destroy(e)
                        : void this._onParsedTorrent(t)
                    );
              }
              _onParsedTorrent(e) {
                if (!this.destroyed) {
                  if ((this._processParsedTorrent(e), !this.infoHash))
                    return this._destroy(
                      new Error("Malformed torrent data: No info hash")
                    );
                  (this.path || (this.path = I.join(Y, this.infoHash)),
                  (this._rechokeIntervalId = setInterval(() => {
                    this._rechoke();
                  }, 1e4)),
                  this._rechokeIntervalId.unref &&
                    this._rechokeIntervalId.unref(),
                  this.emit("_infoHash", this.infoHash),
                  !this.destroyed) &&
                    (this.emit("infoHash", this.infoHash),
                    this.destroyed ||
                      (this.client.listening
                        ? this._onListening()
                        : this.client.once("listening", () => {
                            this._onListening();
                          })));
                }
              }
              _processParsedTorrent(e) {
                (this._debugId = e.infoHash.toString("hex").substring(0, 7)),
                  this.announce &&
                    (e.announce = e.announce.concat(this.announce)),
                  this.client.tracker &&
                    r.WEBTORRENT_ANNOUNCE &&
                    !this.private &&
                    (e.announce = e.announce.concat(r.WEBTORRENT_ANNOUNCE)),
                  this.urlList && (e.urlList = e.urlList.concat(this.urlList)),
                  U(e.announce),
                  U(e.urlList),
                  Object.assign(this, e),
                  (this.magnetURI = C.toMagnetURI(e)),
                  (this.torrentFile = C.toTorrentFile(e));
              }
              _onListening() {
                this.destroyed ||
                  (this.info
                    ? this._onMetadata(this)
                    : (this.xs && this._getMetadataFromServer(),
                      this._startDiscovery()));
              }
              _startDiscovery() {
                if (this.discovery || this.destroyed) return;
                let e = this.client.tracker;
                e &&
                  (e = Object.assign({}, this.client.tracker, {
                    getAnnounceOpts: () => {
                      const e = {
                        uploaded: this.uploaded,
                        downloaded: this.downloaded,
                        left: d(this.length - this.downloaded, 0)
                      };
                      return (
                        this.client.tracker.getAnnounceOpts &&
                          Object.assign(
                            e,
                            this.client.tracker.getAnnounceOpts()
                          ),
                        this._getAnnounceOpts &&
                          Object.assign(e, this._getAnnounceOpts()),
                        e
                      );
                    }
                  })),
                  (this.discovery = new g({
                    infoHash: this.infoHash,
                    announce: this.announce,
                    peerId: this.client.peerId,
                    dht: !this.private && this.client.dht,
                    tracker: e,
                    port: this.client.torrentPort,
                    userAgent: K
                  })),
                  this.discovery.on("error", e => {
                    this._destroy(e);
                  }),
                  this.discovery.on("peer", e => {
                    ("string" == typeof e && this.done) || this.addPeer(e);
                  }),
                  this.discovery.on("trackerAnnounce", () => {
                    this.emit("trackerAnnounce"),
                      0 === this.numPeers && this.emit("noPeers", "tracker");
                  }),
                  this.discovery.on("dhtAnnounce", () => {
                    this.emit("dhtAnnounce"),
                      0 === this.numPeers && this.emit("noPeers", "dht");
                  }),
                  this.discovery.on("warning", e => {
                    this.emit("warning", e);
                  });
              }
              _getMetadataFromServer() {
                function e(e, n) {
                  function r(r, o, i) {
                    if (t.destroyed) return n(null);
                    if (t.metadata) return n(null);
                    if (r)
                      return (
                        t.emit(
                          "warning",
                          new Error(`http error from xs param: ${e}`)
                        ),
                        n(null)
                      );
                    if (200 !== o.statusCode)
                      return (
                        t.emit(
                          "warning",
                          new Error(
                            `non-200 status code ${o.statusCode} from xs param: ${e}`
                          )
                        ),
                        n(null)
                      );
                    let a;
                    try {
                      a = C(i);
                    } catch (e) {}
                    return a
                      ? a.infoHash === t.infoHash
                        ? void (t._onMetadata(a), n(null))
                        : (t.emit(
                            "warning",
                            new Error(
                              `got torrent file with incorrect info hash from xs param: ${e}`
                            )
                          ),
                          n(null))
                      : (t.emit(
                          "warning",
                          new Error(
                            `got invalid torrent file from xs param: ${e}`
                          )
                        ),
                        n(null));
                  }
                  if (0 !== e.indexOf("http://") && 0 !== e.indexOf("https://"))
                    return (
                      t.emit(
                        "warning",
                        new Error(`skipping non-http xs param: ${e}`)
                      ),
                      n(null)
                    );
                  let o;
                  try {
                    o = y.concat(
                      { url: e, method: "GET", headers: { "user-agent": K } },
                      r
                    );
                  } catch (r) {
                    return (
                      t.emit(
                        "warning",
                        new Error(`skipping invalid url xs param: ${e}`)
                      ),
                      n(null)
                    );
                  }
                  t._xsRequests.push(o);
                }
                const t = this,
                  n = Array.isArray(this.xs) ? this.xs : [this.xs],
                  r = n.map(t => n => {
                    e(t, n);
                  });
                v(r);
              }
              _onMetadata(e) {
                if (this.metadata || this.destroyed) return;
                this._debug("got metadata"),
                  this._xsRequests.forEach(e => {
                    e.abort();
                  }),
                  (this._xsRequests = []);
                let t;
                if (e && e.infoHash) t = e;
                else
                  try {
                    t = C(e);
                  } catch (e) {
                    return this._destroy(e);
                  }
                if (
                  (this._processParsedTorrent(t),
                  (this.metadata = this.torrentFile),
                  this.client.enableWebSeeds &&
                    this.urlList.forEach(e => {
                      this.addWebSeed(e);
                    }),
                  (this._rarityMap = new q(this)),
                  (this.store = new w(
                    new this._store(this.pieceLength, {
                      torrent: { infoHash: this.infoHash },
                      files: this.files.map(e => ({
                        path: I.join(this.path, e.path),
                        length: e.length,
                        offset: e.offset
                      })),
                      length: this.length,
                      name: this.infoHash
                    })
                  )),
                  (this.files = this.files.map(e => new M(this, e))),
                  this.so)
                ) {
                  const e = N.parse(this.so);
                  this.files.forEach((t, n) => {
                    e.includes(n) && this.files[n].select(!0);
                  });
                } else
                  0 !== this.pieces.length &&
                    this.select(0, this.pieces.length - 1, !1);
                if (
                  ((this._hashes = this.pieces),
                  (this.pieces = this.pieces.map((e, t) => {
                    const n =
                      t === this.pieces.length - 1
                        ? this.lastPieceLength
                        : this.pieceLength;
                    return new L(n);
                  })),
                  (this._reservations = this.pieces.map(() => [])),
                  (this.bitfield = new p(this.pieces.length)),
                  this.wires.forEach(e => {
                    e.ut_metadata && e.ut_metadata.setMetadata(this.metadata),
                      this._onWireWithMetadata(e);
                  }),
                  this.emit("metadata"),
                  !this.destroyed)
                )
                  if (this.skipVerify) this._markAllVerified(), this._onStore();
                  else {
                    const e = e =>
                      e
                        ? this._destroy(e)
                        : void (this._debug("done verifying"), this._onStore());
                    this._debug("verifying existing torrent data"),
                      this._fileModtimes && this._store === i
                        ? this.getFileModtimes((t, n) => {
                            if (t) return this._destroy(t);
                            const r = this.files
                              .map((e, t) => n[t] === this._fileModtimes[t])
                              .every(e => e);
                            r
                              ? (this._markAllVerified(), this._onStore())
                              : this._verifyPieces(e);
                          })
                        : this._verifyPieces(e);
                  }
              }
              getFileModtimes(e) {
                const t = [];
                S(
                  this.files.map((e, n) => r => {
                    b.stat(I.join(this.path, e.path), (e, o) =>
                      e && "ENOENT" !== e.code
                        ? r(e)
                        : void ((t[n] = o && o.mtime.getTime()), r(null))
                    );
                  }),
                  z,
                  n => {
                    this._debug("done getting file modtimes"), e(n, t);
                  }
                );
              }
              _verifyPieces(e) {
                S(
                  this.pieces.map((e, t) => e =>
                    this.destroyed
                      ? e(new Error("torrent is destroyed"))
                      : void this.store.get(t, (r, o) =>
                          this.destroyed
                            ? e(new Error("torrent is destroyed"))
                            : r
                            ? n.nextTick(e, null)
                            : void R(o, n => {
                                if (this.destroyed)
                                  return e(new Error("torrent is destroyed"));
                                if (n === this._hashes[t]) {
                                  if (!this.pieces[t]) return e(null);
                                  this._debug("piece verified %s", t),
                                    this._markVerified(t);
                                } else this._debug("piece invalid %s", t);
                                e(null);
                              })
                        )
                  ),
                  z,
                  e
                );
              }
              rescanFiles(e) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                e || (e = u),
                  this._verifyPieces(t =>
                    t
                      ? (this._destroy(t), e(t))
                      : void (this._checkDone(), e(null))
                  );
              }
              _markAllVerified() {
                for (let e = 0; e < this.pieces.length; e++)
                  this._markVerified(e);
              }
              _markVerified(e) {
                (this.pieces[e] = null),
                  (this._reservations[e] = null),
                  this.bitfield.set(e, !0);
              }
              _onStore() {
                this.destroyed ||
                  (this._debug("on store"),
                  this._startDiscovery(),
                  (this.ready = !0),
                  this.emit("ready"),
                  this._checkDone(),
                  this._updateSelections());
              }
              destroy(e) {
                this._destroy(null, e);
              }
              _destroy(e, t) {
                if (!this.destroyed) {
                  for (const e in ((this.destroyed = !0),
                  this._debug("destroy"),
                  this.client._remove(this),
                  clearInterval(this._rechokeIntervalId),
                  this._xsRequests.forEach(e => {
                    e.abort();
                  }),
                  this._rarityMap && this._rarityMap.destroy(),
                  this._peers))
                    this.removePeer(e);
                  this.files.forEach(e => {
                    e instanceof M && e._destroy();
                  });
                  const n = this._servers.map(e => t => {
                    e.destroy(t);
                  });
                  this.discovery &&
                    n.push(e => {
                      this.discovery.destroy(e);
                    }),
                    this.store &&
                      n.push(e => {
                        this.store.close(e);
                      }),
                    v(n, t),
                    e &&
                      (0 === this.listenerCount("error")
                        ? this.client.emit("error", e)
                        : this.emit("error", e)),
                    this.emit("close"),
                    (this.client = null),
                    (this.files = []),
                    (this.discovery = null),
                    (this.store = null),
                    (this._rarityMap = null),
                    (this._peers = null),
                    (this._servers = null),
                    (this._xsRequests = null);
                }
              }
              addPeer(t) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                if (!this.infoHash)
                  throw new Error(
                    "addPeer() must not be called before the `infoHash` event"
                  );
                if (this.client.blocked) {
                  let e;
                  if ("string" == typeof t) {
                    let n;
                    try {
                      n = f(t);
                    } catch (n) {
                      return (
                        this._debug("ignoring peer: invalid %s", t),
                        this.emit("invalidPeer", t),
                        !1
                      );
                    }
                    e = n[0];
                  } else
                    "string" == typeof t.remoteAddress && (e = t.remoteAddress);
                  if (e && this.client.blocked.contains(e))
                    return (
                      this._debug("ignoring peer: blocked %s", t),
                      "string" != typeof t && t.destroy(),
                      this.emit("blockedPeer", t),
                      !1
                    );
                }
                const n = !!this._addPeer(t);
                return (
                  n ? this.emit("peer", t) : this.emit("invalidPeer", t), n
                );
              }
              _addPeer(e) {
                if (this.destroyed)
                  return "string" != typeof e && e.destroy(), null;
                if ("string" == typeof e && !this._validAddr(e))
                  return this._debug("ignoring peer: invalid %s", e), null;
                const t = (e && e.id) || e;
                if (this._peers[t])
                  return (
                    this._debug("ignoring peer: duplicate (%s)", t),
                    "string" != typeof e && e.destroy(),
                    null
                  );
                if (this.paused)
                  return (
                    this._debug("ignoring peer: torrent is paused"),
                    "string" != typeof e && e.destroy(),
                    null
                  );
                this._debug("add peer %s", t);
                let n;
                return (
                  (n =
                    "string" == typeof e
                      ? H.createTCPOutgoingPeer(e, this)
                      : H.createWebRTCPeer(e, this)),
                  (this._peers[n.id] = n),
                  (this._peersLength += 1),
                  "string" == typeof e && (this._queue.push(n), this._drain()),
                  n
                );
              }
              addWebSeed(e) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                if (!/^https?:\/\/.+/.test(e))
                  return (
                    this.emit(
                      "warning",
                      new Error(`ignoring invalid web seed: ${e}`)
                    ),
                    void this.emit("invalidPeer", e)
                  );
                if (this._peers[e])
                  return (
                    this.emit(
                      "warning",
                      new Error(`ignoring duplicate web seed: ${e}`)
                    ),
                    void this.emit("invalidPeer", e)
                  );
                this._debug("add web seed %s", e);
                const t = H.createWebSeedPeer(e, this);
                (this._peers[t.id] = t),
                  (this._peersLength += 1),
                  this.emit("peer", e);
              }
              _addIncomingPeer(e) {
                return this.destroyed
                  ? e.destroy(new Error("torrent is destroyed"))
                  : this.paused
                  ? e.destroy(new Error("torrent is paused"))
                  : void (this._debug("add incoming peer %s", e.id),
                    (this._peers[e.id] = e),
                    (this._peersLength += 1));
              }
              removePeer(e) {
                const t = (e && e.id) || e;
                e = this._peers[t];
                e &&
                  (this._debug("removePeer %s", t),
                  delete this._peers[t],
                  (this._peersLength -= 1),
                  e.destroy(),
                  this._drain());
              }
              select(e, t, n, r) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                if (0 > e || t < e || this.pieces.length <= t)
                  throw new Error(`invalid selection ${e} : ${t}`);
                (n = +n || 0),
                  this._debug("select %s-%s (priority %s)", e, t, n),
                  this._selections.push({
                    from: e,
                    to: t,
                    offset: 0,
                    priority: n,
                    notify: r || u
                  }),
                  this._selections.sort((e, t) => t.priority - e.priority),
                  this._updateSelections();
              }
              deselect(e, t, n) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                (n = +n || 0),
                  this._debug("deselect %s-%s (priority %s)", e, t, n);
                for (let r = 0; r < this._selections.length; ++r) {
                  const o = this._selections[r];
                  if (o.from === e && o.to === t && o.priority === n) {
                    this._selections.splice(r, 1);
                    break;
                  }
                }
                this._updateSelections();
              }
              critical(e, t) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                this._debug("critical %s-%s", e, t);
                for (let n = e; n <= t; ++n) this._critical[n] = !0;
                this._updateSelections();
              }
              _onWire(e, t) {
                if (
                  (this._debug("got wire %s (%s)", e._debugId, t || "Unknown"),
                  e.on("download", e => {
                    this.destroyed ||
                      ((this.received += e),
                      this._downloadSpeed(e),
                      this.client._downloadSpeed(e),
                      this.emit("download", e),
                      this.client.emit("download", e));
                  }),
                  e.on("upload", e => {
                    this.destroyed ||
                      ((this.uploaded += e),
                      this._uploadSpeed(e),
                      this.client._uploadSpeed(e),
                      this.emit("upload", e),
                      this.client.emit("upload", e));
                  }),
                  this.wires.push(e),
                  t)
                ) {
                  const n = f(t);
                  (e.remoteAddress = n[0]), (e.remotePort = n[1]);
                }
                this.client.dht &&
                  this.client.dht.listening &&
                  e.on("port", n =>
                    this.destroyed || this.client.dht.destroyed
                      ? void 0
                      : e.remoteAddress
                      ? 0 === n || 65536 < n
                        ? this._debug("ignoring invalid PORT from peer")
                        : void (this._debug("port: %s (from %s)", n, t),
                          this.client.dht.addNode({
                            host: e.remoteAddress,
                            port: n
                          }))
                      : this._debug("ignoring PORT from peer with no address")
                  ),
                  e.on("timeout", () => {
                    this._debug("wire timeout (%s)", t), e.destroy();
                  }),
                  e.setTimeout(3e4, !0),
                  e.setKeepAlive(!0),
                  e.use(P(this.metadata)),
                  e.ut_metadata.on("warning", e => {
                    this._debug("ut_metadata warning: %s", e.message);
                  }),
                  this.metadata ||
                    (e.ut_metadata.on("metadata", e => {
                      this._debug("got metadata via ut_metadata"),
                        this._onMetadata(e);
                    }),
                    e.ut_metadata.fetch()),
                  "function" != typeof O ||
                    this.private ||
                    (e.use(O()),
                    e.ut_pex.on("peer", e => {
                      this.done ||
                        (this._debug("ut_pex: got peer: %s (from %s)", e, t),
                        this.addPeer(e));
                    }),
                    e.ut_pex.on("dropped", e => {
                      const n = this._peers[e];
                      n &&
                        !n.connected &&
                        (this._debug(
                          "ut_pex: dropped peer: %s (from %s)",
                          e,
                          t
                        ),
                        this.removePeer(e));
                    }),
                    e.once("close", () => {
                      e.ut_pex.reset();
                    })),
                  this.emit("wire", e, t),
                  this.metadata &&
                    n.nextTick(() => {
                      this._onWireWithMetadata(e);
                    });
              }
              _onWireWithMetadata(e) {
                let t = null;
                const n = () => {
                  this.destroyed ||
                    e.destroyed ||
                    (this._numQueued > 2 * (this._numConns - this.numPeers) &&
                    e.amInterested
                      ? e.destroy()
                      : ((t = setTimeout(n, j)), t.unref && t.unref()));
                };
                let r;
                const o = () => {
                  if (
                    e.peerPieces.buffer.length === this.bitfield.buffer.length
                  ) {
                    for (r = 0; r < this.pieces.length; ++r)
                      if (!e.peerPieces.get(r)) return;
                    (e.isSeeder = !0), e.choke();
                  }
                };
                e.on("bitfield", () => {
                  o(), this._update();
                }),
                  e.on("have", () => {
                    o(), this._update();
                  }),
                  e.once("interested", () => {
                    e.unchoke();
                  }),
                  e.once("close", () => {
                    clearTimeout(t);
                  }),
                  e.on("choke", () => {
                    clearTimeout(t),
                      (t = setTimeout(n, j)),
                      t.unref && t.unref();
                  }),
                  e.on("unchoke", () => {
                    clearTimeout(t), this._update();
                  }),
                  e.on("request", (t, n, r, o) =>
                    r > 131072
                      ? e.destroy()
                      : void (
                          this.pieces[t] ||
                          this.store.get(t, { offset: n, length: r }, o)
                        )
                  ),
                  e.bitfield(this.bitfield),
                  e.uninterested(),
                  e.peerExtensions.dht &&
                    this.client.dht &&
                    this.client.dht.listening &&
                    e.port(this.client.dht.address().port),
                  "webSeed" !== e.type &&
                    ((t = setTimeout(n, j)), t.unref && t.unref()),
                  (e.isSeeder = !1),
                  o();
              }
              _updateSelections() {
                !this.ready ||
                  this.destroyed ||
                  (n.nextTick(() => {
                    this._gcSelections();
                  }),
                  this._updateInterest(),
                  this._update());
              }
              _gcSelections() {
                for (let e = 0; e < this._selections.length; ++e) {
                  const t = this._selections[e],
                    n = t.offset;
                  for (
                    ;
                    this.bitfield.get(t.from + t.offset) &&
                    t.from + t.offset < t.to;

                  )
                    t.offset += 1;
                  n !== t.offset && t.notify(),
                    t.to === t.from + t.offset &&
                      this.bitfield.get(t.from + t.offset) &&
                      (this._selections.splice(e, 1),
                      (e -= 1),
                      t.notify(),
                      this._updateInterest());
                }
                this._selections.length || this.emit("idle");
              }
              _updateInterest() {
                const e = this._amInterested;
                (this._amInterested = !!this._selections.length),
                  this.wires.forEach(e => {
                    let t = !1;
                    for (let n = 0; n < this.pieces.length; ++n)
                      if (this.pieces[n] && e.peerPieces.get(n)) {
                        t = !0;
                        break;
                      }
                    t ? e.interested() : e.uninterested();
                  });
                e === this._amInterested ||
                  (this._amInterested
                    ? this.emit("interested")
                    : this.emit("uninterested"));
              }
              _update() {
                if (!this.destroyed) {
                  const e = B(this.wires);
                  for (let t; (t = e()); ) this._updateWireWrapper(t);
                }
              }
              _updateWireWrapper(e) {
                const t = this;
                "undefined" != typeof window &&
                "function" == typeof window.requestIdleCallback
                  ? window.requestIdleCallback(
                      function() {
                        t._updateWire(e);
                      },
                      { timeout: 250 }
                    )
                  : t._updateWire(e);
              }
              _updateWire(e) {
                function t(t, n, r, o) {
                  return a =>
                    a >= t &&
                    a <= n &&
                    !(a in r) &&
                    e.peerPieces.get(a) &&
                    (!o || o(a));
                }
                function n() {
                  const t = e.downloadSpeed() || 1;
                  if (t > F) return () => !0;
                  const n = (d(1, e.requests.length) * L.BLOCK_LENGTH) / t;
                  let r = 10,
                    o = 0;
                  return e => {
                    if (!r || a.bitfield.get(e)) return !0;
                    for (let i = a.pieces[e].missing; o < a.wires.length; o++) {
                      const d = a.wires[o],
                        s = d.downloadSpeed();
                      if (
                        !(s < F) &&
                        !(s <= t) &&
                        d.peerPieces.get(e) &&
                        !(0 < (i -= s * n))
                      )
                        return r--, !1;
                    }
                    return !0;
                  };
                }
                function r(e) {
                  let t = e;
                  for (
                    let n = e;
                    n < a._selections.length && a._selections[n].priority;
                    n++
                  )
                    t = n;
                  const n = a._selections[e];
                  (a._selections[e] = a._selections[t]), (a._selections[t] = n);
                }
                function i(o) {
                  if (e.requests.length >= l) return !0;
                  const d = n();
                  for (let n = 0; n < a._selections.length; n++) {
                    const i = a._selections[n];
                    let s;
                    if ("rarest" === a.strategy) {
                      const c = i.from + i.offset,
                        u = i.to,
                        f = {};
                      let p = 0;
                      for (
                        const h = t(c, u, f, d);
                        p < u - c + 1 &&
                        ((s = a._rarityMap.getRarestPiece(h)), !(0 > s));

                      ) {
                        for (; a._request(e, s, a._critical[s] || o); );
                        if (e.requests.length < l) {
                          (f[s] = !0), p++;
                          continue;
                        }
                        return i.priority && r(n), !0;
                      }
                    } else
                      for (s = i.from + i.offset; s <= i.to; s++)
                        if (e.peerPieces.get(s) && d(s)) {
                          for (; a._request(e, s, a._critical[s] || o); );
                          if (!(e.requests.length < l))
                            return i.priority && r(n), !0;
                        }
                  }
                  return !1;
                }
                const a = this;
                if (e.peerChoking) return;
                if (!e.downloaded)
                  return (function() {
                    if (!e.requests.length)
                      for (let n = a._selections.length; n--; ) {
                        const r = a._selections[n];
                        let o;
                        if ("rarest" === a.strategy) {
                          const n = r.from + r.offset,
                            i = r.to,
                            d = {};
                          let s = 0;
                          for (
                            const r = t(n, i, d);
                            s < i - n + 1 &&
                            ((o = a._rarityMap.getRarestPiece(r)), !(0 > o));

                          ) {
                            if (a._request(e, o, !1)) return;
                            (d[o] = !0), (s += 1);
                          }
                        } else
                          for (o = r.to; o >= r.from + r.offset; --o)
                            if (e.peerPieces.get(o) && a._request(e, o, !1))
                              return;
                      }
                  })();
                const s = o(e, 0.5);
                if (e.requests.length >= s) return;
                const l = o(e, W);
                i(!1) || i(!0);
              }
              _rechoke() {
                if (!this.ready) return;
                0 < this._rechokeOptimisticTime
                  ? (this._rechokeOptimisticTime -= 1)
                  : (this._rechokeOptimisticWire = null);
                const e = [];
                this.wires.forEach(t => {
                  t.isSeeder ||
                    t === this._rechokeOptimisticWire ||
                    e.push({
                      wire: t,
                      downloadSpeed: t.downloadSpeed(),
                      uploadSpeed: t.uploadSpeed(),
                      salt: Math.random(),
                      isChoked: !0
                    });
                }),
                  e.sort(function(e, t) {
                    return e.downloadSpeed === t.downloadSpeed
                      ? e.uploadSpeed === t.uploadSpeed
                        ? e.wire.amChoking === t.wire.amChoking
                          ? e.salt - t.salt
                          : e.wire.amChoking
                          ? 1
                          : -1
                        : t.uploadSpeed - e.uploadSpeed
                      : t.downloadSpeed - e.downloadSpeed;
                  });
                let t = 0,
                  n = 0;
                for (; n < e.length && t < this._rechokeNumSlots; ++n)
                  (e[n].isChoked = !1), e[n].wire.peerInterested && (t += 1);
                if (
                  !this._rechokeOptimisticWire &&
                  n < e.length &&
                  this._rechokeNumSlots
                ) {
                  const t = e.slice(n).filter(e => e.wire.peerInterested),
                    r = t[c(t.length)];
                  r &&
                    ((r.isChoked = !1),
                    (this._rechokeOptimisticWire = r.wire),
                    (this._rechokeOptimisticTime = 2));
                }
                e.forEach(e => {
                  e.wire.amChoking !== e.isChoked &&
                    (e.isChoked ? e.wire.choke() : e.wire.unchoke());
                });
              }
              _hotswap(e, t) {
                const n = e.downloadSpeed();
                if (n < L.BLOCK_LENGTH) return !1;
                if (!this._reservations[t]) return !1;
                const o = this._reservations[t];
                if (!o) return !1;
                let r = 1 / 0,
                  a,
                  d;
                for (d = 0; d < o.length; d++) {
                  const t = o[d];
                  if (!t || t === e) continue;
                  const i = t.downloadSpeed();
                  i >= F || 2 * i > n || i > r || ((a = t), (r = i));
                }
                if (!a) return !1;
                for (d = 0; d < o.length; d++) o[d] === a && (o[d] = null);
                for (d = 0; d < a.requests.length; d++) {
                  const e = a.requests[d];
                  e.piece === t &&
                    this.pieces[t].cancel(0 | (e.offset / L.BLOCK_LENGTH));
                }
                return this.emit("hotswap", a, e, t), !0;
              }
              _request(e, t, a) {
                function d() {
                  n.nextTick(() => {
                    c._update();
                  });
                }
                const c = this,
                  u = e.requests.length,
                  f = "webSeed" === e.type;
                if (c.bitfield.get(t)) return !1;
                const p = f
                  ? s(l(e, W, c.pieceLength), c.maxWebConns)
                  : o(e, W);
                if (u >= p) return !1;
                const h = c.pieces[t];
                let m = f ? h.reserveRemaining() : h.reserve();
                if (
                  (-1 === m &&
                    a &&
                    c._hotswap(e, t) &&
                    (m = f ? h.reserveRemaining() : h.reserve()),
                  -1 === m)
                )
                  return !1;
                let g = c._reservations[t];
                g || (g = c._reservations[t] = []);
                let _ = g.indexOf(null);
                -1 === _ && (_ = g.length), (g[_] = e);
                const b = h.chunkOffset(m),
                  y = f ? h.chunkLengthRemaining(m) : h.chunkLength(m);
                return (
                  e.request(t, b, y, function n(r, o) {
                    if (c.destroyed) return;
                    if (!c.ready)
                      return c.once("ready", () => {
                        n(r, o);
                      });
                    if ((g[_] === e && (g[_] = null), h !== c.pieces[t]))
                      return d();
                    if (r)
                      return (
                        c._debug(
                          "error getting piece %s (offset: %s length: %s) from %s: %s",
                          t,
                          b,
                          y,
                          `${e.remoteAddress}:${e.remotePort}`,
                          r.message
                        ),
                        f ? h.cancelRemaining(m) : h.cancel(m),
                        void d()
                      );
                    if (
                      (c._debug(
                        "got piece %s (offset: %s length: %s) from %s",
                        t,
                        b,
                        y,
                        `${e.remoteAddress}:${e.remotePort}`
                      ),
                      !h.set(m, o, e))
                    )
                      return d();
                    const i = h.flush();
                    R(i, e => {
                      if (!c.destroyed) {
                        if (e === c._hashes[t]) {
                          if (!c.pieces[t]) return;
                          c._debug("piece verified %s", t),
                            (c.pieces[t] = null),
                            (c._reservations[t] = null),
                            c.bitfield.set(t, !0),
                            c.store.put(t, i),
                            c.wires.forEach(e => {
                              e.have(t);
                            }),
                            c._checkDone() &&
                              !c.destroyed &&
                              c.discovery.complete();
                        } else
                          (c.pieces[t] = new L(h.length)),
                            c.emit(
                              "warning",
                              new Error(`Piece ${t} failed verification`)
                            );
                        d();
                      }
                    });
                  }),
                  !0
                );
              }
              _checkDone() {
                if (this.destroyed) return;
                this.files.forEach(e => {
                  if (!e.done) {
                    for (let t = e._startPiece; t <= e._endPiece; ++t)
                      if (!this.bitfield.get(t)) return;
                    (e.done = !0),
                      e.emit("done"),
                      this._debug(`file done: ${e.name}`);
                  }
                });
                let e = !0;
                for (let t = 0; t < this._selections.length; t++) {
                  const n = this._selections[t];
                  for (let t = n.from; t <= n.to; t++)
                    if (!this.bitfield.get(t)) {
                      e = !1;
                      break;
                    }
                  if (!e) break;
                }
                return (
                  !this.done &&
                    e &&
                    ((this.done = !0),
                    this._debug(`torrent done: ${this.infoHash}`),
                    this.emit("done")),
                  this._gcSelections(),
                  e
                );
              }
              load(e, t) {
                if (this.destroyed) throw new Error("torrent is destroyed");
                if (!this.ready)
                  return this.once("ready", () => {
                    this.load(e, t);
                  });
                Array.isArray(e) || (e = [e]), t || (t = u);
                const n = new k(e),
                  r = new h(this.store, this.pieceLength);
                T(n, r, e =>
                  e
                    ? t(e)
                    : void (this._markAllVerified(), this._checkDone(), t(null))
                );
              }
              createServer(e) {
                if ("function" != typeof D)
                  throw new Error("node.js-only method");
                if (this.destroyed) throw new Error("torrent is destroyed");
                const t = new D(this, e);
                return this._servers.push(t), t;
              }
              pause() {
                this.destroyed || (this._debug("pause"), (this.paused = !0));
              }
              resume() {
                this.destroyed ||
                  (this._debug("resume"), (this.paused = !1), this._drain());
              }
              _debug() {
                const e = [].slice.call(arguments);
                (e[0] = `[${this.client._debugId}] [${this._debugId}] ${e[0]}`),
                  m(...e);
              }
              _drain() {
                if (
                  (this._debug(
                    "_drain numConns %s maxConns %s",
                    this._numConns,
                    this.client.maxConns
                  ),
                  "function" != typeof E.connect ||
                    this.destroyed ||
                    this.paused ||
                    this._numConns >= this.client.maxConns)
                )
                  return;
                this._debug(
                  "drain (%s queued, %s/%s peers)",
                  this._numQueued,
                  this.numPeers,
                  this.client.maxConns
                );
                const e = this._queue.shift();
                if (!e) return;
                this._debug("tcp connect attempt to %s", e.addr);
                const t = f(e.addr),
                  n = { host: t[0], port: t[1] },
                  r = (e.conn = E.connect(n));
                r.once("connect", () => {
                  e.onConnect();
                }),
                  r.once("error", t => {
                    e.destroy(t);
                  }),
                  e.startConnectTimeout(),
                  r.on("close", () => {
                    if (!this.destroyed) {
                      if (e.retries >= V.length)
                        return void this._debug(
                          "conn %s closed: will not re-add (max %s attempts)",
                          e.addr,
                          V.length
                        );
                      const t = V[e.retries];
                      this._debug(
                        "conn %s closed: will re-add to queue in %sms (attempt %s)",
                        e.addr,
                        t,
                        e.retries + 1
                      );
                      const n = setTimeout(() => {
                        const t = this._addPeer(e.addr);
                        t && (t.retries = e.retries + 1);
                      }, t);
                      n.unref && n.unref();
                    }
                  });
              }
              _validAddr(e) {
                let t;
                try {
                  t = f(e);
                } catch (t) {
                  return !1;
                }
                const n = t[0],
                  r = t[1];
                return (
                  0 < r &&
                  65535 > r &&
                  ("127.0.0.1" !== n || r !== this.client.torrentPort)
                );
              }
            }
            t.exports = X;
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {
          "../package.json": 124,
          "./file": 2,
          "./peer": 3,
          "./rarity-map": 4,
          "./server": 21,
          _process: 61,
          "addr-to-ip-port": 7,
          bitfield: 13,
          "chunk-store-stream/write": 28,
          debug: 30,
          events: 33,
          fs: 22,
          "fs-chunk-store": 46,
          "immediate-chunk-store": 38,
          multistream: 54,
          net: 21,
          os: 21,
          "parse-numeric-range": 57,
          "parse-torrent": 58,
          path: 59,
          pump: 62,
          "random-iterate": 68,
          "run-parallel": 89,
          "run-parallel-limit": 88,
          "simple-get": 93,
          "simple-sha1": 95,
          speedometer: 98,
          "torrent-discovery": 110,
          "torrent-piece": 111,
          uniq: 114,
          ut_metadata: 118,
          ut_pex: 21
        }
      ],
      6: [
        function(e, t) {
          (function(n) {
            const r = e("bitfield"),
              o = e("debug")("webtorrent:webconn"),
              i = e("simple-get"),
              a = e("simple-sha1"),
              l = e("bittorrent-protocol"),
              c = e("../package.json").version;
            t.exports = class extends l {
              constructor(e, t) {
                super(),
                  (this.url = e),
                  (this.webPeerId = a.sync(e)),
                  (this._torrent = t),
                  this._init();
              }
              _init() {
                this.setKeepAlive(!0),
                  this.once("handshake", e => {
                    if (this.destroyed) return;
                    this.handshake(e, this.webPeerId);
                    const t = this._torrent.pieces.length,
                      n = new r(t);
                    for (let r = 0; r <= t; r++) n.set(r, !0);
                    this.bitfield(n);
                  }),
                  this.once("interested", () => {
                    o("interested"), this.unchoke();
                  }),
                  this.on("uninterested", () => {
                    o("uninterested");
                  }),
                  this.on("choke", () => {
                    o("choke");
                  }),
                  this.on("unchoke", () => {
                    o("unchoke");
                  }),
                  this.on("bitfield", () => {
                    o("bitfield");
                  }),
                  this.on("request", (e, t, n, r) => {
                    o("request pieceIndex=%d offset=%d length=%d", e, t, n),
                      this.httpRequest(e, t, n, r);
                  });
              }
              httpRequest(e, t, r, a) {
                const l = e * this._torrent.pieceLength,
                  u = l + t,
                  f = u + r - 1,
                  p = this._torrent.files;
                let h;
                if (1 >= p.length) h = [{ url: this.url, start: u, end: f }];
                else {
                  const e = p.filter(
                    e => e.offset <= f && e.offset + e.length > u
                  );
                  if (1 > e.length)
                    return a(
                      new Error(
                        "Could not find file corresponnding to web seed range request"
                      )
                    );
                  h = e.map(e => {
                    const t = e.offset + e.length - 1,
                      n =
                        this.url +
                        ("/" === this.url[this.url.length - 1] ? "" : "/") +
                        e.path;
                    return {
                      url: n,
                      fileOffsetInRange: d(e.offset - u, 0),
                      start: d(u - e.offset, 0),
                      end: s(t, f - e.offset)
                    };
                  });
                }
                let m = 0,
                  g = !1,
                  _;
                1 < h.length && (_ = n.alloc(r)),
                  h.forEach(n => {
                    function d(e, t) {
                      return 200 > e.statusCode || 300 <= e.statusCode
                        ? ((g = !0),
                          a(
                            new Error(
                              `Unexpected HTTP status code ${e.statusCode}`
                            )
                          ))
                        : void (o("Got data of length %d", t.length),
                          1 === h.length
                            ? a(null, t)
                            : (t.copy(_, n.fileOffsetInRange),
                              ++m === h.length && a(null, _)));
                    }
                    const s = n.url,
                      l = n.start,
                      u = n.end;
                    o(
                      "Requesting url=%s pieceIndex=%d offset=%d length=%d start=%d end=%d",
                      s,
                      e,
                      t,
                      r,
                      l,
                      u
                    );
                    const f = {
                      url: s,
                      method: "GET",
                      headers: {
                        "user-agent": `WebTorrent/${c} (https://webtorrent.io)`,
                        range: `bytes=${l}-${u}`
                      }
                    };
                    i.concat(f, (e, t, n) =>
                      g
                        ? void 0
                        : e
                        ? "undefined" == typeof window ||
                          s.startsWith(`${window.location.origin}/`)
                          ? ((g = !0), a(e))
                          : i.head(s, (t, n) =>
                              g
                                ? void 0
                                : t
                                ? ((g = !0), a(t))
                                : 200 > n.statusCode || 300 <= n.statusCode
                                ? ((g = !0),
                                  a(
                                    new Error(
                                      `Unexpected HTTP status code ${n.statusCode}`
                                    )
                                  ))
                                : n.url === s
                                ? ((g = !0), a(e))
                                : void ((f.url = n.url),
                                  i.concat(f, (e, t, n) =>
                                    g
                                      ? void 0
                                      : e
                                      ? ((g = !0), a(e))
                                      : void d(t, n)
                                  ))
                            )
                        : void d(t, n)
                    );
                  });
              }
              destroy() {
                super.destroy(), (this._torrent = null);
              }
            };
          }.call(this, e("buffer").Buffer));
        },
        {
          "../package.json": 124,
          bitfield: 13,
          "bittorrent-protocol": 14,
          buffer: 26,
          debug: 30,
          "simple-get": 93,
          "simple-sha1": 95
        }
      ],
      7: [
        function(e, t) {
          const n = /^\[?([^\]]+)\]?:(\d+)$/;
          let r = {},
            o = 0;
          (t.exports = function(e) {
            if ((1e5 === o && t.exports.reset(), !r[e])) {
              const t = n.exec(e);
              if (!t) throw new Error(`invalid addr: ${e}`);
              (r[e] = [t[1], +t[2]]), (o += 1);
            }
            return r[e];
          }),
            (t.exports.reset = function() {
              (r = {}), (o = 0);
            });
        },
        {}
      ],
      8: [
        function(e, t, n) {
          "use strict";
          function r(e) {
            var t = e.length;
            if (0 < t % 4)
              throw new Error("Invalid string. Length must be a multiple of 4");
            var n = e.indexOf("=");
            -1 === n && (n = t);
            var r = n === t ? 0 : 4 - (n % 4);
            return [n, r];
          }
          function o(e, t, n) {
            return (3 * (t + n)) / 4 - n;
          }
          function a(e) {
            var t = r(e),
              n = t[0],
              a = t[1],
              d = new f(o(e, n, a)),
              s = 0,
              l = 0 < a ? n - 4 : n,
              c,
              p;
            for (p = 0; p < l; p += 4)
              (c =
                (u[e.charCodeAt(p)] << 18) |
                (u[e.charCodeAt(p + 1)] << 12) |
                (u[e.charCodeAt(p + 2)] << 6) |
                u[e.charCodeAt(p + 3)]),
                (d[s++] = 255 & (c >> 16)),
                (d[s++] = 255 & (c >> 8)),
                (d[s++] = 255 & c);
            return (
              2 === a &&
                ((c =
                  (u[e.charCodeAt(p)] << 2) | (u[e.charCodeAt(p + 1)] >> 4)),
                (d[s++] = 255 & c)),
              1 === a &&
                ((c =
                  (u[e.charCodeAt(p)] << 10) |
                  (u[e.charCodeAt(p + 1)] << 4) |
                  (u[e.charCodeAt(p + 2)] >> 2)),
                (d[s++] = 255 & (c >> 8)),
                (d[s++] = 255 & c)),
              d
            );
          }
          function d(e) {
            return (
              c[63 & (e >> 18)] +
              c[63 & (e >> 12)] +
              c[63 & (e >> 6)] +
              c[63 & e]
            );
          }
          function s(e, t, n) {
            for (var r = [], o = t, a; o < n; o += 3)
              (a =
                (16711680 & (e[o] << 16)) +
                (65280 & (e[o + 1] << 8)) +
                (255 & e[o + 2])),
                r.push(d(a));
            return r.join("");
          }
          function l(e) {
            for (
              var t = e.length,
                n = t % 3,
                r = [],
                o = 16383,
                a = 0,
                d = t - n,
                l;
              a < d;
              a += o
            )
              r.push(s(e, a, a + o > d ? d : a + o));
            return (
              1 === n
                ? ((l = e[t - 1]), r.push(c[l >> 2] + c[63 & (l << 4)] + "=="))
                : 2 === n &&
                  ((l = (e[t - 2] << 8) + e[t - 1]),
                  r.push(
                    c[l >> 10] + c[63 & (l >> 4)] + c[63 & (l << 2)] + "="
                  )),
              r.join("")
            );
          }
          (n.byteLength = function(e) {
            var t = r(e),
              n = t[0],
              o = t[1];
            return (3 * (n + o)) / 4 - o;
          }),
            (n.toByteArray = a),
            (n.fromByteArray = l);
          for (
            var c = [],
              u = [],
              f = "undefined" == typeof Uint8Array ? Array : Uint8Array,
              p =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
              h = 0,
              m = p.length;
            h < m;
            ++h
          )
            (c[h] = p[h]), (u[p.charCodeAt(h)] = h);
          (u[45] = 62), (u[95] = 63);
        },
        {}
      ],
      9: [
        function(e, t) {
          function n(e, t, n) {
            for (var r = 0, o = 1, a = t, d; a < n; a++) {
              if (((d = e[a]), 58 > d && 48 <= d)) {
                r = 10 * r + (d - 48);
                continue;
              }
              if (a !== t || 43 !== d) {
                if (a === t && 45 === d) {
                  o = -1;
                  continue;
                }
                if (46 === d) break;
                throw new Error("not a number: buffer[" + a + "] = " + d);
              }
            }
            return r * o;
          }
          function r(e, t, n, o) {
            return null == e || 0 === e.length
              ? null
              : ("number" != typeof t && null == o && ((o = t), (t = void 0)),
                "number" != typeof n && null == o && ((o = n), (n = void 0)),
                (r.position = 0),
                (r.encoding = o || null),
                (r.data = i.isBuffer(e) ? e.slice(t, n) : i.from(e)),
                (r.bytes = r.data.length),
                r.next());
          }
          var i = e("safe-buffer").Buffer;
          const a = 101;
          (r.bytes = 0),
            (r.position = 0),
            (r.data = null),
            (r.encoding = null),
            (r.next = function() {
              switch (r.data[r.position]) {
                case 100:
                  return r.dictionary();
                case 108:
                  return r.list();
                case 105:
                  return r.integer();
                default:
                  return r.buffer();
              }
            }),
            (r.find = function(e) {
              for (var t = r.position, n = r.data.length, a = r.data; t < n; ) {
                if (a[t] === e) return t;
                t++;
              }
              throw new Error(
                'Invalid data: Missing delimiter "' +
                  o(e) +
                  '" [0x' +
                  e.toString(16) +
                  "]"
              );
            }),
            (r.dictionary = function() {
              r.position++;
              for (var e = {}; r.data[r.position] !== a; )
                e[r.buffer()] = r.next();
              return r.position++, e;
            }),
            (r.list = function() {
              r.position++;
              for (var e = []; r.data[r.position] !== a; ) e.push(r.next());
              return r.position++, e;
            }),
            (r.integer = function() {
              var e = r.find(a),
                t = n(r.data, r.position + 1, e);
              return (r.position += e + 1 - r.position), t;
            }),
            (r.buffer = function() {
              var e = r.find(58),
                t = n(r.data, r.position, e),
                o = ++e + t;
              return (
                (r.position = o),
                r.encoding
                  ? r.data.toString(r.encoding, e, o)
                  : r.data.slice(e, o)
              );
            }),
            (t.exports = r);
        },
        { "safe-buffer": 91 }
      ],
      10: [
        function(e, t) {
          function n(e, t, o) {
            var i = [],
              a = null;
            return (
              n._encode(i, e),
              (a = r.concat(i)),
              (n.bytes = a.length),
              r.isBuffer(t) ? (a.copy(t, o), t) : a
            );
          }
          var r = e("safe-buffer").Buffer;
          (n.bytes = -1),
            (n._floatConversionDetected = !1),
            (n.getType = function(e) {
              return r.isBuffer(e)
                ? "buffer"
                : Array.isArray(e)
                ? "array"
                : ArrayBuffer.isView(e)
                ? "arraybufferview"
                : e instanceof Number
                ? "number"
                : e instanceof Boolean
                ? "boolean"
                : e instanceof ArrayBuffer
                ? "arraybuffer"
                : typeof e;
            }),
            (n._encode = function(e, t) {
              if (null != t)
                switch (n.getType(t)) {
                  case "buffer":
                    n.buffer(e, t);
                    break;
                  case "object":
                    n.dict(e, t);
                    break;
                  case "array":
                    n.list(e, t);
                    break;
                  case "string":
                    n.string(e, t);
                    break;
                  case "number":
                    n.number(e, t);
                    break;
                  case "boolean":
                    n.number(e, t);
                    break;
                  case "arraybufferview":
                    n.buffer(e, r.from(t.buffer, t.byteOffset, t.byteLength));
                    break;
                  case "arraybuffer":
                    n.buffer(e, r.from(t));
                }
            });
          var o = r.from("e"),
            i = r.from("d"),
            a = r.from("l");
          (n.buffer = function(e, t) {
            e.push(r.from(t.length + ":"), t);
          }),
            (n.string = function(e, t) {
              e.push(r.from(r.byteLength(t) + ":" + t));
            }),
            (n.number = function(e, t) {
              var o =
                ((t / 2147483648) << 0) * 2147483648 + (t % 2147483648 << 0);
              e.push(r.from("i" + o + "e")),
                o === t ||
                  n._floatConversionDetected ||
                  ((n._floatConversionDetected = !0),
                  console.warn(
                    'WARNING: Possible data corruption detected with value "' +
                      t +
                      '":',
                    'Bencoding only defines support for integers, value was converted to "' +
                      o +
                      '"'
                  ),
                  console.trace());
            }),
            (n.dict = function(e, t) {
              e.push(i);
              for (
                var r = 0, a = Object.keys(t).sort(), d = a.length, s;
                r < d;
                r++
              )
                (s = a[r]),
                  null == t[s] || (n.string(e, s), n._encode(e, t[s]));
              e.push(o);
            }),
            (n.list = function(e, t) {
              var r = 0,
                d = t.length;
              for (e.push(a); r < d; r++) null != t[r] && n._encode(e, t[r]);
              e.push(o);
            }),
            (t.exports = n);
        },
        { "safe-buffer": 91 }
      ],
      11: [
        function(e, t) {
          var n = t.exports;
          (n.encode = e("./encode")),
            (n.decode = e("./decode")),
            (n.byteLength = n.encodingLength = function(e) {
              return n.encode(e).length;
            });
        },
        { "./decode": 9, "./encode": 10 }
      ],
      12: [
        function(e, t) {
          t.exports = function(e, t, n, r, o) {
            var i, a;
            if (void 0 === r) r = 0;
            else if (((r |= 0), 0 > r || r >= e.length))
              throw new RangeError("invalid lower bound");
            if (void 0 === o) o = e.length - 1;
            else if (((o |= 0), o < r || o >= e.length))
              throw new RangeError("invalid upper bound");
            for (; r <= o; )
              if (((i = r + ((o - r) >>> 1)), (a = +n(e[i], t, i, e)), 0 > a))
                r = i + 1;
              else if (0 < a) o = i - 1;
              else return i;
            return ~r;
          };
        },
        {}
      ],
      13: [
        function(e, t) {
          function n(e) {
            let t = e >> 3;
            return 0 != e % 8 && t++, t;
          }
          "undefined" != typeof t &&
            (t.exports = class {
              constructor(e = 0, t) {
                const r = null != t && t.grow;
                (this.grow = (r && isFinite(r) && n(r)) || r || 0),
                  (this.buffer =
                    "number" == typeof e ? new Uint8Array(n(e)) : e);
              }
              get(e) {
                const t = e >> 3;
                return (
                  t < this.buffer.length && !!(this.buffer[t] & (128 >> e % 8))
                );
              }
              set(e, t = !0) {
                const n = e >> 3;
                if (t) {
                  if (this.buffer.length < n + 1) {
                    const e = d(n + 1, s(2 * this.buffer.length, this.grow));
                    if (e <= this.grow) {
                      const t = new Uint8Array(e);
                      t.set(this.buffer), (this.buffer = t);
                    }
                  }
                  this.buffer[n] |= 128 >> e % 8;
                } else
                  n < this.buffer.length && (this.buffer[n] &= ~(128 >> e % 8));
              }
            });
        },
        {}
      ],
      14: [
        function(e, t) {
          (function(n) {
            const r = e("unordered-array-remove"),
              o = e("bencode"),
              i = e("bitfield"),
              a = e("debug")("bittorrent-protocol"),
              d = e("randombytes"),
              s = e("speedometer"),
              l = e("readable-stream"),
              c = n.from("\x13BitTorrent protocol"),
              u = n.from([0, 0, 0, 0]),
              f = n.from([0, 0, 0, 1, 0]),
              p = n.from([0, 0, 0, 1, 1]),
              h = n.from([0, 0, 0, 1, 2]),
              m = n.from([0, 0, 0, 1, 3]),
              g = [0, 0, 0, 0, 0, 0, 0, 0],
              _ = [0, 0, 0, 3, 9, 0, 0];
            class b {
              constructor(e, t, n, r) {
                (this.piece = e),
                  (this.offset = t),
                  (this.length = n),
                  (this.callback = r);
              }
            }
            class y extends l.Duplex {
              constructor() {
                super(),
                  (this._debugId = d(4).toString("hex")),
                  this._debug("new wire"),
                  (this.peerId = null),
                  (this.peerIdBuffer = null),
                  (this.type = null),
                  (this.amChoking = !0),
                  (this.amInterested = !1),
                  (this.peerChoking = !0),
                  (this.peerInterested = !1),
                  (this.peerPieces = new i(0, { grow: 4e5 })),
                  (this.peerExtensions = {}),
                  (this.requests = []),
                  (this.peerRequests = []),
                  (this.extendedMapping = {}),
                  (this.peerExtendedMapping = {}),
                  (this.extendedHandshake = {}),
                  (this.peerExtendedHandshake = {}),
                  (this._ext = {}),
                  (this._nextExt = 1),
                  (this.uploaded = 0),
                  (this.downloaded = 0),
                  (this.uploadSpeed = s()),
                  (this.downloadSpeed = s()),
                  (this._keepAliveInterval = null),
                  (this._timeout = null),
                  (this._timeoutMs = 0),
                  (this.destroyed = !1),
                  (this._finished = !1),
                  (this._parserSize = 0),
                  (this._parser = null),
                  (this._buffer = []),
                  (this._bufferSize = 0),
                  this.once("finish", () => this._onFinish()),
                  this._parseHandshake();
              }
              setKeepAlive(e) {
                this._debug("setKeepAlive %s", e),
                  clearInterval(this._keepAliveInterval);
                !1 === e ||
                  (this._keepAliveInterval = setInterval(() => {
                    this.keepAlive();
                  }, 55e3));
              }
              setTimeout(e, t) {
                this._debug("setTimeout ms=%d unref=%s", e, t),
                  this._clearTimeout(),
                  (this._timeoutMs = e),
                  (this._timeoutUnref = !!t),
                  this._updateTimeout();
              }
              destroy() {
                this.destroyed ||
                  ((this.destroyed = !0),
                  this._debug("destroy"),
                  this.emit("close"),
                  this.end());
              }
              end(...e) {
                this._debug("end"),
                  this._onUninterested(),
                  this._onChoke(),
                  super.end(...e);
              }
              use(e) {
                function t() {}
                const n = e.prototype.name;
                if (!n)
                  throw new Error(
                    'Extension class requires a "name" property on the prototype'
                  );
                this._debug("use extension.name=%s", n);
                const r = this._nextExt,
                  o = new e(this);
                "function" != typeof o.onHandshake && (o.onHandshake = t),
                  "function" != typeof o.onExtendedHandshake &&
                    (o.onExtendedHandshake = t),
                  "function" != typeof o.onMessage && (o.onMessage = t),
                  (this.extendedMapping[r] = n),
                  (this._ext[n] = o),
                  (this[n] = o),
                  (this._nextExt += 1);
              }
              keepAlive() {
                this._debug("keep-alive"), this._push(u);
              }
              handshake(e, t, r) {
                let o, i;
                if (
                  ("string" == typeof e
                    ? ((e = e.toLowerCase()), (o = n.from(e, "hex")))
                    : ((o = e), (e = o.toString("hex"))),
                  "string" == typeof t
                    ? (i = n.from(t, "hex"))
                    : ((i = t), (t = i.toString("hex"))),
                  20 !== o.length || 20 !== i.length)
                )
                  throw new Error("infoHash and peerId MUST have length 20");
                this._debug("handshake i=%s p=%s exts=%o", e, t, r);
                const a = n.from(g);
                (a[5] |= 16),
                  r && r.dht && (a[7] |= 1),
                  this._push(n.concat([c, a, o, i])),
                  (this._handshakeSent = !0),
                  this.peerExtensions.extended &&
                    !this._extendedHandshakeSent &&
                    this._sendExtendedHandshake();
              }
              _sendExtendedHandshake() {
                const e = Object.assign({}, this.extendedHandshake);
                for (const t in ((e.m = {}), this.extendedMapping)) {
                  const n = this.extendedMapping[t];
                  e.m[n] = +t;
                }
                this.extended(0, o.encode(e)),
                  (this._extendedHandshakeSent = !0);
              }
              choke() {
                if (!this.amChoking) {
                  for (
                    this.amChoking = !0, this._debug("choke");
                    this.peerRequests.length;

                  )
                    this.peerRequests.pop();
                  this._push(f);
                }
              }
              unchoke() {
                this.amChoking &&
                  ((this.amChoking = !1),
                  this._debug("unchoke"),
                  this._push(p));
              }
              interested() {
                this.amInterested ||
                  ((this.amInterested = !0),
                  this._debug("interested"),
                  this._push(h));
              }
              uninterested() {
                this.amInterested &&
                  ((this.amInterested = !1),
                  this._debug("uninterested"),
                  this._push(m));
              }
              have(e) {
                this._debug("have %d", e), this._message(4, [e], null);
              }
              bitfield(e) {
                this._debug("bitfield"),
                  n.isBuffer(e) || (e = e.buffer),
                  this._message(5, [], e);
              }
              request(e, t, n, r) {
                return (
                  r || (r = () => {}),
                  this._finished
                    ? r(new Error("wire is closed"))
                    : this.peerChoking
                    ? r(new Error("peer is choking"))
                    : void (this._debug(
                        "request index=%d offset=%d length=%d",
                        e,
                        t,
                        n
                      ),
                      this.requests.push(new b(e, t, n, r)),
                      this._updateTimeout(),
                      this._message(6, [e, t, n], null))
                );
              }
              piece(e, t, n) {
                this._debug("piece index=%d offset=%d", e, t),
                  (this.uploaded += n.length),
                  this.uploadSpeed(n.length),
                  this.emit("upload", n.length),
                  this._message(7, [e, t], n);
              }
              cancel(e, t, n) {
                this._debug("cancel index=%d offset=%d length=%d", e, t, n),
                  this._callback(
                    this._pull(this.requests, e, t, n),
                    new Error("request was cancelled"),
                    null
                  ),
                  this._message(8, [e, t, n], null);
              }
              port(e) {
                this._debug("port %d", e);
                const t = n.from(_);
                t.writeUInt16BE(e, 5), this._push(t);
              }
              extended(e, t) {
                if (
                  (this._debug("extended ext=%s", e),
                  "string" == typeof e &&
                    this.peerExtendedMapping[e] &&
                    (e = this.peerExtendedMapping[e]),
                  "number" == typeof e)
                ) {
                  const r = n.from([e]),
                    i = n.isBuffer(t) ? t : o.encode(t);
                  this._message(20, [], n.concat([r, i]));
                } else throw new Error(`Unrecognized extension: ${e}`);
              }
              _read() {}
              _message(e, t, r) {
                const o = r ? r.length : 0,
                  a = n.allocUnsafe(5 + 4 * t.length);
                a.writeUInt32BE(a.length + o - 4, 0), (a[4] = e);
                for (let n = 0; n < t.length; n++)
                  a.writeUInt32BE(t[n], 5 + 4 * n);
                this._push(a), r && this._push(r);
              }
              _push(e) {
                return this._finished ? void 0 : this.push(e);
              }
              _onKeepAlive() {
                this._debug("got keep-alive"), this.emit("keep-alive");
              }
              _onHandshake(e, t, n) {
                const r = e.toString("hex"),
                  o = t.toString("hex");
                this._debug("got handshake i=%s p=%s exts=%o", r, o, n),
                  (this.peerId = o),
                  (this.peerIdBuffer = t),
                  (this.peerExtensions = n),
                  this.emit("handshake", r, o, n);
                for (var i in this._ext) this._ext[i].onHandshake(r, o, n);
                n.extended &&
                  this._handshakeSent &&
                  !this._extendedHandshakeSent &&
                  this._sendExtendedHandshake();
              }
              _onChoke() {
                for (
                  this.peerChoking = !0,
                    this._debug("got choke"),
                    this.emit("choke");
                  this.requests.length;

                )
                  this._callback(
                    this.requests.pop(),
                    new Error("peer is choking"),
                    null
                  );
              }
              _onUnchoke() {
                (this.peerChoking = !1),
                  this._debug("got unchoke"),
                  this.emit("unchoke");
              }
              _onInterested() {
                (this.peerInterested = !0),
                  this._debug("got interested"),
                  this.emit("interested");
              }
              _onUninterested() {
                (this.peerInterested = !1),
                  this._debug("got uninterested"),
                  this.emit("uninterested");
              }
              _onHave(e) {
                this.peerPieces.get(e) ||
                  (this._debug("got have %d", e),
                  this.peerPieces.set(e, !0),
                  this.emit("have", e));
              }
              _onBitField(e) {
                (this.peerPieces = new i(e)),
                  this._debug("got bitfield"),
                  this.emit("bitfield", this.peerPieces);
              }
              _onRequest(e, t, n) {
                if (!this.amChoking) {
                  this._debug(
                    "got request index=%d offset=%d length=%d",
                    e,
                    t,
                    n
                  );
                  const o = (o, i) =>
                    r === this._pull(this.peerRequests, e, t, n)
                      ? o
                        ? this._debug(
                            "error satisfying request index=%d offset=%d length=%d (%s)",
                            e,
                            t,
                            n,
                            o.message
                          )
                        : void this.piece(e, t, i)
                      : void 0;
                  var r = new b(e, t, n, o);
                  this.peerRequests.push(r), this.emit("request", e, t, n, o);
                }
              }
              _onPiece(e, t, n) {
                this._debug("got piece index=%d offset=%d", e, t),
                  this._callback(
                    this._pull(this.requests, e, t, n.length),
                    null,
                    n
                  ),
                  (this.downloaded += n.length),
                  this.downloadSpeed(n.length),
                  this.emit("download", n.length),
                  this.emit("piece", e, t, n);
              }
              _onCancel(e, t, n) {
                this._debug("got cancel index=%d offset=%d length=%d", e, t, n),
                  this._pull(this.peerRequests, e, t, n),
                  this.emit("cancel", e, t, n);
              }
              _onPort(e) {
                this._debug("got port %d", e), this.emit("port", e);
              }
              _onExtended(e, t) {
                if (0 === e) {
                  let e;
                  try {
                    e = o.decode(t);
                  } catch (e) {
                    this._debug(
                      "ignoring invalid extended handshake: %s",
                      e.message || e
                    );
                  }
                  if (!e) return;
                  this.peerExtendedHandshake = e;
                  if ("object" == typeof e.m)
                    for (var n in e.m)
                      this.peerExtendedMapping[n] = +e.m[n].toString();
                  for (n in this._ext)
                    this.peerExtendedMapping[n] &&
                      this._ext[n].onExtendedHandshake(
                        this.peerExtendedHandshake
                      );
                  this._debug("got extended handshake"),
                    this.emit(
                      "extended",
                      "handshake",
                      this.peerExtendedHandshake
                    );
                } else
                  this.extendedMapping[e] &&
                    ((e = this.extendedMapping[e]),
                    this._ext[e] && this._ext[e].onMessage(t)),
                    this._debug("got extended message ext=%s", e),
                    this.emit("extended", e, t);
              }
              _onTimeout() {
                this._debug("request timed out"),
                  this._callback(
                    this.requests.shift(),
                    new Error("request has timed out"),
                    null
                  ),
                  this.emit("timeout");
              }
              _write(e, t, r) {
                for (
                  this._bufferSize += e.length, this._buffer.push(e);
                  this._bufferSize >= this._parserSize;

                ) {
                  const e =
                    1 === this._buffer.length
                      ? this._buffer[0]
                      : n.concat(this._buffer);
                  (this._bufferSize -= this._parserSize),
                    (this._buffer = this._bufferSize
                      ? [e.slice(this._parserSize)]
                      : []),
                    this._parser(e.slice(0, this._parserSize));
                }
                r(null);
              }
              _callback(e, t, n) {
                e &&
                  (this._clearTimeout(),
                  !this.peerChoking && !this._finished && this._updateTimeout(),
                  e.callback(t, n));
              }
              _clearTimeout() {
                this._timeout &&
                  (clearTimeout(this._timeout), (this._timeout = null));
              }
              _updateTimeout() {
                this._timeoutMs &&
                  this.requests.length &&
                  !this._timeout &&
                  ((this._timeout = setTimeout(
                    () => this._onTimeout(),
                    this._timeoutMs
                  )),
                  this._timeoutUnref &&
                    this._timeout.unref &&
                    this._timeout.unref());
              }
              _parse(e, t) {
                (this._parserSize = e), (this._parser = t);
              }
              _onMessageLength(e) {
                const t = e.readUInt32BE(0);
                0 < t
                  ? this._parse(t, this._onMessage)
                  : (this._onKeepAlive(),
                    this._parse(4, this._onMessageLength));
              }
              _onMessage(e) {
                switch ((this._parse(4, this._onMessageLength), e[0])) {
                  case 0:
                    return this._onChoke();
                  case 1:
                    return this._onUnchoke();
                  case 2:
                    return this._onInterested();
                  case 3:
                    return this._onUninterested();
                  case 4:
                    return this._onHave(e.readUInt32BE(1));
                  case 5:
                    return this._onBitField(e.slice(1));
                  case 6:
                    return this._onRequest(
                      e.readUInt32BE(1),
                      e.readUInt32BE(5),
                      e.readUInt32BE(9)
                    );
                  case 7:
                    return this._onPiece(
                      e.readUInt32BE(1),
                      e.readUInt32BE(5),
                      e.slice(9)
                    );
                  case 8:
                    return this._onCancel(
                      e.readUInt32BE(1),
                      e.readUInt32BE(5),
                      e.readUInt32BE(9)
                    );
                  case 9:
                    return this._onPort(e.readUInt16BE(1));
                  case 20:
                    return this._onExtended(e.readUInt8(1), e.slice(2));
                  default:
                    return (
                      this._debug("got unknown message"),
                      this.emit("unknownmessage", e)
                    );
                }
              }
              _parseHandshake() {
                this._parse(1, e => {
                  const t = e.readUInt8(0);
                  this._parse(t + 48, e => {
                    const n = e.slice(0, t);
                    return "BitTorrent protocol" === n.toString()
                      ? void ((e = e.slice(t)),
                        this._onHandshake(e.slice(8, 28), e.slice(28, 48), {
                          dht: !!(1 & e[7]),
                          extended: !!(16 & e[5])
                        }),
                        this._parse(4, this._onMessageLength))
                      : (this._debug(
                          "Error: wire not speaking BitTorrent protocol (%s)",
                          n.toString()
                        ),
                        void this.end());
                  });
                });
              }
              _onFinish() {
                for (this._finished = !0, this.push(null); this.read(); );
                for (
                  clearInterval(this._keepAliveInterval),
                    this._parse(Number.MAX_VALUE, () => {});
                  this.peerRequests.length;

                )
                  this.peerRequests.pop();
                for (; this.requests.length; )
                  this._callback(
                    this.requests.pop(),
                    new Error("wire was closed"),
                    null
                  );
              }
              _debug(...e) {
                (e[0] = `[${this._debugId}] ${e[0]}`), a(...e);
              }
              _pull(e, t, n, o) {
                for (let a = 0; a < e.length; a++) {
                  const i = e[a];
                  if (i.piece === t && i.offset === n && i.length === o)
                    return r(e, a), i;
                }
                return null;
              }
            }
            t.exports = y;
          }.call(this, e("buffer").Buffer));
        },
        {
          bencode: 11,
          bitfield: 13,
          buffer: 26,
          debug: 30,
          randombytes: 69,
          "readable-stream": 85,
          speedometer: 98,
          "unordered-array-remove": 115
        }
      ],
      15: [
        function(e, t) {
          (function(n, r) {
            const o = e("debug")("bittorrent-tracker:client"),
              i = e("events"),
              a = e("once"),
              d = e("run-parallel"),
              s = e("simple-peer"),
              l = e("uniq"),
              c = e("./lib/common"),
              u = e("./lib/client/http-tracker"),
              f = e("./lib/client/udp-tracker"),
              p = e("./lib/client/websocket-tracker");
            class h extends i {
              constructor(e = {}) {
                if ((super(), !e.peerId))
                  throw new Error("Option `peerId` is required");
                if (!e.infoHash)
                  throw new Error("Option `infoHash` is required");
                if (!e.announce)
                  throw new Error("Option `announce` is required");
                if (!n.browser && !e.port)
                  throw new Error("Option `port` is required");
                (this.peerId =
                  "string" == typeof e.peerId
                    ? e.peerId
                    : e.peerId.toString("hex")),
                  (this._peerIdBuffer = r.from(this.peerId, "hex")),
                  (this._peerIdBinary = this._peerIdBuffer.toString("binary")),
                  (this.infoHash =
                    "string" == typeof e.infoHash
                      ? e.infoHash.toLowerCase()
                      : e.infoHash.toString("hex")),
                  (this._infoHashBuffer = r.from(this.infoHash, "hex")),
                  (this._infoHashBinary = this._infoHashBuffer.toString(
                    "binary"
                  )),
                  o("new client %s", this.infoHash),
                  (this.destroyed = !1),
                  (this._port = e.port),
                  (this._getAnnounceOpts = e.getAnnounceOpts),
                  (this._rtcConfig = e.rtcConfig),
                  (this._userAgent = e.userAgent),
                  (this._wrtc =
                    "function" == typeof e.wrtc ? e.wrtc() : e.wrtc);
                let t =
                  "string" == typeof e.announce
                    ? [e.announce]
                    : null == e.announce
                    ? []
                    : e.announce;
                (t = t.map(
                  e => (
                    (e = e.toString()),
                    "/" === e[e.length - 1] &&
                      (e = e.substring(0, e.length - 1)),
                    e
                  )
                )),
                  (t = l(t));
                const i =
                    !1 !== this._wrtc && (!!this._wrtc || s.WEBRTC_SUPPORT),
                  a = e => {
                    n.nextTick(() => {
                      this.emit("warning", e);
                    });
                  };
                this._trackers = t
                  .map(e => {
                    let t;
                    try {
                      t = new URL(e);
                    } catch (t) {
                      return a(new Error(`Invalid tracker URL: ${e}`)), null;
                    }
                    const n = t.port;
                    if (0 > n || 65535 < n)
                      return a(new Error(`Invalid tracker port: ${e}`)), null;
                    const r = t.protocol;
                    return ("http:" === r || "https:" === r) &&
                      "function" == typeof u
                      ? new u(this, e)
                      : "udp:" === r && "function" == typeof f
                      ? new f(this, e)
                      : ("ws:" === r || "wss:" === r) && i
                      ? "ws:" === r &&
                        "undefined" != typeof window &&
                        "https:" === window.location.protocol
                        ? (a(new Error(`Unsupported tracker protocol: ${e}`)),
                          null)
                        : new p(this, e)
                      : (a(new Error(`Unsupported tracker protocol: ${e}`)),
                        null);
                  })
                  .filter(Boolean);
              }
              start(e) {
                (e = this._defaultAnnounceOpts(e)),
                  (e.event = "started"),
                  o("send `start` %o", e),
                  this._announce(e),
                  this._trackers.forEach(e => {
                    e.setInterval();
                  });
              }
              stop(e) {
                (e = this._defaultAnnounceOpts(e)),
                  (e.event = "stopped"),
                  o("send `stop` %o", e),
                  this._announce(e);
              }
              complete(e) {
                e || (e = {}),
                  (e = this._defaultAnnounceOpts(e)),
                  (e.event = "completed"),
                  o("send `complete` %o", e),
                  this._announce(e);
              }
              update(e) {
                (e = this._defaultAnnounceOpts(e)),
                  e.event && delete e.event,
                  o("send `update` %o", e),
                  this._announce(e);
              }
              _announce(e) {
                this._trackers.forEach(t => {
                  t.announce(e);
                });
              }
              scrape(e) {
                o("send `scrape`"),
                  e || (e = {}),
                  this._trackers.forEach(t => {
                    t.scrape(e);
                  });
              }
              setInterval(e) {
                o("setInterval %d", e),
                  this._trackers.forEach(t => {
                    t.setInterval(e);
                  });
              }
              destroy(e) {
                if (!this.destroyed) {
                  (this.destroyed = !0), o("destroy");
                  const t = this._trackers.map(e => t => {
                    e.destroy(t);
                  });
                  d(t, e),
                    (this._trackers = []),
                    (this._getAnnounceOpts = null);
                }
              }
              _defaultAnnounceOpts(e = {}) {
                return (
                  null == e.numwant && (e.numwant = c.DEFAULT_ANNOUNCE_PEERS),
                  null == e.uploaded && (e.uploaded = 0),
                  null == e.downloaded && (e.downloaded = 0),
                  this._getAnnounceOpts &&
                    (e = Object.assign({}, e, this._getAnnounceOpts())),
                  e
                );
              }
            }
            (h.scrape = (e, t) => {
              if (((t = a(t)), !e.infoHash))
                throw new Error("Option `infoHash` is required");
              if (!e.announce) throw new Error("Option `announce` is required");
              const n = Object.assign({}, e, {
                  infoHash: Array.isArray(e.infoHash)
                    ? e.infoHash[0]
                    : e.infoHash,
                  peerId: r.from("01234567890123456789"),
                  port: 6881
                }),
                o = new h(n);
              o.once("error", t), o.once("warning", t);
              let i = Array.isArray(e.infoHash) ? e.infoHash.length : 1;
              const d = {};
              return (
                o.on("scrape", e => {
                  if (((i -= 1), (d[e.infoHash] = e), 0 === i)) {
                    o.destroy();
                    const e = Object.keys(d);
                    1 === e.length ? t(null, d[e[0]]) : t(null, d);
                  }
                }),
                (e.infoHash = Array.isArray(e.infoHash)
                  ? e.infoHash.map(e => r.from(e, "hex"))
                  : r.from(e.infoHash, "hex")),
                o.scrape({ infoHash: e.infoHash }),
                o
              );
            }),
              (t.exports = h);
          }.call(this, e("_process"), e("buffer").Buffer));
        },
        {
          "./lib/client/http-tracker": 21,
          "./lib/client/udp-tracker": 21,
          "./lib/client/websocket-tracker": 17,
          "./lib/common": 18,
          _process: 61,
          buffer: 26,
          debug: 30,
          events: 33,
          once: 56,
          "run-parallel": 89,
          "simple-peer": 94,
          uniq: 114
        }
      ],
      16: [
        function(e, t) {
          const n = e("events");
          t.exports = class extends n {
            constructor(e, t) {
              super(),
                (this.client = e),
                (this.announceUrl = t),
                (this.interval = null),
                (this.destroyed = !1);
            }
            setInterval(e) {
              null == e && (e = this.DEFAULT_ANNOUNCE_INTERVAL),
                clearInterval(this.interval),
                e &&
                  ((this.interval = setInterval(() => {
                    this.announce(this.client._defaultAnnounceOpts());
                  }, e)),
                  this.interval.unref && this.interval.unref());
            }
          };
        },
        { events: 33 }
      ],
      17: [
        function(e, t) {
          function o() {}
          const i = e("debug")("bittorrent-tracker:websocket-tracker"),
            a = e("simple-peer"),
            d = e("randombytes"),
            l = e("simple-websocket"),
            c = e("../common"),
            u = e("./tracker"),
            f = {};
          class p extends u {
            constructor(e, t, n) {
              super(e, t),
                i("new websocket tracker %s", t),
                (this.peers = {}),
                (this.socket = null),
                (this.reconnecting = !1),
                (this.retries = 0),
                (this.reconnectTimer = null),
                (this.expectingResponse = !1),
                this._openSocket();
            }
            announce(e) {
              if (this.destroyed || this.reconnecting) return;
              if (!this.socket.connected)
                return void this.socket.once("connect", () => {
                  this.announce(e);
                });
              const t = Object.assign({}, e, {
                action: "announce",
                info_hash: this.client._infoHashBinary,
                peer_id: this.client._peerIdBinary
              });
              if (
                (this._trackerId && (t.trackerid = this._trackerId),
                "stopped" === e.event || "completed" === e.event)
              )
                this._send(t);
              else {
                const n = s(e.numwant, 10);
                this._generateOffers(n, e => {
                  (t.numwant = n), (t.offers = e), this._send(t);
                });
              }
            }
            scrape(e) {
              if (this.destroyed || this.reconnecting) return;
              if (!this.socket.connected)
                return void this.socket.once("connect", () => {
                  this.scrape(e);
                });
              const t =
                Array.isArray(e.infoHash) && 0 < e.infoHash.length
                  ? e.infoHash.map(e => e.toString("binary"))
                  : (e.infoHash && e.infoHash.toString("binary")) ||
                    this.client._infoHashBinary;
              this._send({ action: "scrape", info_hash: t });
            }
            destroy(e = o) {
              function t() {
                r && (clearTimeout(r), (r = null)),
                  n.removeListener("data", t),
                  n.destroy(),
                  (n = null);
              }
              if (this.destroyed) return e(null);
              for (const t in ((this.destroyed = !0),
              clearInterval(this.interval),
              clearTimeout(this.reconnectTimer),
              this.peers)) {
                const e = this.peers[t];
                clearTimeout(e.trackerTimeout), e.destroy();
              }
              if (
                ((this.peers = null),
                this.socket &&
                  (this.socket.removeListener(
                    "connect",
                    this._onSocketConnectBound
                  ),
                  this.socket.removeListener("data", this._onSocketDataBound),
                  this.socket.removeListener("close", this._onSocketCloseBound),
                  this.socket.removeListener("error", this._onSocketErrorBound),
                  (this.socket = null)),
                (this._onSocketConnectBound = null),
                (this._onSocketErrorBound = null),
                (this._onSocketDataBound = null),
                (this._onSocketCloseBound = null),
                f[this.announceUrl] && (f[this.announceUrl].consumers -= 1),
                0 < f[this.announceUrl].consumers)
              )
                return e();
              let n = f[this.announceUrl];
              if (
                (delete f[this.announceUrl],
                n.on("error", o),
                n.once("close", e),
                !this.expectingResponse)
              )
                return t();
              var r = setTimeout(t, c.DESTROY_TIMEOUT);
              n.once("data", t);
            }
            _openSocket() {
              (this.destroyed = !1),
                this.peers || (this.peers = {}),
                (this._onSocketConnectBound = () => {
                  this._onSocketConnect();
                }),
                (this._onSocketErrorBound = e => {
                  this._onSocketError(e);
                }),
                (this._onSocketDataBound = e => {
                  this._onSocketData(e);
                }),
                (this._onSocketCloseBound = () => {
                  this._onSocketClose();
                }),
                (this.socket = f[this.announceUrl]),
                this.socket
                  ? ((f[this.announceUrl].consumers += 1),
                    this.socket.connected && this._onSocketConnectBound())
                  : ((this.socket = f[this.announceUrl] = new l(
                      this.announceUrl
                    )),
                    (this.socket.consumers = 1),
                    this.socket.once("connect", this._onSocketConnectBound)),
                this.socket.on("data", this._onSocketDataBound),
                this.socket.once("close", this._onSocketCloseBound),
                this.socket.once("error", this._onSocketErrorBound);
            }
            _onSocketConnect() {
              this.destroyed ||
                (this.reconnecting &&
                  ((this.reconnecting = !1),
                  (this.retries = 0),
                  this.announce(this.client._defaultAnnounceOpts())));
            }
            _onSocketData(e) {
              if (!this.destroyed) {
                this.expectingResponse = !1;
                try {
                  e = JSON.parse(e);
                } catch (e) {
                  return void this.client.emit(
                    "warning",
                    new Error("Invalid tracker response")
                  );
                }
                "announce" === e.action
                  ? this._onAnnounceResponse(e)
                  : "scrape" === e.action
                  ? this._onScrapeResponse(e)
                  : this._onSocketError(
                      new Error(`invalid action in WS response: ${e.action}`)
                    );
              }
            }
            _onAnnounceResponse(e) {
              if (e.info_hash !== this.client._infoHashBinary)
                return void i(
                  "ignoring websocket data from %s for %s (looking for %s: reused socket)",
                  this.announceUrl,
                  c.binaryToHex(e.info_hash),
                  this.client.infoHash
                );
              if (e.peer_id && e.peer_id === this.client._peerIdBinary) return;
              i(
                "received %s from %s for %s",
                JSON.stringify(e),
                this.announceUrl,
                this.client.infoHash
              );
              const t = e["failure reason"];
              if (t) return this.client.emit("warning", new Error(t));
              const n = e["warning message"];
              n && this.client.emit("warning", new Error(n));
              const r = e.interval || e["min interval"];
              r && this.setInterval(1e3 * r);
              const o = e["tracker id"];
              if ((o && (this._trackerId = o), null != e.complete)) {
                const t = Object.assign({}, e, {
                  announce: this.announceUrl,
                  infoHash: c.binaryToHex(e.info_hash)
                });
                this.client.emit("update", t);
              }
              let a;
              if (
                (e.offer &&
                  e.peer_id &&
                  (i("creating peer (from remote offer)"),
                  (a = this._createPeer()),
                  (a.id = c.binaryToHex(e.peer_id)),
                  a.once("signal", t => {
                    const n = {
                      action: "announce",
                      info_hash: this.client._infoHashBinary,
                      peer_id: this.client._peerIdBinary,
                      to_peer_id: e.peer_id,
                      answer: t,
                      offer_id: e.offer_id
                    };
                    this._trackerId && (n.trackerid = this._trackerId),
                      this._send(n);
                  }),
                  a.signal(e.offer),
                  this.client.emit("peer", a)),
                e.answer && e.peer_id)
              ) {
                const t = c.binaryToHex(e.offer_id);
                (a = this.peers[t]),
                  a
                    ? ((a.id = c.binaryToHex(e.peer_id)),
                      a.signal(e.answer),
                      this.client.emit("peer", a),
                      clearTimeout(a.trackerTimeout),
                      (a.trackerTimeout = null),
                      delete this.peers[t])
                    : i(`got unexpected answer: ${JSON.stringify(e.answer)}`);
              }
            }
            _onScrapeResponse(e) {
              e = e.files || {};
              const t = Object.keys(e);
              return 0 === t.length
                ? void this.client.emit(
                    "warning",
                    new Error("invalid scrape response")
                  )
                : void t.forEach(t => {
                    const n = Object.assign(e[t], {
                      announce: this.announceUrl,
                      infoHash: c.binaryToHex(t)
                    });
                    this.client.emit("scrape", n);
                  });
            }
            _onSocketClose() {
              this.destroyed || (this.destroy(), this._startReconnectTimer());
            }
            _onSocketError(e) {
              this.destroyed ||
                (this.destroy(),
                this.client.emit("warning", e),
                this._startReconnectTimer());
            }
            _startReconnectTimer() {
              const e =
                r(Math.random() * 120000) +
                s(n(2, this.retries) * 10000, 1800000);
              (this.reconnecting = !0),
                clearTimeout(this.reconnectTimer),
                (this.reconnectTimer = setTimeout(() => {
                  this.retries++, this._openSocket();
                }, e)),
                this.reconnectTimer.unref && this.reconnectTimer.unref(),
                i("reconnecting socket in %s ms", e);
            }
            _send(e) {
              if (!this.destroyed) {
                this.expectingResponse = !0;
                const t = JSON.stringify(e);
                i("send %s", t), this.socket.send(t);
              }
            }
            _generateOffers(e, t) {
              function n() {
                const e = d(20).toString("hex");
                i("creating peer (from _generateOffers)");
                const t = (o.peers[e] = o._createPeer({ initiator: !0 }));
                t.once("signal", t => {
                  a.push({ offer: t, offer_id: c.hexToBinary(e) }), r();
                }),
                  (t.trackerTimeout = setTimeout(() => {
                    i("tracker timeout: destroying peer"),
                      (t.trackerTimeout = null),
                      delete o.peers[e],
                      t.destroy();
                  }, 50000)),
                  t.trackerTimeout.unref && t.trackerTimeout.unref();
              }
              function r() {
                a.length === e && (i("generated %s offers", e), t(a));
              }
              const o = this,
                a = [];
              i("generating %s offers", e);
              for (let r = 0; r < e; ++r) n();
              r();
            }
            _createPeer(e) {
              function t(e) {
                r.client.emit(
                  "warning",
                  new Error(`Connection error: ${e.message}`)
                ),
                  o.destroy();
              }
              function n() {
                o.removeListener("error", t), o.removeListener("connect", n);
              }
              const r = this;
              e = Object.assign(
                {
                  trickle: !1,
                  config: r.client._rtcConfig,
                  wrtc: r.client._wrtc
                },
                e
              );
              const o = new a(e);
              return o.once("error", t), o.once("connect", n), o;
            }
          }
          (p.prototype.DEFAULT_ANNOUNCE_INTERVAL = 30000),
            (p._socketPool = f),
            (t.exports = p);
        },
        {
          "../common": 18,
          "./tracker": 16,
          debug: 30,
          randombytes: 69,
          "simple-peer": 94,
          "simple-websocket": 97
        }
      ],
      18: [
        function(e, t, n) {
          (function(t) {
            (n.DEFAULT_ANNOUNCE_PEERS = 50),
              (n.MAX_ANNOUNCE_PEERS = 82),
              (n.binaryToHex = function(e) {
                return (
                  "string" != typeof e && (e += ""),
                  t.from(e, "binary").toString("hex")
                );
              }),
              (n.hexToBinary = function(e) {
                return (
                  "string" != typeof e && (e += ""),
                  t.from(e, "hex").toString("binary")
                );
              });
            var r = e("./common-node");
            Object.assign(n, r);
          }.call(this, e("buffer").Buffer));
        },
        { "./common-node": 21, buffer: 26 }
      ],
      19: [
        function(e, t) {
          (function(n) {
            t.exports = function(e, t) {
              function r(i) {
                o.removeEventListener("loadend", r, !1),
                  i.error ? t(i.error) : t(null, n.from(o.result));
              }
              if ("undefined" == typeof Blob || !(e instanceof Blob))
                throw new Error("first argument must be a Blob");
              if ("function" != typeof t)
                throw new Error("second argument must be a function");
              var o = new FileReader();
              o.addEventListener("loadend", r, !1), o.readAsArrayBuffer(e);
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      20: [
        function(e, t) {
          (function(n) {
            const { Transform: r } = e("readable-stream");
            t.exports = class extends r {
              constructor(e, t = {}) {
                super(t),
                  "object" == typeof e && ((t = e), (e = t.size)),
                  (this.size = e || 512);
                const { nopad: n, zeroPadding: r = !0 } = t;
                (this._zeroPadding = !n && !!r),
                  (this._buffered = []),
                  (this._bufferedBytes = 0);
              }
              _transform(e, t, r) {
                for (
                  this._bufferedBytes += e.length, this._buffered.push(e);
                  this._bufferedBytes >= this.size;

                ) {
                  const e = n.concat(this._buffered);
                  (this._bufferedBytes -= this.size),
                    this.push(e.slice(0, this.size)),
                    (this._buffered = [e.slice(this.size, e.length)]);
                }
                r();
              }
              _flush() {
                if (this._bufferedBytes && this._zeroPadding) {
                  const e = n.alloc(this.size - this._bufferedBytes);
                  this._buffered.push(e),
                    this.push(n.concat(this._buffered)),
                    (this._buffered = null);
                } else
                  this._bufferedBytes &&
                    (this.push(n.concat(this._buffered)),
                    (this._buffered = null));
                this.push(null);
              }
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26, "readable-stream": 85 }
      ],
      21: [function() {}, {}],
      22: [
        function(e, t, n) {
          arguments[4][21][0].apply(n, arguments);
        },
        { dup: 21 }
      ],
      23: [
        function(e, t) {
          (function(e) {
            t.exports = function(t) {
              if ("number" != typeof t)
                throw new TypeError('"size" argument must be a number');
              if (0 > t)
                throw new RangeError('"size" argument must not be negative');
              return e.allocUnsafe ? e.allocUnsafe(t) : new e(t);
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      24: [
        function(e, t) {
          (function(n) {
            var r = e("buffer-fill"),
              o = e("buffer-alloc-unsafe");
            t.exports = function(e, t, i) {
              if ("number" != typeof e)
                throw new TypeError('"size" argument must be a number');
              if (0 > e)
                throw new RangeError('"size" argument must not be negative');
              if (n.alloc) return n.alloc(e, t, i);
              var a = o(e);
              return 0 === e
                ? a
                : void 0 === t
                ? r(a, 0)
                : ("string" != typeof i && (i = void 0), r(a, t, i));
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26, "buffer-alloc-unsafe": 23, "buffer-fill": 25 }
      ],
      25: [
        function(e, t) {
          (function(e) {
            function n(e) {
              return 1 === e.length && 256 > e.charCodeAt(0);
            }
            function r(e, t, n, r) {
              if (0 > n || r > e.length)
                throw new RangeError("Out of range index");
              return (
                (n >>>= 0),
                (r = void 0 === r ? e.length : r >>> 0),
                r > n && e.fill(t, n, r),
                e
              );
            }
            function o(e, t, n, r) {
              if (0 > n || r > e.length)
                throw new RangeError("Out of range index");
              if (r <= n) return e;
              (n >>>= 0), (r = void 0 === r ? e.length : r >>> 0);
              for (var o = n, i = t.length; o <= r - i; )
                t.copy(e, o), (o += i);
              return o !== r && t.copy(e, o, 0, r - o), e;
            }
            var i = (function() {
              try {
                if (!e.isEncoding("latin1")) return !1;
                var t = e.alloc ? e.alloc(4) : new e(4);
                return t.fill("ab", "ucs2"), "61006200" === t.toString("hex");
              } catch (e) {
                return !1;
              }
            })();
            t.exports = function(t, a, d, s, l) {
              if (i) return t.fill(a, d, s, l);
              if ("number" == typeof a) return r(t, a, d, s);
              if ("string" == typeof a) {
                if (
                  ("string" == typeof d
                    ? ((l = d), (d = 0), (s = t.length))
                    : "string" == typeof s && ((l = s), (s = t.length)),
                  void 0 !== l && "string" != typeof l)
                )
                  throw new TypeError("encoding must be a string");
                if (
                  ("latin1" === l && (l = "binary"),
                  "string" == typeof l && !e.isEncoding(l))
                )
                  throw new TypeError("Unknown encoding: " + l);
                if ("" === a) return r(t, 0, d, s);
                if (n(a)) return r(t, a.charCodeAt(0), d, s);
                a = new e(a, l);
              }
              return e.isBuffer(a) ? o(t, a, d, s) : r(t, 0, d, s);
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      26: [
        function(e, t, r) {
          (function(t) {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <https://feross.org>
             * @license  MIT
             */ "use strict";
            function a(e) {
              if (2147483647 < e)
                throw new RangeError(
                  'The value "' + e + '" is invalid for option "size"'
                );
              var n = new Uint8Array(e);
              return Object.setPrototypeOf(n, t.prototype), n;
            }
            function t(e, n, r) {
              if ("number" == typeof e) {
                if ("string" == typeof n)
                  throw new TypeError(
                    'The "string" argument must be of type string. Received type number'
                  );
                return u(e);
              }
              return d(e, n, r);
            }
            function d(e, n, r) {
              if ("string" == typeof e) return f(e, n);
              if (ArrayBuffer.isView(e)) return p(e);
              if (null == e)
                throw new TypeError(
                  "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " +
                    typeof e
                );
              if (K(e, ArrayBuffer) || (e && K(e.buffer, ArrayBuffer)))
                return h(e, n, r);
              if ("number" == typeof e)
                throw new TypeError(
                  'The "value" argument must not be of type number. Received type number'
                );
              var o = e.valueOf && e.valueOf();
              if (null != o && o !== e) return t.from(o, n, r);
              var i = m(e);
              if (i) return i;
              if (
                "undefined" != typeof Symbol &&
                null != Symbol.toPrimitive &&
                "function" == typeof e[Symbol.toPrimitive]
              )
                return t.from(e[Symbol.toPrimitive]("string"), n, r);
              throw new TypeError(
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " +
                  typeof e
              );
            }
            function l(e) {
              if ("number" != typeof e)
                throw new TypeError('"size" argument must be of type number');
              else if (0 > e)
                throw new RangeError(
                  'The value "' + e + '" is invalid for option "size"'
                );
            }
            function c(e, t, n) {
              return (
                l(e),
                0 >= e
                  ? a(e)
                  : void 0 === t
                  ? a(e)
                  : "string" == typeof n
                  ? a(e).fill(t, n)
                  : a(e).fill(t)
              );
            }
            function u(e) {
              return l(e), a(0 > e ? 0 : 0 | g(e));
            }
            function f(e, n) {
              if (
                (("string" != typeof n || "" === n) && (n = "utf8"),
                !t.isEncoding(n))
              )
                throw new TypeError("Unknown encoding: " + n);
              var r = 0 | b(e, n),
                o = a(r),
                i = o.write(e, n);
              return i !== r && (o = o.slice(0, i)), o;
            }
            function p(e) {
              for (
                var t = 0 > e.length ? 0 : 0 | g(e.length), n = a(t), r = 0;
                r < t;
                r += 1
              )
                n[r] = 255 & e[r];
              return n;
            }
            function h(e, n, r) {
              if (0 > n || e.byteLength < n)
                throw new RangeError('"offset" is outside of buffer bounds');
              if (e.byteLength < n + (r || 0))
                throw new RangeError('"length" is outside of buffer bounds');
              var o;
              return (
                (o =
                  void 0 === n && void 0 === r
                    ? new Uint8Array(e)
                    : void 0 === r
                    ? new Uint8Array(e, n)
                    : new Uint8Array(e, n, r)),
                Object.setPrototypeOf(o, t.prototype),
                o
              );
            }
            function m(e) {
              if (t.isBuffer(e)) {
                var n = 0 | g(e.length),
                  r = a(n);
                return 0 === r.length ? r : (e.copy(r, 0, 0, n), r);
              }
              return void 0 === e.length
                ? "Buffer" === e.type && Array.isArray(e.data)
                  ? p(e.data)
                  : void 0
                : "number" != typeof e.length || Y(e.length)
                ? a(0)
                : p(e);
            }
            function g(e) {
              if (e >= 2147483647)
                throw new RangeError(
                  "Attempt to allocate Buffer larger than maximum size: 0x" +
                    (2147483647).toString(16) +
                    " bytes"
                );
              return 0 | e;
            }
            function _(e) {
              return +e != e && (e = 0), t.alloc(+e);
            }
            function b(e, n) {
              if (t.isBuffer(e)) return e.length;
              if (ArrayBuffer.isView(e) || K(e, ArrayBuffer))
                return e.byteLength;
              if ("string" != typeof e)
                throw new TypeError(
                  'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' +
                    typeof e
                );
              var r = e.length,
                o = 2 < arguments.length && !0 === arguments[2];
              if (!o && 0 === r) return 0;
              for (var i = !1; ; )
                switch (n) {
                  case "ascii":
                  case "latin1":
                  case "binary":
                    return r;
                  case "utf8":
                  case "utf-8":
                    return F(e).length;
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return 2 * r;
                  case "hex":
                    return r >>> 1;
                  case "base64":
                    return V(e).length;
                  default:
                    if (i) return o ? -1 : F(e).length;
                    (n = ("" + n).toLowerCase()), (i = !0);
                }
            }
            function y(e, t, n) {
              var r = !1;
              if (((void 0 === t || 0 > t) && (t = 0), t > this.length))
                return "";
              if (
                ((void 0 === n || n > this.length) && (n = this.length), 0 >= n)
              )
                return "";
              if (((n >>>= 0), (t >>>= 0), n <= t)) return "";
              for (e || (e = "utf8"); ; )
                switch (e) {
                  case "hex":
                    return P(this, t, n);
                  case "utf8":
                  case "utf-8":
                    return B(this, t, n);
                  case "ascii":
                    return A(this, t, n);
                  case "latin1":
                  case "binary":
                    return U(this, t, n);
                  case "base64":
                    return T(this, t, n);
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return O(this, t, n);
                  default:
                    if (r) throw new TypeError("Unknown encoding: " + e);
                    (e = (e + "").toLowerCase()), (r = !0);
                }
            }
            function w(e, t, n) {
              var r = e[t];
              (e[t] = e[n]), (e[n] = r);
            }
            function k(e, n, r, o, i) {
              if (0 === e.length) return -1;
              if (
                ("string" == typeof r
                  ? ((o = r), (r = 0))
                  : 2147483647 < r
                  ? (r = 2147483647)
                  : -2147483648 > r && (r = -2147483648),
                (r = +r),
                Y(r) && (r = i ? 0 : e.length - 1),
                0 > r && (r = e.length + r),
                r >= e.length)
              ) {
                if (i) return -1;
                r = e.length - 1;
              } else if (0 > r)
                if (i) r = 0;
                else return -1;
              if (("string" == typeof n && (n = t.from(n, o)), t.isBuffer(n)))
                return 0 === n.length ? -1 : E(e, n, r, o, i);
              if ("number" == typeof n)
                return (
                  (n &= 255),
                  "function" == typeof Uint8Array.prototype.indexOf
                    ? i
                      ? Uint8Array.prototype.indexOf.call(e, n, r)
                      : Uint8Array.prototype.lastIndexOf.call(e, n, r)
                    : E(e, [n], r, o, i)
                );
              throw new TypeError("val must be string, number or Buffer");
            }
            function E(e, t, n, r, o) {
              function a(e, t) {
                return 1 === d ? e[t] : e.readUInt16BE(t * d);
              }
              var d = 1,
                s = e.length,
                l = t.length;
              if (
                void 0 !== r &&
                ((r = (r + "").toLowerCase()),
                "ucs2" === r ||
                  "ucs-2" === r ||
                  "utf16le" === r ||
                  "utf-16le" === r)
              ) {
                if (2 > e.length || 2 > t.length) return -1;
                (d = 2), (s /= 2), (l /= 2), (n /= 2);
              }
              var c;
              if (o) {
                var u = -1;
                for (c = n; c < s; c++)
                  if (a(e, c) !== a(t, -1 === u ? 0 : c - u))
                    -1 !== u && (c -= c - u), (u = -1);
                  else if ((-1 === u && (u = c), c - u + 1 === l)) return u * d;
              } else
                for (n + l > s && (n = s - l), c = n; 0 <= c; c--) {
                  for (var f = !0, p = 0; p < l; p++)
                    if (a(e, c + p) !== a(t, p)) {
                      f = !1;
                      break;
                    }
                  if (f) return c;
                }
              return -1;
            }
            function x(e, t, n, r) {
              n = +n || 0;
              var o = e.length - n;
              r ? ((r = +r), r > o && (r = o)) : (r = o);
              var a = t.length;
              r > a / 2 && (r = a / 2);
              for (var d = 0, s; d < r; ++d) {
                if (((s = parseInt(t.substr(2 * d, 2), 16)), Y(s))) return d;
                e[n + d] = s;
              }
              return d;
            }
            function v(e, t, n, r) {
              return G(F(t, e.length - n), e, n, r);
            }
            function S(e, t, n, r) {
              return G(W(t), e, n, r);
            }
            function C(e, t, n, r) {
              return S(e, t, n, r);
            }
            function I(e, t, n, r) {
              return G(V(t), e, n, r);
            }
            function L(e, t, n, r) {
              return G(z(t, e.length - n), e, n, r);
            }
            function T(e, t, n) {
              return 0 === t && n === e.length
                ? X.fromByteArray(e)
                : X.fromByteArray(e.slice(t, n));
            }
            function B(e, t, n) {
              n = s(e.length, n);
              for (var r = [], o = t; o < n; ) {
                var a = e[o],
                  d = null,
                  l = 239 < a ? 4 : 223 < a ? 3 : 191 < a ? 2 : 1;
                if (o + l <= n) {
                  var c, u, f, p;
                  1 === l
                    ? 128 > a && (d = a)
                    : 2 === l
                    ? ((c = e[o + 1]),
                      128 == (192 & c) &&
                        ((p = ((31 & a) << 6) | (63 & c)), 127 < p && (d = p)))
                    : 3 === l
                    ? ((c = e[o + 1]),
                      (u = e[o + 2]),
                      128 == (192 & c) &&
                        128 == (192 & u) &&
                        ((p = ((15 & a) << 12) | ((63 & c) << 6) | (63 & u)),
                        2047 < p && (55296 > p || 57343 < p) && (d = p)))
                    : 4 === l
                    ? ((c = e[o + 1]),
                      (u = e[o + 2]),
                      (f = e[o + 3]),
                      128 == (192 & c) &&
                        128 == (192 & u) &&
                        128 == (192 & f) &&
                        ((p =
                          ((15 & a) << 18) |
                          ((63 & c) << 12) |
                          ((63 & u) << 6) |
                          (63 & f)),
                        65535 < p && 1114112 > p && (d = p)))
                    : void 0;
                }
                null === d
                  ? ((d = 65533), (l = 1))
                  : 65535 < d &&
                    ((d -= 65536),
                    r.push(55296 | (1023 & (d >>> 10))),
                    (d = 56320 | (1023 & d))),
                  r.push(d),
                  (o += l);
              }
              return R(r);
            }
            function R(e) {
              var t = e.length;
              if (t <= 4096) return o.apply(String, e);
              for (var n = "", r = 0; r < t; )
                n += o.apply(String, e.slice(r, (r += 4096)));
              return n;
            }
            function A(e, t, n) {
              var r = "";
              n = s(e.length, n);
              for (var a = t; a < n; ++a) r += o(127 & e[a]);
              return r;
            }
            function U(e, t, n) {
              var r = "";
              n = s(e.length, n);
              for (var a = t; a < n; ++a) r += o(e[a]);
              return r;
            }
            function P(e, t, n) {
              var r = e.length;
              (!t || 0 > t) && (t = 0), (!n || 0 > n || n > r) && (n = r);
              for (var o = "", a = t; a < n; ++a) o += Z[e[a]];
              return o;
            }
            function O(e, t, n) {
              for (var r = e.slice(t, n), a = "", d = 0; d < r.length; d += 2)
                a += o(r[d] + 256 * r[d + 1]);
              return a;
            }
            function N(e, t, n) {
              if (0 != e % 1 || 0 > e)
                throw new RangeError("offset is not uint");
              if (e + t > n)
                throw new RangeError("Trying to access beyond buffer length");
            }
            function M(e, n, r, o, i, a) {
              if (!t.isBuffer(e))
                throw new TypeError(
                  '"buffer" argument must be a Buffer instance'
                );
              if (n > i || n < a)
                throw new RangeError('"value" argument is out of bounds');
              if (r + o > e.length) throw new RangeError("Index out of range");
            }
            function H(e, t, n, r) {
              if (n + r > e.length) throw new RangeError("Index out of range");
              if (0 > n) throw new RangeError("Index out of range");
            }
            function q(e, t, n, r, o) {
              return (
                (t = +t),
                (n >>>= 0),
                o || H(e, t, n, 4, 34028234663852886e22, -34028234663852886e22),
                $.write(e, t, n, r, 23, 4),
                n + 4
              );
            }
            function D(e, t, n, r, o) {
              return (
                (t = +t),
                (n >>>= 0),
                o ||
                  H(e, t, n, 8, 17976931348623157e292, -17976931348623157e292),
                $.write(e, t, n, r, 52, 8),
                n + 8
              );
            }
            function j(e) {
              if (
                ((e = e.split("=")[0]),
                (e = e.trim().replace(J, "")),
                2 > e.length)
              )
                return "";
              for (; 0 != e.length % 4; ) e += "=";
              return e;
            }
            function F(e, t) {
              t = t || 1 / 0;
              for (var n = e.length, r = null, o = [], a = 0, d; a < n; ++a) {
                if (((d = e.charCodeAt(a)), 55295 < d && 57344 > d)) {
                  if (!r) {
                    if (56319 < d) {
                      -1 < (t -= 3) && o.push(239, 191, 189);
                      continue;
                    } else if (a + 1 === n) {
                      -1 < (t -= 3) && o.push(239, 191, 189);
                      continue;
                    }
                    r = d;
                    continue;
                  }
                  if (56320 > d) {
                    -1 < (t -= 3) && o.push(239, 191, 189), (r = d);
                    continue;
                  }
                  d = (((r - 55296) << 10) | (d - 56320)) + 65536;
                } else r && -1 < (t -= 3) && o.push(239, 191, 189);
                if (((r = null), 128 > d)) {
                  if (0 > (t -= 1)) break;
                  o.push(d);
                } else if (2048 > d) {
                  if (0 > (t -= 2)) break;
                  o.push(192 | (d >> 6), 128 | (63 & d));
                } else if (65536 > d) {
                  if (0 > (t -= 3)) break;
                  o.push(
                    224 | (d >> 12),
                    128 | (63 & (d >> 6)),
                    128 | (63 & d)
                  );
                } else if (1114112 > d) {
                  if (0 > (t -= 4)) break;
                  o.push(
                    240 | (d >> 18),
                    128 | (63 & (d >> 12)),
                    128 | (63 & (d >> 6)),
                    128 | (63 & d)
                  );
                } else throw new Error("Invalid code point");
              }
              return o;
            }
            function W(e) {
              for (var t = [], n = 0; n < e.length; ++n)
                t.push(255 & e.charCodeAt(n));
              return t;
            }
            function z(e, t) {
              for (
                var n = [], r = 0, o, a, d;
                r < e.length && !(0 > (t -= 2));
                ++r
              )
                (o = e.charCodeAt(r)),
                  (a = o >> 8),
                  (d = o % 256),
                  n.push(d),
                  n.push(a);
              return n;
            }
            function V(e) {
              return X.toByteArray(j(e));
            }
            function G(e, t, n, r) {
              for (
                var o = 0;
                o < r && !(o + n >= t.length || o >= e.length);
                ++o
              )
                t[o + n] = e[o];
              return o;
            }
            function K(e, t) {
              return (
                e instanceof t ||
                (null != e &&
                  null != e.constructor &&
                  null != e.constructor.name &&
                  e.constructor.name === t.name)
              );
            }
            function Y(e) {
              return e !== e;
            }
            var X = e("base64-js"),
              $ = e("ieee754"),
              Q =
                "function" == typeof Symbol && "function" == typeof Symbol.for
                  ? Symbol.for("nodejs.util.inspect.custom")
                  : null;
            (r.Buffer = t), (r.SlowBuffer = _), (r.INSPECT_MAX_BYTES = 50);
            (r.kMaxLength = 2147483647),
              (t.TYPED_ARRAY_SUPPORT = (function() {
                try {
                  var e = new Uint8Array(1),
                    t = {
                      foo: function() {
                        return 42;
                      }
                    };
                  return (
                    Object.setPrototypeOf(t, Uint8Array.prototype),
                    Object.setPrototypeOf(e, t),
                    42 === e.foo()
                  );
                } catch (t) {
                  return !1;
                }
              })()),
              t.TYPED_ARRAY_SUPPORT ||
                "undefined" == typeof console ||
                "function" != typeof console.error ||
                console.error(
                  "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
                ),
              Object.defineProperty(t.prototype, "parent", {
                enumerable: !0,
                get: function() {
                  return t.isBuffer(this) ? this.buffer : void 0;
                }
              }),
              Object.defineProperty(t.prototype, "offset", {
                enumerable: !0,
                get: function() {
                  return t.isBuffer(this) ? this.byteOffset : void 0;
                }
              }),
              "undefined" != typeof Symbol &&
                null != Symbol.species &&
                t[Symbol.species] === t &&
                Object.defineProperty(t, Symbol.species, {
                  value: null,
                  configurable: !0,
                  enumerable: !1,
                  writable: !1
                }),
              (t.poolSize = 8192),
              (t.from = function(e, t, n) {
                return d(e, t, n);
              }),
              Object.setPrototypeOf(t.prototype, Uint8Array.prototype),
              Object.setPrototypeOf(t, Uint8Array),
              (t.alloc = function(e, t, n) {
                return c(e, t, n);
              }),
              (t.allocUnsafe = function(e) {
                return u(e);
              }),
              (t.allocUnsafeSlow = function(e) {
                return u(e);
              }),
              (t.isBuffer = function(e) {
                return null != e && !0 === e._isBuffer && e !== t.prototype;
              }),
              (t.compare = function(e, n) {
                if (
                  (K(e, Uint8Array) && (e = t.from(e, e.offset, e.byteLength)),
                  K(n, Uint8Array) && (n = t.from(n, n.offset, n.byteLength)),
                  !t.isBuffer(e) || !t.isBuffer(n))
                )
                  throw new TypeError(
                    'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                  );
                if (e === n) return 0;
                for (
                  var r = e.length, o = n.length, d = 0, l = s(r, o);
                  d < l;
                  ++d
                )
                  if (e[d] !== n[d]) {
                    (r = e[d]), (o = n[d]);
                    break;
                  }
                return r < o ? -1 : o < r ? 1 : 0;
              }),
              (t.isEncoding = function(e) {
                switch ((e + "").toLowerCase()) {
                  case "hex":
                  case "utf8":
                  case "utf-8":
                  case "ascii":
                  case "latin1":
                  case "binary":
                  case "base64":
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return !0;
                  default:
                    return !1;
                }
              }),
              (t.concat = function(e, n) {
                if (!Array.isArray(e))
                  throw new TypeError(
                    '"list" argument must be an Array of Buffers'
                  );
                if (0 === e.length) return t.alloc(0);
                var r;
                if (n === void 0)
                  for (n = 0, r = 0; r < e.length; ++r) n += e[r].length;
                var o = t.allocUnsafe(n),
                  a = 0;
                for (r = 0; r < e.length; ++r) {
                  var d = e[r];
                  if ((K(d, Uint8Array) && (d = t.from(d)), !t.isBuffer(d)))
                    throw new TypeError(
                      '"list" argument must be an Array of Buffers'
                    );
                  d.copy(o, a), (a += d.length);
                }
                return o;
              }),
              (t.byteLength = b),
              (t.prototype._isBuffer = !0),
              (t.prototype.swap16 = function() {
                var e = this.length;
                if (0 != e % 2)
                  throw new RangeError(
                    "Buffer size must be a multiple of 16-bits"
                  );
                for (var t = 0; t < e; t += 2) w(this, t, t + 1);
                return this;
              }),
              (t.prototype.swap32 = function() {
                var e = this.length;
                if (0 != e % 4)
                  throw new RangeError(
                    "Buffer size must be a multiple of 32-bits"
                  );
                for (var t = 0; t < e; t += 4)
                  w(this, t, t + 3), w(this, t + 1, t + 2);
                return this;
              }),
              (t.prototype.swap64 = function() {
                var e = this.length;
                if (0 != e % 8)
                  throw new RangeError(
                    "Buffer size must be a multiple of 64-bits"
                  );
                for (var t = 0; t < e; t += 8)
                  w(this, t, t + 7),
                    w(this, t + 1, t + 6),
                    w(this, t + 2, t + 5),
                    w(this, t + 3, t + 4);
                return this;
              }),
              (t.prototype.toString = function() {
                var e = this.length;
                return 0 === e
                  ? ""
                  : 0 === arguments.length
                  ? B(this, 0, e)
                  : y.apply(this, arguments);
              }),
              (t.prototype.toLocaleString = t.prototype.toString),
              (t.prototype.equals = function(e) {
                if (!t.isBuffer(e))
                  throw new TypeError("Argument must be a Buffer");
                return this === e || 0 === t.compare(this, e);
              }),
              (t.prototype.inspect = function() {
                var e = "",
                  t = r.INSPECT_MAX_BYTES;
                return (
                  (e = this.toString("hex", 0, t)
                    .replace(/(.{2})/g, "$1 ")
                    .trim()),
                  this.length > t && (e += " ... "),
                  "<Buffer " + e + ">"
                );
              }),
              Q && (t.prototype[Q] = t.prototype.inspect),
              (t.prototype.compare = function(e, n, r, o, a) {
                if (
                  (K(e, Uint8Array) && (e = t.from(e, e.offset, e.byteLength)),
                  !t.isBuffer(e))
                )
                  throw new TypeError(
                    'The "target" argument must be one of type Buffer or Uint8Array. Received type ' +
                      typeof e
                  );
                if (
                  (void 0 === n && (n = 0),
                  void 0 === r && (r = e ? e.length : 0),
                  void 0 === o && (o = 0),
                  void 0 === a && (a = this.length),
                  0 > n || r > e.length || 0 > o || a > this.length)
                )
                  throw new RangeError("out of range index");
                if (o >= a && n >= r) return 0;
                if (o >= a) return -1;
                if (n >= r) return 1;
                if (
                  ((n >>>= 0), (r >>>= 0), (o >>>= 0), (a >>>= 0), this === e)
                )
                  return 0;
                for (
                  var d = a - o,
                    l = r - n,
                    c = s(d, l),
                    u = this.slice(o, a),
                    f = e.slice(n, r),
                    p = 0;
                  p < c;
                  ++p
                )
                  if (u[p] !== f[p]) {
                    (d = u[p]), (l = f[p]);
                    break;
                  }
                return d < l ? -1 : l < d ? 1 : 0;
              }),
              (t.prototype.includes = function(e, t, n) {
                return -1 !== this.indexOf(e, t, n);
              }),
              (t.prototype.indexOf = function(e, t, n) {
                return k(this, e, t, n, !0);
              }),
              (t.prototype.lastIndexOf = function(e, t, n) {
                return k(this, e, t, n, !1);
              }),
              (t.prototype.write = function(e, t, n, r) {
                if (void 0 === t) (r = "utf8"), (n = this.length), (t = 0);
                else if (void 0 === n && "string" == typeof t)
                  (r = t), (n = this.length), (t = 0);
                else if (isFinite(t))
                  (t >>>= 0),
                    isFinite(n)
                      ? ((n >>>= 0), void 0 === r && (r = "utf8"))
                      : ((r = n), (n = void 0));
                else
                  throw new Error(
                    "Buffer.write(string, encoding, offset[, length]) is no longer supported"
                  );
                var o = this.length - t;
                if (
                  ((void 0 === n || n > o) && (n = o),
                  (0 < e.length && (0 > n || 0 > t)) || t > this.length)
                )
                  throw new RangeError(
                    "Attempt to write outside buffer bounds"
                  );
                r || (r = "utf8");
                for (var i = !1; ; )
                  switch (r) {
                    case "hex":
                      return x(this, e, t, n);
                    case "utf8":
                    case "utf-8":
                      return v(this, e, t, n);
                    case "ascii":
                      return S(this, e, t, n);
                    case "latin1":
                    case "binary":
                      return C(this, e, t, n);
                    case "base64":
                      return I(this, e, t, n);
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                      return L(this, e, t, n);
                    default:
                      if (i) throw new TypeError("Unknown encoding: " + r);
                      (r = ("" + r).toLowerCase()), (i = !0);
                  }
              }),
              (t.prototype.toJSON = function() {
                return {
                  type: "Buffer",
                  data: Array.prototype.slice.call(this._arr || this, 0)
                };
              });
            (t.prototype.slice = function(e, n) {
              var r = this.length;
              (e = ~~e),
                (n = void 0 === n ? r : ~~n),
                0 > e ? ((e += r), 0 > e && (e = 0)) : e > r && (e = r),
                0 > n ? ((n += r), 0 > n && (n = 0)) : n > r && (n = r),
                n < e && (n = e);
              var o = this.subarray(e, n);
              return Object.setPrototypeOf(o, t.prototype), o;
            }),
              (t.prototype.readUIntLE = function(e, t, n) {
                (e >>>= 0), (t >>>= 0), n || N(e, t, this.length);
                for (var r = this[e], o = 1, a = 0; ++a < t && (o *= 256); )
                  r += this[e + a] * o;
                return r;
              }),
              (t.prototype.readUIntBE = function(e, t, n) {
                (e >>>= 0), (t >>>= 0), n || N(e, t, this.length);
                for (var r = this[e + --t], o = 1; 0 < t && (o *= 256); )
                  r += this[e + --t] * o;
                return r;
              }),
              (t.prototype.readUInt8 = function(e, t) {
                return (e >>>= 0), t || N(e, 1, this.length), this[e];
              }),
              (t.prototype.readUInt16LE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 2, this.length),
                  this[e] | (this[e + 1] << 8)
                );
              }),
              (t.prototype.readUInt16BE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 2, this.length),
                  (this[e] << 8) | this[e + 1]
                );
              }),
              (t.prototype.readUInt32LE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  (this[e] | (this[e + 1] << 8) | (this[e + 2] << 16)) +
                    16777216 * this[e + 3]
                );
              }),
              (t.prototype.readUInt32BE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  16777216 * this[e] +
                    ((this[e + 1] << 16) | (this[e + 2] << 8) | this[e + 3])
                );
              }),
              (t.prototype.readIntLE = function(e, t, r) {
                (e >>>= 0), (t >>>= 0), r || N(e, t, this.length);
                for (var o = this[e], a = 1, d = 0; ++d < t && (a *= 256); )
                  o += this[e + d] * a;
                return (a *= 128), o >= a && (o -= n(2, 8 * t)), o;
              }),
              (t.prototype.readIntBE = function(e, t, r) {
                (e >>>= 0), (t >>>= 0), r || N(e, t, this.length);
                for (var o = t, a = 1, d = this[e + --o]; 0 < o && (a *= 256); )
                  d += this[e + --o] * a;
                return (a *= 128), d >= a && (d -= n(2, 8 * t)), d;
              }),
              (t.prototype.readInt8 = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 1, this.length),
                  128 & this[e] ? -1 * (255 - this[e] + 1) : this[e]
                );
              }),
              (t.prototype.readInt16LE = function(e, t) {
                (e >>>= 0), t || N(e, 2, this.length);
                var n = this[e] | (this[e + 1] << 8);
                return 32768 & n ? 4294901760 | n : n;
              }),
              (t.prototype.readInt16BE = function(e, t) {
                (e >>>= 0), t || N(e, 2, this.length);
                var n = this[e + 1] | (this[e] << 8);
                return 32768 & n ? 4294901760 | n : n;
              }),
              (t.prototype.readInt32LE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  this[e] |
                    (this[e + 1] << 8) |
                    (this[e + 2] << 16) |
                    (this[e + 3] << 24)
                );
              }),
              (t.prototype.readInt32BE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  (this[e] << 24) |
                    (this[e + 1] << 16) |
                    (this[e + 2] << 8) |
                    this[e + 3]
                );
              }),
              (t.prototype.readFloatLE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  $.read(this, e, !0, 23, 4)
                );
              }),
              (t.prototype.readFloatBE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 4, this.length),
                  $.read(this, e, !1, 23, 4)
                );
              }),
              (t.prototype.readDoubleLE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 8, this.length),
                  $.read(this, e, !0, 52, 8)
                );
              }),
              (t.prototype.readDoubleBE = function(e, t) {
                return (
                  (e >>>= 0),
                  t || N(e, 8, this.length),
                  $.read(this, e, !1, 52, 8)
                );
              }),
              (t.prototype.writeUIntLE = function(e, t, r, o) {
                if (((e = +e), (t >>>= 0), (r >>>= 0), !o)) {
                  var a = n(2, 8 * r) - 1;
                  M(this, e, t, r, a, 0);
                }
                var d = 1,
                  s = 0;
                for (this[t] = 255 & e; ++s < r && (d *= 256); )
                  this[t + s] = 255 & (e / d);
                return t + r;
              }),
              (t.prototype.writeUIntBE = function(e, t, r, o) {
                if (((e = +e), (t >>>= 0), (r >>>= 0), !o)) {
                  var a = n(2, 8 * r) - 1;
                  M(this, e, t, r, a, 0);
                }
                var d = r - 1,
                  s = 1;
                for (this[t + d] = 255 & e; 0 <= --d && (s *= 256); )
                  this[t + d] = 255 & (e / s);
                return t + r;
              }),
              (t.prototype.writeUInt8 = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 1, 255, 0),
                  (this[t] = 255 & e),
                  t + 1
                );
              }),
              (t.prototype.writeUInt16LE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 2, 65535, 0),
                  (this[t] = 255 & e),
                  (this[t + 1] = e >>> 8),
                  t + 2
                );
              }),
              (t.prototype.writeUInt16BE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 2, 65535, 0),
                  (this[t] = e >>> 8),
                  (this[t + 1] = 255 & e),
                  t + 2
                );
              }),
              (t.prototype.writeUInt32LE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 4, 4294967295, 0),
                  (this[t + 3] = e >>> 24),
                  (this[t + 2] = e >>> 16),
                  (this[t + 1] = e >>> 8),
                  (this[t] = 255 & e),
                  t + 4
                );
              }),
              (t.prototype.writeUInt32BE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 4, 4294967295, 0),
                  (this[t] = e >>> 24),
                  (this[t + 1] = e >>> 16),
                  (this[t + 2] = e >>> 8),
                  (this[t + 3] = 255 & e),
                  t + 4
                );
              }),
              (t.prototype.writeIntLE = function(e, t, r, o) {
                if (((e = +e), (t >>>= 0), !o)) {
                  var a = n(2, 8 * r - 1);
                  M(this, e, t, r, a - 1, -a);
                }
                var d = 0,
                  s = 1,
                  l = 0;
                for (this[t] = 255 & e; ++d < r && (s *= 256); )
                  0 > e && 0 === l && 0 !== this[t + d - 1] && (l = 1),
                    (this[t + d] = 255 & (((e / s) >> 0) - l));
                return t + r;
              }),
              (t.prototype.writeIntBE = function(e, t, r, o) {
                if (((e = +e), (t >>>= 0), !o)) {
                  var a = n(2, 8 * r - 1);
                  M(this, e, t, r, a - 1, -a);
                }
                var d = r - 1,
                  s = 1,
                  l = 0;
                for (this[t + d] = 255 & e; 0 <= --d && (s *= 256); )
                  0 > e && 0 === l && 0 !== this[t + d + 1] && (l = 1),
                    (this[t + d] = 255 & (((e / s) >> 0) - l));
                return t + r;
              }),
              (t.prototype.writeInt8 = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 1, 127, -128),
                  0 > e && (e = 255 + e + 1),
                  (this[t] = 255 & e),
                  t + 1
                );
              }),
              (t.prototype.writeInt16LE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 2, 32767, -32768),
                  (this[t] = 255 & e),
                  (this[t + 1] = e >>> 8),
                  t + 2
                );
              }),
              (t.prototype.writeInt16BE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 2, 32767, -32768),
                  (this[t] = e >>> 8),
                  (this[t + 1] = 255 & e),
                  t + 2
                );
              }),
              (t.prototype.writeInt32LE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 4, 2147483647, -2147483648),
                  (this[t] = 255 & e),
                  (this[t + 1] = e >>> 8),
                  (this[t + 2] = e >>> 16),
                  (this[t + 3] = e >>> 24),
                  t + 4
                );
              }),
              (t.prototype.writeInt32BE = function(e, t, n) {
                return (
                  (e = +e),
                  (t >>>= 0),
                  n || M(this, e, t, 4, 2147483647, -2147483648),
                  0 > e && (e = 4294967295 + e + 1),
                  (this[t] = e >>> 24),
                  (this[t + 1] = e >>> 16),
                  (this[t + 2] = e >>> 8),
                  (this[t + 3] = 255 & e),
                  t + 4
                );
              }),
              (t.prototype.writeFloatLE = function(e, t, n) {
                return q(this, e, t, !0, n);
              }),
              (t.prototype.writeFloatBE = function(e, t, n) {
                return q(this, e, t, !1, n);
              }),
              (t.prototype.writeDoubleLE = function(e, t, n) {
                return D(this, e, t, !0, n);
              }),
              (t.prototype.writeDoubleBE = function(e, t, n) {
                return D(this, e, t, !1, n);
              }),
              (t.prototype.copy = function(e, n, r, o) {
                if (!t.isBuffer(e))
                  throw new TypeError("argument should be a Buffer");
                if (
                  (r || (r = 0),
                  o || 0 === o || (o = this.length),
                  n >= e.length && (n = e.length),
                  n || (n = 0),
                  0 < o && o < r && (o = r),
                  o === r)
                )
                  return 0;
                if (0 === e.length || 0 === this.length) return 0;
                if (0 > n) throw new RangeError("targetStart out of bounds");
                if (0 > r || r >= this.length)
                  throw new RangeError("Index out of range");
                if (0 > o) throw new RangeError("sourceEnd out of bounds");
                o > this.length && (o = this.length),
                  e.length - n < o - r && (o = e.length - n + r);
                var a = o - r;
                if (
                  this === e &&
                  "function" == typeof Uint8Array.prototype.copyWithin
                )
                  this.copyWithin(n, r, o);
                else if (this === e && r < n && n < o)
                  for (var d = a - 1; 0 <= d; --d) e[d + n] = this[d + r];
                else Uint8Array.prototype.set.call(e, this.subarray(r, o), n);
                return a;
              }),
              (t.prototype.fill = function(e, n, r, o) {
                if ("string" == typeof e) {
                  if (
                    ("string" == typeof n
                      ? ((o = n), (n = 0), (r = this.length))
                      : "string" == typeof r && ((o = r), (r = this.length)),
                    void 0 !== o && "string" != typeof o)
                  )
                    throw new TypeError("encoding must be a string");
                  if ("string" == typeof o && !t.isEncoding(o))
                    throw new TypeError("Unknown encoding: " + o);
                  if (1 === e.length) {
                    var a = e.charCodeAt(0);
                    (("utf8" === o && 128 > a) || "latin1" === o) && (e = a);
                  }
                } else
                  "number" == typeof e
                    ? (e &= 255)
                    : "boolean" == typeof e && (e = +e);
                if (0 > n || this.length < n || this.length < r)
                  throw new RangeError("Out of range index");
                if (r <= n) return this;
                (n >>>= 0),
                  (r = r === void 0 ? this.length : r >>> 0),
                  e || (e = 0);
                var d;
                if ("number" == typeof e) for (d = n; d < r; ++d) this[d] = e;
                else {
                  var s = t.isBuffer(e) ? e : t.from(e, o),
                    l = s.length;
                  if (0 === l)
                    throw new TypeError(
                      'The value "' + e + '" is invalid for argument "value"'
                    );
                  for (d = 0; d < r - n; ++d) this[d + n] = s[d % l];
                }
                return this;
              });
            var J = /[^+/0-9A-Za-z-_]/g,
              Z = (function() {
                for (
                  var e = "0123456789abcdef", t = Array(256), n = 0, r;
                  16 > n;
                  ++n
                ) {
                  r = 16 * n;
                  for (var o = 0; 16 > o; ++o) t[r + o] = e[n] + e[o];
                }
                return t;
              })();
          }.call(this, e("buffer").Buffer));
        },
        { "base64-js": 8, buffer: 26, ieee754: 37 }
      ],
      27: [
        function(e, t) {
          t.exports = {
            100: "Continue",
            101: "Switching Protocols",
            102: "Processing",
            200: "OK",
            201: "Created",
            202: "Accepted",
            203: "Non-Authoritative Information",
            204: "No Content",
            205: "Reset Content",
            206: "Partial Content",
            207: "Multi-Status",
            208: "Already Reported",
            226: "IM Used",
            300: "Multiple Choices",
            301: "Moved Permanently",
            302: "Found",
            303: "See Other",
            304: "Not Modified",
            305: "Use Proxy",
            307: "Temporary Redirect",
            308: "Permanent Redirect",
            400: "Bad Request",
            401: "Unauthorized",
            402: "Payment Required",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            406: "Not Acceptable",
            407: "Proxy Authentication Required",
            408: "Request Timeout",
            409: "Conflict",
            410: "Gone",
            411: "Length Required",
            412: "Precondition Failed",
            413: "Payload Too Large",
            414: "URI Too Long",
            415: "Unsupported Media Type",
            416: "Range Not Satisfiable",
            417: "Expectation Failed",
            418: "I'm a teapot",
            421: "Misdirected Request",
            422: "Unprocessable Entity",
            423: "Locked",
            424: "Failed Dependency",
            425: "Unordered Collection",
            426: "Upgrade Required",
            428: "Precondition Required",
            429: "Too Many Requests",
            431: "Request Header Fields Too Large",
            451: "Unavailable For Legal Reasons",
            500: "Internal Server Error",
            501: "Not Implemented",
            502: "Bad Gateway",
            503: "Service Unavailable",
            504: "Gateway Timeout",
            505: "HTTP Version Not Supported",
            506: "Variant Also Negotiates",
            507: "Insufficient Storage",
            508: "Loop Detected",
            509: "Bandwidth Limit Exceeded",
            510: "Not Extended",
            511: "Network Authentication Required"
          };
        },
        {}
      ],
      28: [
        function(e, t) {
          const n = e("block-stream2"),
            r = e("readable-stream");
          class o extends r.Writable {
            constructor(e, t, r = {}) {
              if ((super(r), !e || !e.put || !e.get))
                throw new Error(
                  "First argument must be an abstract-chunk-store compliant store"
                );
              if (((t = +t), !t))
                throw new Error("Second argument must be a chunk length");
              (this._blockstream = new n(t, { zeroPadding: !1 })),
                (this._outstandingPuts = 0);
              let o = 0;
              const i = t => {
                this.destroyed ||
                  ((this._outstandingPuts += 1),
                  e.put(o, t, () => {
                    (this._outstandingPuts -= 1),
                      0 === this._outstandingPuts &&
                        "function" == typeof this._finalCb &&
                        (this._finalCb(null), (this._finalCb = null));
                  }),
                  (o += 1));
              };
              this._blockstream.on("data", i).on("error", e => {
                this.destroy(e);
              });
            }
            _write(e, t, n) {
              this._blockstream.write(e, t, n);
            }
            _final(e) {
              this._blockstream.end(),
                this._blockstream.once("end", () => {
                  0 === this._outstandingPuts ? e(null) : (this._finalCb = e);
                });
            }
            destroy(e) {
              this.destroyed ||
                ((this.destroyed = !0),
                e && this.emit("error", e),
                this.emit("close"));
            }
          }
          t.exports = o;
        },
        { "block-stream2": 20, "readable-stream": 85 }
      ],
      29: [
        function(e, t) {
          (function(n, r, o) {
            function i(e) {
              return e.reduce(
                (e, t) => (Array.isArray(t) ? e.concat(i(t)) : e.concat(t)),
                []
              );
            }
            function d(e, t, r) {
              function a() {
                A(
                  e.map(e => t => {
                    const n = {};
                    if (m(e)) (n.getStream = b(e)), (n.length = e.size);
                    else if (o.isBuffer(e))
                      (n.getStream = y(e)), (n.length = e.length);
                    else if (_(e)) (n.getStream = k(e, n)), (n.length = 0);
                    else {
                      if ("string" == typeof e) {
                        if ("function" != typeof I.stat)
                          throw new Error(
                            "filesystem paths do not work in the browser"
                          );
                        const n = 1 < l || c;
                        return void s(e, n, t);
                      }
                      throw new Error("invalid input type");
                    }
                    (n.path = e.path), t(null, n);
                  }),
                  (e, t) => (e ? r(e) : void ((t = i(t)), r(null, t, c)))
                );
              }
              if (
                (g(e) && (e = Array.from(e)),
                Array.isArray(e) || (e = [e]),
                0 === e.length)
              )
                throw new Error("invalid input type");
              e.forEach(e => {
                if (null == e) throw new Error(`invalid input type: ${e}`);
              }),
                (e = e.map(e =>
                  m(e) &&
                  "string" == typeof e.path &&
                  "function" == typeof I.stat
                    ? e.path
                    : e
                )),
                1 !== e.length ||
                  "string" == typeof e[0] ||
                  e[0].name ||
                  (e[0].name = t.name);
              let d = null;
              e.forEach((t, n) => {
                if ("string" == typeof t) return;
                let r = t.fullPath || t.name;
                r || ((r = `Unknown File ${n + 1}`), (t.unknownName = !0)),
                  (t.path = r.split("/")),
                  t.path[0] || t.path.shift(),
                  2 > t.path.length
                    ? (d = null)
                    : 0 === n && 1 < e.length
                    ? (d = t.path[0])
                    : t.path[0] !== d && (d = null);
              }),
                (e = e.filter(e => {
                  if ("string" == typeof e) return !0;
                  const t = e.path[e.path.length - 1];
                  return u(t) && T.not(t);
                })),
                d &&
                  e.forEach(e => {
                    const t = (o.isBuffer(e) || _(e)) && !e.path;
                    "string" == typeof e || t || e.path.shift();
                  }),
                !t.name && d && (t.name = d),
                t.name ||
                  e.some(e =>
                    "string" == typeof e
                      ? ((t.name = S.basename(e)), !0)
                      : e.unknownName
                      ? void 0
                      : ((t.name = e.path[e.path.length - 1]), !0)
                  ),
                t.name || (t.name = `Unnamed Torrent ${Date.now()}`);
              const l = e.reduce((e, t) => e + +("string" == typeof t), 0);
              let c = 1 === e.length;
              if (1 === e.length && "string" == typeof e[0]) {
                if ("function" != typeof I.stat)
                  throw new Error(
                    "filesystem paths do not work in the browser"
                  );
                L(e[0], (e, t) => (e ? r(e) : void ((c = t), a())));
              } else
                n.nextTick(() => {
                  a();
                });
            }
            function s(e, t, n) {
              c(e, l, (r, o) =>
                r
                  ? n(r)
                  : void ((o = Array.isArray(o) ? i(o) : [o]),
                    (e = S.normalize(e)),
                    t && (e = e.slice(0, e.lastIndexOf(S.sep) + 1)),
                    e[e.length - 1] !== S.sep && (e += S.sep),
                    o.forEach(t => {
                      (t.getStream = w(t.path)),
                        (t.path = t.path.replace(e, "").split(S.sep));
                    }),
                    n(null, o))
              );
            }
            function l(e, t) {
              (t = R(t)),
                I.stat(e, (n, r) => {
                  if (n) return t(n);
                  const o = { length: r.size, path: e };
                  t(null, o);
                });
            }
            function c(e, t, n) {
              I.stat(e, (r, o) =>
                r
                  ? n(r)
                  : void (o.isDirectory()
                      ? I.readdir(e, (r, o) =>
                          r
                            ? n(r)
                            : void A(
                                o
                                  .filter(u)
                                  .filter(T.not)
                                  .map(n => r => {
                                    c(S.join(e, n), t, r);
                                  }),
                                n
                              )
                        )
                      : o.isFile() && t(e, n))
              );
            }
            function u(e) {
              return "." !== e[0];
            }
            function f(e, t, n) {
              function r(e) {
                c += e.length;
                const t = p;
                U(e, e => {
                  (l[t] = e), (f -= 1), s();
                }),
                  (f += 1),
                  (p += 1);
              }
              function i() {
                (h = !0), s();
              }
              function a(e) {
                d(), n(e);
              }
              function d() {
                m.removeListener("error", a),
                  g.removeListener("data", r),
                  g.removeListener("end", i),
                  g.removeListener("error", a);
              }
              function s() {
                h && 0 === f && (d(), n(null, o.from(l.join(""), "hex"), c));
              }
              n = R(n);
              const l = [];
              let c = 0;
              const u = e.map(e => e.getStream);
              let f = 0,
                p = 0,
                h = !1;
              const m = new B(u),
                g = new x(t, { zeroPadding: !1 });
              m.on("error", a),
                m
                  .pipe(g)
                  .on("data", r)
                  .on("end", i)
                  .on("error", a);
            }
            function p(e, n, o) {
              let i = n.announceList;
              i ||
                ("string" == typeof n.announce
                  ? (i = [[n.announce]])
                  : Array.isArray(n.announce) &&
                    (i = n.announce.map(e => [e]))),
                i || (i = []),
                r.WEBTORRENT_ANNOUNCE &&
                  ("string" == typeof r.WEBTORRENT_ANNOUNCE
                    ? i.push([[r.WEBTORRENT_ANNOUNCE]])
                    : Array.isArray(r.WEBTORRENT_ANNOUNCE) &&
                      (i = i.concat(r.WEBTORRENT_ANNOUNCE.map(e => [e])))),
                n.announce === void 0 &&
                  n.announceList === void 0 &&
                  (i = i.concat(t.exports.announceList)),
                "string" == typeof n.urlList && (n.urlList = [n.urlList]);
              const d = {
                info: { name: n.name },
                "creation date": a((+n.creationDate || Date.now()) / 1e3),
                encoding: "UTF-8"
              };
              0 !== i.length &&
                ((d.announce = i[0][0]), (d["announce-list"] = i)),
                n.comment !== void 0 && (d.comment = n.comment),
                n.createdBy !== void 0 && (d["created by"] = n.createdBy),
                n.private !== void 0 && (d.info.private = +n.private),
                n.info !== void 0 && Object.assign(d.info, n.info),
                n.sslCert !== void 0 && (d.info["ssl-cert"] = n.sslCert),
                n.urlList !== void 0 && (d["url-list"] = n.urlList);
              const s = n.pieceLength || v(e.reduce(h, 0));
              (d.info["piece length"] = s),
                f(e, s, (t, r, i) =>
                  t
                    ? o(t)
                    : void ((d.info.pieces = r),
                      e.forEach(e => {
                        delete e.getStream;
                      }),
                      n.singleFileTorrent
                        ? (d.info.length = i)
                        : (d.info.files = e),
                      o(null, E.encode(d)))
                );
            }
            function h(e, t) {
              return e + t.length;
            }
            function m(e) {
              return "undefined" != typeof Blob && e instanceof Blob;
            }
            function g(e) {
              return "undefined" != typeof FileList && e instanceof FileList;
            }
            function _(e) {
              return (
                "object" == typeof e && null != e && "function" == typeof e.pipe
              );
            }
            function b(e) {
              return () => new C(e);
            }
            function y(e) {
              return () => {
                const t = new P.PassThrough();
                return t.end(e), t;
              };
            }
            function w(e) {
              return () => I.createReadStream(e);
            }
            function k(e, t) {
              return () => {
                const n = new P.Transform();
                return (
                  (n._transform = function(e, n, r) {
                    (t.length += e.length), this.push(e), r();
                  }),
                  e.pipe(n),
                  n
                );
              };
            }
            const E = e("bencode"),
              x = e("block-stream2"),
              v = e("piece-length"),
              S = e("path"),
              C = e("filestream/read"),
              I = e("fs"),
              L = e("is-file"),
              T = e("junk"),
              B = e("multistream"),
              R = e("once"),
              A = e("run-parallel"),
              U = e("simple-sha1"),
              P = e("readable-stream");
            (t.exports = function(e, t, n) {
              "function" == typeof t && ([t, n] = [n, t]),
                (t = t ? Object.assign({}, t) : {}),
                d(e, t, (e, r, o) =>
                  e ? n(e) : void ((t.singleFileTorrent = o), p(r, t, n))
                );
            }),
              (t.exports.parseInput = function(e, t, n) {
                "function" == typeof t && ([t, n] = [n, t]),
                  (t = t ? Object.assign({}, t) : {}),
                  d(e, t, n);
              }),
              (t.exports.announceList = [
                ["udp://tracker.leechers-paradise.org:6969"],
                ["udp://tracker.coppersurfer.tk:6969"],
                ["udp://tracker.opentrackr.org:1337"],
                ["udp://explodie.org:6969"],
                ["udp://tracker.empire-js.us:1337"],
                ["wss://tracker.btorrent.xyz"],
                ["wss://tracker.openwebtorrent.com"],
                ["wss://tracker.fastcast.nz"]
              ]);
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global,
            e("buffer").Buffer
          ));
        },
        {
          _process: 61,
          bencode: 11,
          "block-stream2": 20,
          buffer: 26,
          "filestream/read": 34,
          fs: 22,
          "is-file": 41,
          junk: 43,
          multistream: 54,
          once: 56,
          path: 59,
          "piece-length": 60,
          "readable-stream": 85,
          "run-parallel": 89,
          "simple-sha1": 95
        }
      ],
      30: [
        function(e, t, n) {
          (function(o) {
            function i() {
              let e;
              try {
                e = n.storage.getItem("debug");
              } catch (e) {}
              return (
                !e &&
                  "undefined" != typeof o &&
                  "env" in o &&
                  (e = o.env.DEBUG),
                e
              );
            }
            (n.log = function(...e) {
              return (
                "object" == typeof console && console.log && console.log(...e)
              );
            }),
              (n.formatArgs = function(e) {
                if (
                  ((e[0] =
                    (this.useColors ? "%c" : "") +
                    this.namespace +
                    (this.useColors ? " %c" : " ") +
                    e[0] +
                    (this.useColors ? "%c " : " ") +
                    "+" +
                    t.exports.humanize(this.diff)),
                  !this.useColors)
                )
                  return;
                const n = "color: " + this.color;
                e.splice(1, 0, n, "color: inherit");
                let r = 0,
                  o = 0;
                e[0].replace(/%[a-zA-Z%]/g, e => {
                  "%%" === e || (r++, "%c" === e && (o = r));
                }),
                  e.splice(o, 0, n);
              }),
              (n.save = function(e) {
                try {
                  e
                    ? n.storage.setItem("debug", e)
                    : n.storage.removeItem("debug");
                } catch (e) {}
              }),
              (n.load = i),
              (n.useColors = function() {
                return (
                  !!(
                    "undefined" != typeof window &&
                    window.process &&
                    ("renderer" === window.process.type ||
                      window.process.__nwjs)
                  ) ||
                  (!(
                    "undefined" != typeof navigator &&
                    navigator.userAgent &&
                    navigator.userAgent
                      .toLowerCase()
                      .match(/(edge|trident)\/(\d+)/)
                  ) &&
                    (("undefined" != typeof document &&
                      document.documentElement &&
                      document.documentElement.style &&
                      document.documentElement.style.WebkitAppearance) ||
                      ("undefined" != typeof window &&
                        window.console &&
                        (window.console.firebug ||
                          (window.console.exception &&
                            window.console.table))) ||
                      ("undefined" != typeof navigator &&
                        navigator.userAgent &&
                        navigator.userAgent
                          .toLowerCase()
                          .match(/firefox\/(\d+)/) &&
                        31 <= parseInt(RegExp.$1, 10)) ||
                      ("undefined" != typeof navigator &&
                        navigator.userAgent &&
                        navigator.userAgent
                          .toLowerCase()
                          .match(/applewebkit\/(\d+)/))))
                );
              }),
              (n.storage = (function() {
                try {
                  return localStorage;
                } catch (e) {}
              })()),
              (n.colors = [
                "#0000CC",
                "#0000FF",
                "#0033CC",
                "#0033FF",
                "#0066CC",
                "#0066FF",
                "#0099CC",
                "#0099FF",
                "#00CC00",
                "#00CC33",
                "#00CC66",
                "#00CC99",
                "#00CCCC",
                "#00CCFF",
                "#3300CC",
                "#3300FF",
                "#3333CC",
                "#3333FF",
                "#3366CC",
                "#3366FF",
                "#3399CC",
                "#3399FF",
                "#33CC00",
                "#33CC33",
                "#33CC66",
                "#33CC99",
                "#33CCCC",
                "#33CCFF",
                "#6600CC",
                "#6600FF",
                "#6633CC",
                "#6633FF",
                "#66CC00",
                "#66CC33",
                "#9900CC",
                "#9900FF",
                "#9933CC",
                "#9933FF",
                "#99CC00",
                "#99CC33",
                "#CC0000",
                "#CC0033",
                "#CC0066",
                "#CC0099",
                "#CC00CC",
                "#CC00FF",
                "#CC3300",
                "#CC3333",
                "#CC3366",
                "#CC3399",
                "#CC33CC",
                "#CC33FF",
                "#CC6600",
                "#CC6633",
                "#CC9900",
                "#CC9933",
                "#CCCC00",
                "#CCCC33",
                "#FF0000",
                "#FF0033",
                "#FF0066",
                "#FF0099",
                "#FF00CC",
                "#FF00FF",
                "#FF3300",
                "#FF3333",
                "#FF3366",
                "#FF3399",
                "#FF33CC",
                "#FF33FF",
                "#FF6600",
                "#FF6633",
                "#FF9900",
                "#FF9933",
                "#FFCC00",
                "#FFCC33"
              ]),
              (t.exports = e("./common")(n));
            const { formatters: a } = t.exports;
            a.j = function(e) {
              try {
                return JSON.stringify(e);
              } catch (e) {
                return "[UnexpectedJSONParseError]: " + e.message;
              }
            };
          }.call(this, e("_process")));
        },
        { "./common": 31, _process: 61 }
      ],
      31: [
        function(e, n) {
          n.exports = function(n) {
            function r(e) {
              let n = 0;
              for (let t = 0; t < e.length; t++)
                (n = (n << 5) - n + e.charCodeAt(t)), (n |= 0);
              return o.colors[t(n) % o.colors.length];
            }
            function o(e) {
              function t(...e) {
                if (!t.enabled) return;
                const r = t,
                  i = +new Date(),
                  a = i - (n || i);
                (r.diff = a),
                  (r.prev = n),
                  (r.curr = i),
                  (n = i),
                  (e[0] = o.coerce(e[0])),
                  "string" != typeof e[0] && e.unshift("%O");
                let d = 0;
                (e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, n) => {
                  if ("%%" === t) return t;
                  d++;
                  const i = o.formatters[n];
                  if ("function" == typeof i) {
                    const n = e[d];
                    (t = i.call(r, n)), e.splice(d, 1), d--;
                  }
                  return t;
                })),
                  o.formatArgs.call(r, e);
                const s = r.log || o.log;
                s.apply(r, e);
              }
              let n;
              return (
                (t.namespace = e),
                (t.enabled = o.enabled(e)),
                (t.useColors = o.useColors()),
                (t.color = r(e)),
                (t.destroy = i),
                (t.extend = a),
                "function" == typeof o.init && o.init(t),
                o.instances.push(t),
                t
              );
            }
            function i() {
              const e = o.instances.indexOf(this);
              return -1 !== e && (o.instances.splice(e, 1), !0);
            }
            function a(e, t) {
              const n = o(
                this.namespace + ("undefined" == typeof t ? ":" : t) + e
              );
              return (n.log = this.log), n;
            }
            function d(e) {
              return e
                .toString()
                .substring(2, e.toString().length - 2)
                .replace(/\.\*\?$/, "*");
            }
            return (
              (o.debug = o),
              (o.default = o),
              (o.coerce = function(e) {
                return e instanceof Error ? e.stack || e.message : e;
              }),
              (o.disable = function() {
                const e = [
                  ...o.names.map(d),
                  ...o.skips.map(d).map(e => "-" + e)
                ].join(",");
                return o.enable(""), e;
              }),
              (o.enable = function(e) {
                o.save(e), (o.names = []), (o.skips = []);
                let t;
                const n = ("string" == typeof e ? e : "").split(/[\s,]+/),
                  r = n.length;
                for (t = 0; t < r; t++)
                  n[t] &&
                    ((e = n[t].replace(/\*/g, ".*?")),
                    "-" === e[0]
                      ? o.skips.push(new RegExp("^" + e.substr(1) + "$"))
                      : o.names.push(new RegExp("^" + e + "$")));
                for (t = 0; t < o.instances.length; t++) {
                  const e = o.instances[t];
                  e.enabled = o.enabled(e.namespace);
                }
              }),
              (o.enabled = function(e) {
                if ("*" === e[e.length - 1]) return !0;
                let t, n;
                for (t = 0, n = o.skips.length; t < n; t++)
                  if (o.skips[t].test(e)) return !1;
                for (t = 0, n = o.names.length; t < n; t++)
                  if (o.names[t].test(e)) return !0;
                return !1;
              }),
              (o.humanize = e("ms")),
              Object.keys(n).forEach(e => {
                o[e] = n[e];
              }),
              (o.instances = []),
              (o.names = []),
              (o.skips = []),
              (o.formatters = {}),
              (o.selectColor = r),
              o.enable(o.load()),
              o
            );
          };
        },
        { ms: 53 }
      ],
      32: [
        function(e, t) {
          (function(n) {
            var r = e("once"),
              o = function() {},
              i = function(e) {
                return e.setHeader && "function" == typeof e.abort;
              },
              a = function(e) {
                return (
                  e.stdio && Array.isArray(e.stdio) && 3 === e.stdio.length
                );
              },
              d = function(e, t, s) {
                if ("function" == typeof t) return d(e, null, t);
                t || (t = {}), (s = r(s || o));
                var l = e._writableState,
                  c = e._readableState,
                  u = t.readable || (!1 !== t.readable && e.readable),
                  f = t.writable || (!1 !== t.writable && e.writable),
                  p = !1,
                  h = function() {
                    e.writable || m();
                  },
                  m = function() {
                    (f = !1), u || s.call(e);
                  },
                  g = function() {
                    (u = !1), f || s.call(e);
                  },
                  _ = function(t) {
                    s.call(
                      e,
                      t ? new Error("exited with error code: " + t) : null
                    );
                  },
                  b = function(t) {
                    s.call(e, t);
                  },
                  y = function() {
                    n.nextTick(w);
                  },
                  w = function() {
                    return p
                      ? void 0
                      : u && !(c && c.ended && !c.destroyed)
                      ? s.call(e, new Error("premature close"))
                      : f && !(l && l.ended && !l.destroyed)
                      ? s.call(e, new Error("premature close"))
                      : void 0;
                  },
                  k = function() {
                    e.req.on("finish", m);
                  };
                return (
                  i(e)
                    ? (e.on("complete", m),
                      e.on("abort", y),
                      e.req ? k() : e.on("request", k))
                    : f && !l && (e.on("end", h), e.on("close", h)),
                  a(e) && e.on("exit", _),
                  e.on("end", g),
                  e.on("finish", m),
                  !1 !== t.error && e.on("error", b),
                  e.on("close", y),
                  function() {
                    (p = !0),
                      e.removeListener("complete", m),
                      e.removeListener("abort", y),
                      e.removeListener("request", k),
                      e.req && e.req.removeListener("finish", m),
                      e.removeListener("end", h),
                      e.removeListener("close", h),
                      e.removeListener("finish", m),
                      e.removeListener("exit", _),
                      e.removeListener("end", g),
                      e.removeListener("error", b),
                      e.removeListener("close", y);
                  }
                );
              };
            t.exports = d;
          }.call(this, e("_process")));
        },
        { _process: 61, once: 56 }
      ],
      33: [
        function(e, t) {
          function n() {
            (this._events &&
              Object.prototype.hasOwnProperty.call(this, "_events")) ||
              ((this._events = y(null)), (this._eventsCount = 0)),
              (this._maxListeners = this._maxListeners || void 0);
          }
          function r(e) {
            return void 0 === e._maxListeners
              ? n.defaultMaxListeners
              : e._maxListeners;
          }
          function a(e, t, n) {
            if (t) e.call(n);
            else
              for (var r = e.length, o = _(e, r), a = 0; a < r; ++a)
                o[a].call(n);
          }
          function d(e, t, n, r) {
            if (t) e.call(n, r);
            else
              for (var o = e.length, a = _(e, o), d = 0; d < o; ++d)
                a[d].call(n, r);
          }
          function s(e, t, n, r, o) {
            if (t) e.call(n, r, o);
            else
              for (var a = e.length, d = _(e, a), s = 0; s < a; ++s)
                d[s].call(n, r, o);
          }
          function l(e, t, n, r, o, a) {
            if (t) e.call(n, r, o, a);
            else
              for (var d = e.length, s = _(e, d), l = 0; l < d; ++l)
                s[l].call(n, r, o, a);
          }
          function c(e, t, n, r) {
            if (t) e.apply(n, r);
            else
              for (var o = e.length, a = _(e, o), d = 0; d < o; ++d)
                a[d].apply(n, r);
          }
          function u(e, t, n, o) {
            var i, a, d;
            if ("function" != typeof n)
              throw new TypeError('"listener" argument must be a function');
            if (
              ((a = e._events),
              a
                ? (a.newListener &&
                    (e.emit("newListener", t, n.listener ? n.listener : n),
                    (a = e._events)),
                  (d = a[t]))
                : ((a = e._events = y(null)), (e._eventsCount = 0)),
              !d)
            )
              (d = a[t] = n), ++e._eventsCount;
            else if (
              ("function" == typeof d
                ? (d = a[t] = o ? [n, d] : [d, n])
                : o
                ? d.unshift(n)
                : d.push(n),
              !d.warned && ((i = r(e)), i && 0 < i && d.length > i))
            ) {
              d.warned = !0;
              var s = new Error(
                "Possible EventEmitter memory leak detected. " +
                  d.length +
                  ' "' +
                  (t +
                    '" listeners added. Use emitter.setMaxListeners() to increase limit.')
              );
              (s.name = "MaxListenersExceededWarning"),
                (s.emitter = e),
                (s.type = t),
                (s.count = d.length),
                "object" == typeof console &&
                  console.warn &&
                  console.warn("%s: %s", s.name, s.message);
            }
            return e;
          }
          function f() {
            if (!this.fired)
              switch (
                (this.target.removeListener(this.type, this.wrapFn),
                (this.fired = !0),
                arguments.length)
              ) {
                case 0:
                  return this.listener.call(this.target);
                case 1:
                  return this.listener.call(this.target, arguments[0]);
                case 2:
                  return this.listener.call(
                    this.target,
                    arguments[0],
                    arguments[1]
                  );
                case 3:
                  return this.listener.call(
                    this.target,
                    arguments[0],
                    arguments[1],
                    arguments[2]
                  );
                default:
                  for (
                    var e = Array(arguments.length), t = 0;
                    t < e.length;
                    ++t
                  )
                    e[t] = arguments[t];
                  this.listener.apply(this.target, e);
              }
          }
          function p(e, t, n) {
            var r = {
                fired: !1,
                wrapFn: void 0,
                target: e,
                type: t,
                listener: n
              },
              o = k.call(f, r);
            return (o.listener = n), (r.wrapFn = o), o;
          }
          function h(e, t, n) {
            var r = e._events;
            if (!r) return [];
            var o = r[t];
            return o
              ? "function" == typeof o
                ? n
                  ? [o.listener || o]
                  : [o]
                : n
                ? b(o)
                : _(o, o.length)
              : [];
          }
          function m(e) {
            var t = this._events;
            if (t) {
              var n = t[e];
              if ("function" == typeof n) return 1;
              if (n) return n.length;
            }
            return 0;
          }
          function g(e, t) {
            for (var r = t, o = r + 1, a = e.length; o < a; r += 1, o += 1)
              e[r] = e[o];
            e.pop();
          }
          function _(e, t) {
            for (var n = Array(t), r = 0; r < t; ++r) n[r] = e[r];
            return n;
          }
          function b(e) {
            for (var t = Array(e.length), n = 0; n < t.length; ++n)
              t[n] = e[n].listener || e[n];
            return t;
          }
          var y =
              Object.create ||
              function(e) {
                var t = function() {};
                return (t.prototype = e), new t();
              },
            w =
              Object.keys ||
              function(e) {
                var t = [];
                for (var n in e)
                  Object.prototype.hasOwnProperty.call(e, n) && t.push(n);
                return n;
              },
            k =
              Function.prototype.bind ||
              function(e) {
                var t = this;
                return function() {
                  return t.apply(e, arguments);
                };
              };
          (t.exports = n),
            (n.EventEmitter = n),
            (n.prototype._events = void 0),
            (n.prototype._maxListeners = void 0);
          var E = 10,
            x;
          try {
            var v = {};
            Object.defineProperty &&
              Object.defineProperty(v, "x", { value: 0 }),
              (x = 0 === v.x);
          } catch (e) {
            x = !1;
          }
          x
            ? Object.defineProperty(n, "defaultMaxListeners", {
                enumerable: !0,
                get: function() {
                  return E;
                },
                set: function(e) {
                  if ("number" != typeof e || 0 > e || e !== e)
                    throw new TypeError(
                      '"defaultMaxListeners" must be a positive number'
                    );
                  E = e;
                }
              })
            : (n.defaultMaxListeners = E),
            (n.prototype.setMaxListeners = function(e) {
              if ("number" != typeof e || 0 > e || isNaN(e))
                throw new TypeError('"n" argument must be a positive number');
              return (this._maxListeners = e), this;
            }),
            (n.prototype.getMaxListeners = function() {
              return r(this);
            }),
            (n.prototype.emit = function(e) {
              var t = "error" === e,
                n,
                r,
                o,
                u,
                f,
                p;
              if (((p = this._events), p)) t = t && null == p.error;
              else if (!t) return !1;
              if (t) {
                if (
                  (1 < arguments.length && (n = arguments[1]),
                  n instanceof Error)
                )
                  throw n;
                else {
                  var h = new Error('Unhandled "error" event. (' + n + ")");
                  throw ((h.context = n), h);
                }
                return !1;
              }
              if (((r = p[e]), !r)) return !1;
              var m = "function" == typeof r;
              switch (((o = arguments.length), o)) {
                case 1:
                  a(r, m, this);
                  break;
                case 2:
                  d(r, m, this, arguments[1]);
                  break;
                case 3:
                  s(r, m, this, arguments[1], arguments[2]);
                  break;
                case 4:
                  l(r, m, this, arguments[1], arguments[2], arguments[3]);
                  break;
                default:
                  for (u = Array(o - 1), f = 1; f < o; f++)
                    u[f - 1] = arguments[f];
                  c(r, m, this, u);
              }
              return !0;
            }),
            (n.prototype.addListener = function(e, t) {
              return u(this, e, t, !1);
            }),
            (n.prototype.on = n.prototype.addListener),
            (n.prototype.prependListener = function(e, t) {
              return u(this, e, t, !0);
            }),
            (n.prototype.once = function(e, t) {
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              return this.on(e, p(this, e, t)), this;
            }),
            (n.prototype.prependOnceListener = function(e, t) {
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              return this.prependListener(e, p(this, e, t)), this;
            }),
            (n.prototype.removeListener = function(e, t) {
              var n, r, o, a, d;
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              if (((r = this._events), !r)) return this;
              if (((n = r[e]), !n)) return this;
              if (n === t || n.listener === t)
                0 == --this._eventsCount
                  ? (this._events = y(null))
                  : (delete r[e],
                    r.removeListener &&
                      this.emit("removeListener", e, n.listener || t));
              else if ("function" != typeof n) {
                for (o = -1, a = n.length - 1; 0 <= a; a--)
                  if (n[a] === t || n[a].listener === t) {
                    (d = n[a].listener), (o = a);
                    break;
                  }
                if (0 > o) return this;
                0 === o ? n.shift() : g(n, o),
                  1 === n.length && (r[e] = n[0]),
                  r.removeListener && this.emit("removeListener", e, d || t);
              }
              return this;
            }),
            (n.prototype.removeAllListeners = function(e) {
              var t, n, r;
              if (((n = this._events), !n)) return this;
              if (!n.removeListener)
                return (
                  0 === arguments.length
                    ? ((this._events = y(null)), (this._eventsCount = 0))
                    : n[e] &&
                      (0 == --this._eventsCount
                        ? (this._events = y(null))
                        : delete n[e]),
                  this
                );
              if (0 === arguments.length) {
                var o = w(n),
                  a;
                for (r = 0; r < o.length; ++r)
                  (a = o[r]),
                    "removeListener" === a || this.removeAllListeners(a);
                return (
                  this.removeAllListeners("removeListener"),
                  (this._events = y(null)),
                  (this._eventsCount = 0),
                  this
                );
              }
              if (((t = n[e]), "function" == typeof t))
                this.removeListener(e, t);
              else if (t)
                for (r = t.length - 1; 0 <= r; r--)
                  this.removeListener(e, t[r]);
              return this;
            }),
            (n.prototype.listeners = function(e) {
              return h(this, e, !0);
            }),
            (n.prototype.rawListeners = function(e) {
              return h(this, e, !1);
            }),
            (n.listenerCount = function(e, t) {
              return "function" == typeof e.listenerCount
                ? e.listenerCount(t)
                : m.call(e, t);
            }),
            (n.prototype.listenerCount = m),
            (n.prototype.eventNames = function() {
              return 0 < this._eventsCount ? Reflect.ownKeys(this._events) : [];
            });
        },
        {}
      ],
      34: [
        function(e, t) {
          const { Readable: n } = e("readable-stream"),
            r = e("typedarray-to-buffer");
          t.exports = class extends n {
            constructor(e, t = {}) {
              super(t),
                (this._offset = 0),
                (this._ready = !1),
                (this._file = e),
                (this._size = e.size),
                (this._chunkSize = t.chunkSize || d(this._size / 1e3, 204800));
              const n = new FileReader();
              (n.onload = () => {
                this.push(r(n.result));
              }),
                (n.onerror = () => {
                  this.emit("error", n.error);
                }),
                (this.reader = n),
                this._generateHeaderBlocks(e, t, (e, t) =>
                  e
                    ? this.emit("error", e)
                    : void (Array.isArray(t) && t.forEach(e => this.push(e)),
                      (this._ready = !0),
                      this.emit("_ready"))
                );
            }
            _generateHeaderBlocks(e, t, n) {
              n(null, []);
            }
            _read() {
              if (!this._ready)
                return void this.once("_ready", this._read.bind(this));
              const e = this._offset;
              let t = this._offset + this._chunkSize;
              return (
                t > this._size && (t = this._size),
                e === this._size
                  ? (this.destroy(), void this.push(null))
                  : void (this.reader.readAsArrayBuffer(this._file.slice(e, t)),
                    (this._offset = t))
              );
            }
            destroy() {
              if (((this._file = null), this.reader)) {
                (this.reader.onload = null), (this.reader.onerror = null);
                try {
                  this.reader.abort();
                } catch (t) {}
              }
              this.reader = null;
            }
          };
        },
        { "readable-stream": 85, "typedarray-to-buffer": 112 }
      ],
      35: [
        function(e, t) {
          t.exports = function() {
            if ("undefined" == typeof window) return null;
            var e = {
              RTCPeerConnection:
                window.RTCPeerConnection ||
                window.mozRTCPeerConnection ||
                window.webkitRTCPeerConnection,
              RTCSessionDescription:
                window.RTCSessionDescription ||
                window.mozRTCSessionDescription ||
                window.webkitRTCSessionDescription,
              RTCIceCandidate:
                window.RTCIceCandidate ||
                window.mozRTCIceCandidate ||
                window.webkitRTCIceCandidate
            };
            return e.RTCPeerConnection ? e : null;
          };
        },
        {}
      ],
      36: [
        function(e, t) {
          function n(e) {
            if (
              ("string" == typeof e && (e = o.parse(e)),
              e.protocol || (e.protocol = "https:"),
              "https:" !== e.protocol)
            )
              throw new Error(
                'Protocol "' + e.protocol + '" not supported. Expected "https:"'
              );
            return e;
          }
          var r = e("http"),
            o = e("url"),
            i = t.exports;
          for (var a in r) r.hasOwnProperty(a) && (i[a] = r[a]);
          (i.request = function(e, t) {
            return (e = n(e)), r.request.call(this, e, t);
          }),
            (i.get = function(e, t) {
              return (e = n(e)), r.get.call(this, e, t);
            });
        },
        { http: 99, url: 116 }
      ],
      37: [
        function(e, o, i) {
          (i.read = function(t, r, o, a, l) {
            var c = 8 * l - a - 1,
              u = (1 << c) - 1,
              f = u >> 1,
              p = -7,
              h = o ? l - 1 : 0,
              g = o ? -1 : 1,
              d = t[r + h],
              _,
              b;
            for (
              h += g, _ = d & ((1 << -p) - 1), d >>= -p, p += c;
              0 < p;
              _ = 256 * _ + t[r + h], h += g, p -= 8
            );
            for (
              b = _ & ((1 << -p) - 1), _ >>= -p, p += a;
              0 < p;
              b = 256 * b + t[r + h], h += g, p -= 8
            );
            if (0 === _) _ = 1 - f;
            else {
              if (_ === u) return b ? NaN : (d ? -1 : 1) * (1 / 0);
              (b += n(2, a)), (_ -= f);
            }
            return (d ? -1 : 1) * b * n(2, _ - a);
          }),
            (i.write = function(o, a, l, u, f, p) {
              var h = Math.LN2,
                g = Math.log,
                _ = 8 * p - f - 1,
                b = (1 << _) - 1,
                y = b >> 1,
                w = 23 === f ? n(2, -24) - n(2, -77) : 0,
                k = u ? 0 : p - 1,
                E = u ? 1 : -1,
                d = 0 > a || (0 === a && 0 > 1 / a) ? 1 : 0,
                s,
                x,
                v;
              for (
                a = t(a),
                  isNaN(a) || a === 1 / 0
                    ? ((x = isNaN(a) ? 1 : 0), (s = b))
                    : ((s = r(g(a) / h)),
                      1 > a * (v = n(2, -s)) && (s--, (v *= 2)),
                      (a += 1 <= s + y ? w / v : w * n(2, 1 - y)),
                      2 <= a * v && (s++, (v /= 2)),
                      s + y >= b
                        ? ((x = 0), (s = b))
                        : 1 <= s + y
                        ? ((x = (a * v - 1) * n(2, f)), (s += y))
                        : ((x = a * n(2, y - 1) * n(2, f)), (s = 0)));
                8 <= f;
                o[l + k] = 255 & x, k += E, x /= 256, f -= 8
              );
              for (
                s = (s << f) | x, _ += f;
                0 < _;
                o[l + k] = 255 & s, k += E, s /= 256, _ -= 8
              );
              o[l + k - E] |= 128 * d;
            });
        },
        {}
      ],
      38: [
        function(e, t) {
          const n = e("queue-microtask");
          t.exports = class {
            constructor(e) {
              if (
                ((this.store = e),
                (this.chunkLength = e.chunkLength),
                !this.store || !this.store.get || !this.store.put)
              )
                throw new Error(
                  "First argument must be abstract-chunk-store compliant"
                );
              this.mem = [];
            }
            put(e, t, n) {
              (this.mem[e] = t),
                this.store.put(e, t, t => {
                  (this.mem[e] = null), n && n(t);
                });
            }
            get(e, t, r) {
              if ("function" == typeof t) return this.get(e, null, t);
              let o = this.mem[e];
              if (!o) return this.store.get(e, t, r);
              if (t) {
                const e = t.offset || 0,
                  n = t.length ? e + t.length : o.length;
                o = o.slice(e, n);
              }
              n(() => {
                r && r(null, o);
              });
            }
            close(e) {
              this.store.close(e);
            }
            destroy(e) {
              this.store.destroy(e);
            }
          };
        },
        { "queue-microtask": 67 }
      ],
      39: [
        function(e, t) {
          t.exports =
            "function" == typeof Object.create
              ? function(e, t) {
                  t &&
                    ((e.super_ = t),
                    (e.prototype = Object.create(t.prototype, {
                      constructor: {
                        value: e,
                        enumerable: !1,
                        writable: !0,
                        configurable: !0
                      }
                    })));
                }
              : function(e, t) {
                  if (t) {
                    e.super_ = t;
                    var n = function() {};
                    (n.prototype = t.prototype),
                      (e.prototype = new n()),
                      (e.prototype.constructor = e);
                  }
                };
        },
        {}
      ],
      40: [
        function(e, t) {
          t.exports = function(e) {
            for (var t = 0, n = e.length; t < n; ++t)
              if (e.charCodeAt(t) > 127) return !1;
            return !0;
          };
        },
        {}
      ],
      41: [
        function(e, t) {
          "use strict";
          function n(e) {
            return r.existsSync(e) && r.statSync(e).isFile();
          }
          var r = e("fs");
          (t.exports = function(e, t) {
            return t
              ? void r.stat(e, function(e, n) {
                  return e ? t(e) : t(null, n.isFile());
                })
              : n(e);
          }),
            (t.exports.sync = n);
        },
        { fs: 22 }
      ],
      42: [
        function(e, t) {
          function n(e) {
            return r(e) || o(e);
          }
          function r(e) {
            return (
              e instanceof Int8Array ||
              e instanceof Int16Array ||
              e instanceof Int32Array ||
              e instanceof Uint8Array ||
              e instanceof Uint8ClampedArray ||
              e instanceof Uint16Array ||
              e instanceof Uint32Array ||
              e instanceof Float32Array ||
              e instanceof Float64Array
            );
          }
          function o(e) {
            return a[i.call(e)];
          }
          (t.exports = n), (n.strict = r), (n.loose = o);
          var i = Object.prototype.toString,
            a = {
              "[object Int8Array]": !0,
              "[object Int16Array]": !0,
              "[object Int32Array]": !0,
              "[object Uint8Array]": !0,
              "[object Uint8ClampedArray]": !0,
              "[object Uint16Array]": !0,
              "[object Uint32Array]": !0,
              "[object Float32Array]": !0,
              "[object Float64Array]": !0
            };
        },
        {}
      ],
      43: [
        function(e, t, n) {
          "use strict";
          (n.re = () => {
            throw new Error("`junk.re` was renamed to `junk.regex`");
          }),
            (n.regex = new RegExp(
              [
                "^npm-debug\\.log$",
                "^\\..*\\.swp$",
                "^\\.DS_Store$",
                "^\\.AppleDouble$",
                "^\\.LSOverride$",
                "^Icon\\r$",
                "^\\._.*",
                "^\\.Spotlight-V100(?:$|\\/)",
                "\\.Trashes",
                "^__MACOSX$",
                "~$",
                "^Thumbs\\.db$",
                "^ehthumbs\\.db$",
                "^Desktop\\.ini$",
                "@eaDir$"
              ].join("|")
            )),
            (n.is = e => n.regex.test(e)),
            (n.not = e => !n.is(e)),
            (n.default = t.exports);
        },
        {}
      ],
      44: [
        function(e, t) {
          (function(n) {
            function r(e) {
              const t = {},
                r = e.split("magnet:?")[1],
                a = r && 0 <= r.length ? r.split("&") : [];
              a.forEach(e => {
                const n = e.split("=");
                if (2 !== n.length) return;
                const r = n[0];
                let o = n[1];
                if (
                  ("dn" === r &&
                    (o = decodeURIComponent(o).replace(/\+/g, " ")),
                  ("tr" === r || "xs" === r || "as" === r || "ws" === r) &&
                    (o = decodeURIComponent(o)),
                  "kt" === r && (o = decodeURIComponent(o).split("+")),
                  "ix" === r && (o = +o),
                  !t[r])
                )
                  t[r] = o;
                else if (Array.isArray(t[r])) t[r].push(o);
                else {
                  const e = t[r];
                  t[r] = [e, o];
                }
              });
              let d;
              if (t.xt) {
                const e = Array.isArray(t.xt) ? t.xt : [t.xt];
                e.forEach(e => {
                  if ((d = e.match(/^urn:btih:(.{40})/)))
                    t.infoHash = d[1].toLowerCase();
                  else if ((d = e.match(/^urn:btih:(.{32})/))) {
                    const e = o.decode(d[1]);
                    t.infoHash = n.from(e, "binary").toString("hex");
                  }
                });
              }
              return (
                t.infoHash && (t.infoHashBuffer = n.from(t.infoHash, "hex")),
                t.dn && (t.name = t.dn),
                t.kt && (t.keywords = t.kt),
                (t.announce =
                  "string" == typeof t.tr
                    ? [t.tr]
                    : Array.isArray(t.tr)
                    ? t.tr
                    : []),
                (t.urlList = []),
                ("string" == typeof t.as || Array.isArray(t.as)) &&
                  (t.urlList = t.urlList.concat(t.as)),
                ("string" == typeof t.ws || Array.isArray(t.ws)) &&
                  (t.urlList = t.urlList.concat(t.ws)),
                i(t.announce),
                i(t.urlList),
                t
              );
            }
            (t.exports = r),
              (t.exports.decode = r),
              (t.exports.encode = function(e) {
                (e = Object.assign({}, e)),
                  e.infoHashBuffer &&
                    (e.xt = `urn:btih:${e.infoHashBuffer.toString("hex")}`),
                  e.infoHash && (e.xt = `urn:btih:${e.infoHash}`),
                  e.name && (e.dn = e.name),
                  e.keywords && (e.kt = e.keywords),
                  e.announce && (e.tr = e.announce),
                  e.urlList && ((e.ws = e.urlList), delete e.as);
                let t = "magnet:?";
                return (
                  Object.keys(e)
                    .filter(e => 2 === e.length)
                    .forEach((n, r) => {
                      const o = Array.isArray(e[n]) ? e[n] : [e[n]];
                      o.forEach((e, o) => {
                        (0 < r || 0 < o) &&
                          ("kt" !== n || 0 === o) &&
                          (t += "&"),
                          "dn" === n &&
                            (e = encodeURIComponent(e).replace(/%20/g, "+")),
                          ("tr" === n ||
                            "xs" === n ||
                            "as" === n ||
                            "ws" === n) &&
                            (e = encodeURIComponent(e)),
                          "kt" === n && (e = encodeURIComponent(e)),
                          (t += "kt" === n && 0 < o ? `+${e}` : `${n}=${e}`);
                      });
                    }),
                  t
                );
              });
            const o = e("thirty-two"),
              i = e("uniq");
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26, "thirty-two": 107, uniq: 114 }
      ],
      45: [
        function(e, t) {
          function n(e, t) {
            var r = this;
            if (!(r instanceof n)) return new n(e, t);
            if (!s) throw new Error("web browser lacks MediaSource support");
            t || (t = {}),
              (r._debug = t.debug),
              (r._bufferDuration = t.bufferDuration || 60),
              (r._elem = e),
              (r._mediaSource = new s()),
              (r._streams = []),
              (r.detailedError = null),
              (r._errorHandler = function() {
                r._elem.removeEventListener("error", r._errorHandler);
                var e = r._streams.slice();
                e.forEach(function(e) {
                  e.destroy(r._elem.error);
                });
              }),
              r._elem.addEventListener("error", r._errorHandler),
              (r._elem.src = window.URL.createObjectURL(r._mediaSource));
          }
          function r(e, t) {
            var n = this;
            if (
              (a.Writable.call(n),
              (n._wrapper = e),
              (n._elem = e._elem),
              (n._mediaSource = e._mediaSource),
              (n._allStreams = e._streams),
              n._allStreams.push(n),
              (n._bufferDuration = e._bufferDuration),
              (n._sourceBuffer = null),
              (n._debugBuffers = []),
              (n._openHandler = function() {
                n._onSourceOpen();
              }),
              (n._flowHandler = function() {
                n._flow();
              }),
              (n._errorHandler = function(e) {
                n.destroyed || n.emit("error", e);
              }),
              "string" == typeof t)
            )
              (n._type = t),
                "open" === n._mediaSource.readyState
                  ? n._createSourceBuffer()
                  : n._mediaSource.addEventListener(
                      "sourceopen",
                      n._openHandler
                    );
            else if (null === t._sourceBuffer)
              t.destroy(),
                (n._type = t._type),
                n._mediaSource.addEventListener("sourceopen", n._openHandler);
            else if (t._sourceBuffer)
              t.destroy(),
                (n._type = t._type),
                (n._sourceBuffer = t._sourceBuffer),
                (n._debugBuffers = t._debugBuffers),
                n._sourceBuffer.addEventListener("updateend", n._flowHandler),
                n._sourceBuffer.addEventListener("error", n._errorHandler);
            else
              throw new Error(
                "The argument to MediaElementWrapper.createWriteStream must be a string or a previous stream returned from that function"
              );
            n._elem.addEventListener("timeupdate", n._flowHandler),
              n.on("error", function(e) {
                n._wrapper.error(e);
              }),
              n.on("finish", function() {
                if (
                  !n.destroyed &&
                  ((n._finished = !0),
                  n._allStreams.every(function(e) {
                    return e._finished;
                  }))
                ) {
                  n._wrapper._dumpDebugData();
                  try {
                    n._mediaSource.endOfStream();
                  } catch (e) {}
                }
              });
          }
          function o(e, t) {
            var n = document.createElement("a");
            (n.href = window.URL.createObjectURL(new window.Blob(e))),
              (n.download = t),
              n.click();
          }
          t.exports = n;
          var i = e("inherits"),
            a = e("readable-stream"),
            d = e("to-arraybuffer"),
            s = "undefined" != typeof window && window.MediaSource;
          (n.prototype.createWriteStream = function(e) {
            var t = this;
            return new r(t, e);
          }),
            (n.prototype.error = function(e) {
              var t = this;
              t.detailedError || (t.detailedError = e), t._dumpDebugData();
              try {
                t._mediaSource.endOfStream("decode");
              } catch (e) {}
              try {
                window.URL.revokeObjectURL(t._elem.src);
              } catch (e) {}
            }),
            (n.prototype._dumpDebugData = function() {
              var e = this;
              e._debug &&
                ((e._debug = !1),
                e._streams.forEach(function(e, t) {
                  o(e._debugBuffers, "mediasource-stream-" + t);
                }));
            }),
            i(r, a.Writable),
            (r.prototype._onSourceOpen = function() {
              var e = this;
              e.destroyed ||
                (e._mediaSource.removeEventListener(
                  "sourceopen",
                  e._openHandler
                ),
                e._createSourceBuffer());
            }),
            (r.prototype.destroy = function(e) {
              var t = this;
              t.destroyed ||
                ((t.destroyed = !0),
                t._allStreams.splice(t._allStreams.indexOf(t), 1),
                t._mediaSource.removeEventListener(
                  "sourceopen",
                  t._openHandler
                ),
                t._elem.removeEventListener("timeupdate", t._flowHandler),
                t._sourceBuffer &&
                  (t._sourceBuffer.removeEventListener(
                    "updateend",
                    t._flowHandler
                  ),
                  t._sourceBuffer.removeEventListener("error", t._errorHandler),
                  "open" === t._mediaSource.readyState &&
                    t._sourceBuffer.abort()),
                e && t.emit("error", e),
                t.emit("close"));
            }),
            (r.prototype._createSourceBuffer = function() {
              var e = this;
              if (!e.destroyed)
                if (!s.isTypeSupported(e._type))
                  e.destroy(new Error("The provided type is not supported"));
                else if (
                  ((e._sourceBuffer = e._mediaSource.addSourceBuffer(e._type)),
                  e._sourceBuffer.addEventListener("updateend", e._flowHandler),
                  e._sourceBuffer.addEventListener("error", e._errorHandler),
                  e._cb)
                ) {
                  var t = e._cb;
                  (e._cb = null), t();
                }
            }),
            (r.prototype._write = function(e, t, n) {
              var r = this;
              if (!r.destroyed) {
                if (!r._sourceBuffer)
                  return void (r._cb = function(o) {
                    return o ? n(o) : void r._write(e, t, n);
                  });
                if (r._sourceBuffer.updating)
                  return n(
                    new Error(
                      "Cannot append buffer while source buffer updating"
                    )
                  );
                var o = d(e);
                r._wrapper._debug && r._debugBuffers.push(o);
                try {
                  r._sourceBuffer.appendBuffer(o);
                } catch (e) {
                  return void r.destroy(e);
                }
                r._cb = n;
              }
            }),
            (r.prototype._flow = function() {
              var e = this;
              if (
                !(
                  e.destroyed ||
                  !e._sourceBuffer ||
                  e._sourceBuffer.updating
                ) &&
                !(
                  "open" === e._mediaSource.readyState &&
                  e._getBufferDuration() > e._bufferDuration
                ) &&
                e._cb
              ) {
                var t = e._cb;
                (e._cb = null), t();
              }
            });
          r.prototype._getBufferDuration = function() {
            for (
              var e = this,
                t = e._sourceBuffer.buffered,
                n = e._elem.currentTime,
                r = -1,
                o = 0;
              o < t.length;
              o++
            ) {
              var a = t.start(o),
                d = t.end(o) + 0;
              if (a > n) break;
              else (0 <= r || n <= d) && (r = d);
            }
            var s = r - n;
            return 0 > s && (s = 0), s;
          };
        },
        { inherits: 39, "readable-stream": 85, "to-arraybuffer": 109 }
      ],
      46: [
        function(e, t) {
          (function(e) {
            function n(e, t) {
              if (!(this instanceof n)) return new n(e, t);
              if ((t || (t = {}), (this.chunkLength = +e), !this.chunkLength))
                throw new Error("First argument must be a chunk length");
              (this.chunks = []),
                (this.closed = !1),
                (this.length = +t.length || 1 / 0),
                this.length !== 1 / 0 &&
                  ((this.lastChunkLength =
                    this.length % this.chunkLength || this.chunkLength),
                  (this.lastChunkIndex =
                    a(this.length / this.chunkLength) - 1));
            }
            function r(t, n, r) {
              e.nextTick(function() {
                t && t(n, r);
              });
            }
            (t.exports = n),
              (n.prototype.put = function(e, t, n) {
                if (this.closed) return r(n, new Error("Storage is closed"));
                var o = e === this.lastChunkIndex;
                return o && t.length !== this.lastChunkLength
                  ? r(
                      n,
                      new Error(
                        "Last chunk length must be " + this.lastChunkLength
                      )
                    )
                  : o || t.length === this.chunkLength
                  ? void ((this.chunks[e] = t), r(n, null))
                  : r(n, new Error("Chunk length must be " + this.chunkLength));
              }),
              (n.prototype.get = function(e, t, n) {
                if ("function" == typeof t) return this.get(e, null, t);
                if (this.closed) return r(n, new Error("Storage is closed"));
                var o = this.chunks[e];
                if (!o) {
                  var i = new Error("Chunk not found");
                  return (i.notFound = !0), r(n, i);
                }
                if (!t) return r(n, null, o);
                var a = t.offset || 0,
                  d = t.length || o.length - a;
                r(n, null, o.slice(a, d + a));
              }),
              (n.prototype.close = n.prototype.destroy = function(e) {
                return this.closed
                  ? r(e, new Error("Storage is closed"))
                  : void ((this.closed = !0), (this.chunks = null), r(e, null));
              });
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      47: [
        function(e, t, n) {
          (function(t) {
            function o(e, t, n) {
              for (var r = t; r < n; r++) e[r] = 0;
            }
            function i(e, t, n) {
              t.writeUInt32BE(r((e.getTime() + 2082844800000) / 1e3), n);
            }
            function a(e, t, n) {
              t.writeUIntBE(r((e.getTime() + 2082844800000) / 1e3), n, 6);
            }
            function d(e, t, n) {
              t.writeUInt16BE(r(e) % 65536, n),
                t.writeUInt16BE(r(256 * (256 * e)) % 65536, n + 2);
            }
            function l(e, t, n) {
              (t[n] = r(e) % 256), (t[n + 1] = r(256 * e) % 256);
            }
            function c(e, t, n) {
              e || (e = [0, 0, 0, 0, 0, 0, 0, 0, 0]);
              for (var r = 0; r < e.length; r++) d(e[r], t, n + 4 * r);
            }
            function u(e, n, r) {
              var o = t.from(e, "utf8");
              o.copy(n, r), (n[r + o.length] = 0);
            }
            function f(e) {
              for (var t = Array(e.length / 4), n = 0; n < t.length; n++)
                t[n] = m(e, 4 * n);
              return t;
            }
            function p(e, t) {
              return new Date(1e3 * e.readUIntBE(t, 6) - 2082844800000);
            }
            function h(e, t) {
              return new Date(1e3 * e.readUInt32BE(t) - 2082844800000);
            }
            function m(e, t) {
              return e.readUInt16BE(t) + e.readUInt16BE(t + 2) / 65536;
            }
            function g(e, t) {
              return e[t] + e[t + 1] / 256;
            }
            function _(e, t, n) {
              var r;
              for (r = 0; r < n && !(0 === e[t + r]); r++);
              return e.toString("utf8", t, t + r);
            }
            var b = e("./index"),
              y = e("./descriptor"),
              w = e("uint64be");
            n.fullBoxes = {};
            [
              "mvhd",
              "tkhd",
              "mdhd",
              "vmhd",
              "smhd",
              "stsd",
              "esds",
              "stsz",
              "stco",
              "co64",
              "stss",
              "stts",
              "ctts",
              "stsc",
              "dref",
              "elst",
              "hdlr",
              "mehd",
              "trex",
              "mfhd",
              "tfhd",
              "tfdt",
              "trun"
            ].forEach(function(e) {
              n.fullBoxes[e] = !0;
            }),
              (n.ftyp = {}),
              (n.ftyp.encode = function(e, r, o) {
                r = r ? r.slice(o) : t.alloc(n.ftyp.encodingLength(e));
                var a = e.compatibleBrands || [];
                r.write(e.brand, 0, 4, "ascii"),
                  r.writeUInt32BE(e.brandVersion, 4);
                for (var d = 0; d < a.length; d++)
                  r.write(a[d], 8 + 4 * d, 4, "ascii");
                return (n.ftyp.encode.bytes = 8 + 4 * a.length), r;
              }),
              (n.ftyp.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.toString("ascii", 0, 4),
                    r = e.readUInt32BE(4),
                    o = [],
                    a = 8;
                  a < e.length;
                  a += 4
                )
                  o.push(e.toString("ascii", a, a + 4));
                return { brand: n, brandVersion: r, compatibleBrands: o };
              }),
              (n.ftyp.encodingLength = function(e) {
                return 8 + 4 * (e.compatibleBrands || []).length;
              }),
              (n.mvhd = {}),
              (n.mvhd.encode = function(e, r, a) {
                return (
                  (r = r ? r.slice(a) : t.alloc(96)),
                  i(e.ctime || new Date(), r, 0),
                  i(e.mtime || new Date(), r, 4),
                  r.writeUInt32BE(e.timeScale || 0, 8),
                  r.writeUInt32BE(e.duration || 0, 12),
                  d(e.preferredRate || 0, r, 16),
                  l(e.preferredVolume || 0, r, 20),
                  o(r, 22, 32),
                  c(e.matrix, r, 32),
                  r.writeUInt32BE(e.previewTime || 0, 68),
                  r.writeUInt32BE(e.previewDuration || 0, 72),
                  r.writeUInt32BE(e.posterTime || 0, 76),
                  r.writeUInt32BE(e.selectionTime || 0, 80),
                  r.writeUInt32BE(e.selectionDuration || 0, 84),
                  r.writeUInt32BE(e.currentTime || 0, 88),
                  r.writeUInt32BE(e.nextTrackId || 0, 92),
                  (n.mvhd.encode.bytes = 96),
                  r
                );
              }),
              (n.mvhd.decode = function(e, t) {
                return (
                  (e = e.slice(t)),
                  {
                    ctime: h(e, 0),
                    mtime: h(e, 4),
                    timeScale: e.readUInt32BE(8),
                    duration: e.readUInt32BE(12),
                    preferredRate: m(e, 16),
                    preferredVolume: g(e, 20),
                    matrix: f(e.slice(32, 68)),
                    previewTime: e.readUInt32BE(68),
                    previewDuration: e.readUInt32BE(72),
                    posterTime: e.readUInt32BE(76),
                    selectionTime: e.readUInt32BE(80),
                    selectionDuration: e.readUInt32BE(84),
                    currentTime: e.readUInt32BE(88),
                    nextTrackId: e.readUInt32BE(92)
                  }
                );
              }),
              (n.mvhd.encodingLength = function() {
                return 96;
              }),
              (n.tkhd = {}),
              (n.tkhd.encode = function(e, r, a) {
                return (
                  (r = r ? r.slice(a) : t.alloc(80)),
                  i(e.ctime || new Date(), r, 0),
                  i(e.mtime || new Date(), r, 4),
                  r.writeUInt32BE(e.trackId || 0, 8),
                  o(r, 12, 16),
                  r.writeUInt32BE(e.duration || 0, 16),
                  o(r, 20, 28),
                  r.writeUInt16BE(e.layer || 0, 28),
                  r.writeUInt16BE(e.alternateGroup || 0, 30),
                  r.writeUInt16BE(e.volume || 0, 32),
                  c(e.matrix, r, 36),
                  r.writeUInt32BE(e.trackWidth || 0, 72),
                  r.writeUInt32BE(e.trackHeight || 0, 76),
                  (n.tkhd.encode.bytes = 80),
                  r
                );
              }),
              (n.tkhd.decode = function(e, t) {
                return (
                  (e = e.slice(t)),
                  {
                    ctime: h(e, 0),
                    mtime: h(e, 4),
                    trackId: e.readUInt32BE(8),
                    duration: e.readUInt32BE(16),
                    layer: e.readUInt16BE(28),
                    alternateGroup: e.readUInt16BE(30),
                    volume: e.readUInt16BE(32),
                    matrix: f(e.slice(36, 72)),
                    trackWidth: e.readUInt32BE(72),
                    trackHeight: e.readUInt32BE(76)
                  }
                );
              }),
              (n.tkhd.encodingLength = function() {
                return 80;
              }),
              (n.mdhd = {}),
              (n.mdhd.encode = function(e, r, o) {
                return 1 === e.version
                  ? ((r = r ? r.slice(o) : t.alloc(32)),
                    a(e.ctime || new Date(), r, 0),
                    a(e.mtime || new Date(), r, 8),
                    r.writeUInt32BE(e.timeScale || 0, 16),
                    r.writeUIntBE(e.duration || 0, 20, 6),
                    r.writeUInt16BE(e.language || 0, 28),
                    r.writeUInt16BE(e.quality || 0, 30),
                    (n.mdhd.encode.bytes = 32),
                    r)
                  : ((r = r ? r.slice(o) : t.alloc(20)),
                    i(e.ctime || new Date(), r, 0),
                    i(e.mtime || new Date(), r, 4),
                    r.writeUInt32BE(e.timeScale || 0, 8),
                    r.writeUInt32BE(e.duration || 0, 12),
                    r.writeUInt16BE(e.language || 0, 16),
                    r.writeUInt16BE(e.quality || 0, 18),
                    (n.mdhd.encode.bytes = 20),
                    r);
              }),
              (n.mdhd.decode = function(e, t, n) {
                e = e.slice(t);
                return 20 != n - t
                  ? {
                      ctime: p(e, 0),
                      mtime: p(e, 8),
                      timeScale: e.readUInt32BE(16),
                      duration: e.readUIntBE(20, 6),
                      language: e.readUInt16BE(28),
                      quality: e.readUInt16BE(30)
                    }
                  : {
                      ctime: h(e, 0),
                      mtime: h(e, 4),
                      timeScale: e.readUInt32BE(8),
                      duration: e.readUInt32BE(12),
                      language: e.readUInt16BE(16),
                      quality: e.readUInt16BE(18)
                    };
              }),
              (n.mdhd.encodingLength = function(e) {
                return 1 === e.version ? 32 : 20;
              }),
              (n.vmhd = {}),
              (n.vmhd.encode = function(e, r, o) {
                (r = r ? r.slice(o) : t.alloc(8)),
                  r.writeUInt16BE(e.graphicsMode || 0, 0);
                var i = e.opcolor || [0, 0, 0];
                return (
                  r.writeUInt16BE(i[0], 2),
                  r.writeUInt16BE(i[1], 4),
                  r.writeUInt16BE(i[2], 6),
                  (n.vmhd.encode.bytes = 8),
                  r
                );
              }),
              (n.vmhd.decode = function(e, t) {
                return (
                  (e = e.slice(t)),
                  {
                    graphicsMode: e.readUInt16BE(0),
                    opcolor: [
                      e.readUInt16BE(2),
                      e.readUInt16BE(4),
                      e.readUInt16BE(6)
                    ]
                  }
                );
              }),
              (n.vmhd.encodingLength = function() {
                return 8;
              }),
              (n.smhd = {}),
              (n.smhd.encode = function(e, r, i) {
                return (
                  (r = r ? r.slice(i) : t.alloc(4)),
                  r.writeUInt16BE(e.balance || 0, 0),
                  o(r, 2, 4),
                  (n.smhd.encode.bytes = 4),
                  r
                );
              }),
              (n.smhd.decode = function(e, t) {
                return (e = e.slice(t)), { balance: e.readUInt16BE(0) };
              }),
              (n.smhd.encodingLength = function() {
                return 4;
              }),
              (n.stsd = {}),
              (n.stsd.encode = function(e, r, o) {
                r = r ? r.slice(o) : t.alloc(n.stsd.encodingLength(e));
                var a = e.entries || [];
                r.writeUInt32BE(a.length, 0);
                for (var d = 4, s = 0, l; s < a.length; s++)
                  (l = a[s]), b.encode(l, r, d), (d += b.encode.bytes);
                return (n.stsd.encode.bytes = d), r;
              }),
              (n.stsd.decode = function(e, t, n) {
                e = e.slice(t);
                for (
                  var r = e.readUInt32BE(0), o = Array(r), a = 4, d = 0, s;
                  d < r;
                  d++
                )
                  (s = b.decode(e, a, n)), (o[d] = s), (a += s.length);
                return { entries: o };
              }),
              (n.stsd.encodingLength = function(e) {
                var t = 4;
                if (!e.entries) return t;
                for (var n = 0; n < e.entries.length; n++)
                  t += b.encodingLength(e.entries[n]);
                return t;
              }),
              (n.avc1 = n.VisualSampleEntry = {}),
              (n.VisualSampleEntry.encode = function(e, r, i) {
                (r = r
                  ? r.slice(i)
                  : t.alloc(n.VisualSampleEntry.encodingLength(e))),
                  o(r, 0, 6),
                  r.writeUInt16BE(e.dataReferenceIndex || 0, 6),
                  o(r, 8, 24),
                  r.writeUInt16BE(e.width || 0, 24),
                  r.writeUInt16BE(e.height || 0, 26),
                  r.writeUInt32BE(e.hResolution || 4718592, 28),
                  r.writeUInt32BE(e.vResolution || 4718592, 32),
                  o(r, 36, 40),
                  r.writeUInt16BE(e.frameCount || 1, 40);
                var a = e.compressorName || "",
                  d = s(a.length, 31);
                r.writeUInt8(d, 42),
                  r.write(a, 43, d, "utf8"),
                  r.writeUInt16BE(e.depth || 24, 74),
                  r.writeInt16BE(-1, 76);
                var l = 78,
                  c = e.children || [];
                c.forEach(function(e) {
                  b.encode(e, r, l), (l += b.encode.bytes);
                }),
                  (n.VisualSampleEntry.encode.bytes = l);
              }),
              (n.VisualSampleEntry.decode = function(e, t, n) {
                e = e.slice(t);
                for (
                  var r = n - t,
                    o = s(e.readUInt8(42), 31),
                    i = {
                      dataReferenceIndex: e.readUInt16BE(6),
                      width: e.readUInt16BE(24),
                      height: e.readUInt16BE(26),
                      hResolution: e.readUInt32BE(28),
                      vResolution: e.readUInt32BE(32),
                      frameCount: e.readUInt16BE(40),
                      compressorName: e.toString("utf8", 43, 43 + o),
                      depth: e.readUInt16BE(74),
                      children: []
                    },
                    a = 78;
                  8 <= r - a;

                ) {
                  var d = b.decode(e, a, r);
                  i.children.push(d), (i[d.type] = d), (a += d.length);
                }
                return i;
              }),
              (n.VisualSampleEntry.encodingLength = function(e) {
                var t = 78,
                  n = e.children || [];
                return (
                  n.forEach(function(e) {
                    t += b.encodingLength(e);
                  }),
                  t
                );
              }),
              (n.avcC = {}),
              (n.avcC.encode = function(e, r, o) {
                (r = r ? r.slice(o) : t.alloc(e.buffer.length)),
                  e.buffer.copy(r),
                  (n.avcC.encode.bytes = e.buffer.length);
              }),
              (n.avcC.decode = function(e, n, r) {
                return (
                  (e = e.slice(n, r)),
                  { mimeCodec: e.toString("hex", 1, 4), buffer: t.from(e) }
                );
              }),
              (n.avcC.encodingLength = function(e) {
                return e.buffer.length;
              }),
              (n.mp4a = n.AudioSampleEntry = {}),
              (n.AudioSampleEntry.encode = function(e, r, i) {
                (r = r
                  ? r.slice(i)
                  : t.alloc(n.AudioSampleEntry.encodingLength(e))),
                  o(r, 0, 6),
                  r.writeUInt16BE(e.dataReferenceIndex || 0, 6),
                  o(r, 8, 16),
                  r.writeUInt16BE(e.channelCount || 2, 16),
                  r.writeUInt16BE(e.sampleSize || 16, 18),
                  o(r, 20, 24),
                  r.writeUInt32BE(e.sampleRate || 0, 24);
                var a = 28,
                  d = e.children || [];
                d.forEach(function(e) {
                  b.encode(e, r, a), (a += b.encode.bytes);
                }),
                  (n.AudioSampleEntry.encode.bytes = a);
              }),
              (n.AudioSampleEntry.decode = function(e, t, n) {
                e = e.slice(t, n);
                for (
                  var r = n - t,
                    o = {
                      dataReferenceIndex: e.readUInt16BE(6),
                      channelCount: e.readUInt16BE(16),
                      sampleSize: e.readUInt16BE(18),
                      sampleRate: e.readUInt32BE(24),
                      children: []
                    },
                    i = 28;
                  8 <= r - i;

                ) {
                  var a = b.decode(e, i, r);
                  o.children.push(a), (o[a.type] = a), (i += a.length);
                }
                return o;
              }),
              (n.AudioSampleEntry.encodingLength = function(e) {
                var t = 28,
                  n = e.children || [];
                return (
                  n.forEach(function(e) {
                    t += b.encodingLength(e);
                  }),
                  t
                );
              }),
              (n.esds = {}),
              (n.esds.encode = function(e, r, o) {
                (r = r ? r.slice(o) : t.alloc(e.buffer.length)),
                  e.buffer.copy(r, 0),
                  (n.esds.encode.bytes = e.buffer.length);
              }),
              (n.esds.decode = function(e, n, r) {
                e = e.slice(n, r);
                var o = y.Descriptor.decode(e, 0, e.length),
                  i = "ESDescriptor" === o.tagName ? o : {},
                  a = i.DecoderConfigDescriptor || {},
                  d = a.oti || 0,
                  s = a.DecoderSpecificInfo,
                  l = s ? (248 & s.buffer.readUInt8(0)) >> 3 : 0,
                  c = null;
                return (
                  d && ((c = d.toString(16)), l && (c += "." + l)),
                  { mimeCodec: c, buffer: t.from(e.slice(0)) }
                );
              }),
              (n.esds.encodingLength = function(e) {
                return e.buffer.length;
              }),
              (n.stsz = {}),
              (n.stsz.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.stsz.encodingLength(e))),
                  r.writeUInt32BE(0, 0),
                  r.writeUInt32BE(a.length, 4);
                for (var d = 0; d < a.length; d++)
                  r.writeUInt32BE(a[d], 4 * d + 8);
                return (n.stsz.encode.bytes = 8 + 4 * a.length), r;
              }),
              (n.stsz.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0),
                    r = e.readUInt32BE(4),
                    o = Array(r),
                    a = 0;
                  a < r;
                  a++
                )
                  o[a] = 0 === n ? e.readUInt32BE(4 * a + 8) : n;
                return { entries: o };
              }),
              (n.stsz.encodingLength = function(e) {
                return 8 + 4 * e.entries.length;
              }),
              (n.stss = n.stco = {}),
              (n.stco.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.stco.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var d = 0; d < a.length; d++)
                  r.writeUInt32BE(a[d], 4 * d + 4);
                return (n.stco.encode.bytes = 4 + 4 * a.length), r;
              }),
              (n.stco.decode = function(e, t) {
                e = e.slice(t);
                for (var n = e.readUInt32BE(0), r = Array(n), o = 0; o < n; o++)
                  r[o] = e.readUInt32BE(4 * o + 4);
                return { entries: r };
              }),
              (n.stco.encodingLength = function(e) {
                return 4 + 4 * e.entries.length;
              }),
              (n.co64 = {}),
              (n.co64.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.co64.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var d = 0; d < a.length; d++) w.encode(a[d], r, 8 * d + 4);
                return (n.co64.encode.bytes = 4 + 8 * a.length), r;
              }),
              (n.co64.decode = function(e, t) {
                e = e.slice(t);
                for (var n = e.readUInt32BE(0), r = Array(n), o = 0; o < n; o++)
                  r[o] = w.decode(e, 8 * o + 4);
                return { entries: r };
              }),
              (n.co64.encodingLength = function(e) {
                return 4 + 8 * e.entries.length;
              }),
              (n.stts = {}),
              (n.stts.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.stts.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var d = 0, s; d < a.length; d++)
                  (s = 8 * d + 4),
                    r.writeUInt32BE(a[d].count || 0, s),
                    r.writeUInt32BE(a[d].duration || 0, s + 4);
                return (n.stts.encode.bytes = 4 + 8 * e.entries.length), r;
              }),
              (n.stts.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0), r = Array(n), o = 0, a;
                  o < n;
                  o++
                )
                  (a = 8 * o + 4),
                    (r[o] = {
                      count: e.readUInt32BE(a),
                      duration: e.readUInt32BE(a + 4)
                    });
                return { entries: r };
              }),
              (n.stts.encodingLength = function(e) {
                return 4 + 8 * e.entries.length;
              }),
              (n.ctts = {}),
              (n.ctts.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.ctts.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var d = 0, s; d < a.length; d++)
                  (s = 8 * d + 4),
                    r.writeUInt32BE(a[d].count || 0, s),
                    r.writeUInt32BE(a[d].compositionOffset || 0, s + 4);
                return (n.ctts.encode.bytes = 4 + 8 * a.length), r;
              }),
              (n.ctts.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0), r = Array(n), o = 0, a;
                  o < n;
                  o++
                )
                  (a = 8 * o + 4),
                    (r[o] = {
                      count: e.readUInt32BE(a),
                      compositionOffset: e.readInt32BE(a + 4)
                    });
                return { entries: r };
              }),
              (n.ctts.encodingLength = function(e) {
                return 4 + 8 * e.entries.length;
              }),
              (n.stsc = {}),
              (n.stsc.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.stsc.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var d = 0, s; d < a.length; d++)
                  (s = 12 * d + 4),
                    r.writeUInt32BE(a[d].firstChunk || 0, s),
                    r.writeUInt32BE(a[d].samplesPerChunk || 0, s + 4),
                    r.writeUInt32BE(a[d].sampleDescriptionId || 0, s + 8);
                return (n.stsc.encode.bytes = 4 + 12 * a.length), r;
              }),
              (n.stsc.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0), r = Array(n), o = 0, a;
                  o < n;
                  o++
                )
                  (a = 12 * o + 4),
                    (r[o] = {
                      firstChunk: e.readUInt32BE(a),
                      samplesPerChunk: e.readUInt32BE(a + 4),
                      sampleDescriptionId: e.readUInt32BE(a + 8)
                    });
                return { entries: r };
              }),
              (n.stsc.encodingLength = function(e) {
                return 4 + 12 * e.entries.length;
              }),
              (n.dref = {}),
              (n.dref.encode = function(e, r, o) {
                r = r ? r.slice(o) : t.alloc(n.dref.encodingLength(e));
                var a = e.entries || [];
                r.writeUInt32BE(a.length, 0);
                for (var d = 4, s = 0; s < a.length; s++) {
                  var l = a[s],
                    c = (l.buf ? l.buf.length : 0) + 4 + 4;
                  r.writeUInt32BE(c, d),
                    (d += 4),
                    r.write(l.type, d, 4, "ascii"),
                    (d += 4),
                    l.buf && (l.buf.copy(r, d), (d += l.buf.length));
                }
                return (n.dref.encode.bytes = d), r;
              }),
              (n.dref.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0), r = Array(n), o = 4, a = 0;
                  a < n;
                  a++
                ) {
                  var d = e.readUInt32BE(o),
                    s = e.toString("ascii", o + 4, o + 8),
                    l = e.slice(o + 8, o + d);
                  (o += d), (r[a] = { type: s, buf: l });
                }
                return { entries: r };
              }),
              (n.dref.encodingLength = function(e) {
                var t = 4;
                if (!e.entries) return t;
                for (var n = 0, r; n < e.entries.length; n++)
                  (r = e.entries[n].buf), (t += (r ? r.length : 0) + 4 + 4);
                return t;
              }),
              (n.elst = {}),
              (n.elst.encode = function(e, r, o) {
                var a = e.entries || [];
                (r = r ? r.slice(o) : t.alloc(n.elst.encodingLength(e))),
                  r.writeUInt32BE(a.length, 0);
                for (var s = 0, l; s < a.length; s++)
                  (l = 12 * s + 4),
                    r.writeUInt32BE(a[s].trackDuration || 0, l),
                    r.writeUInt32BE(a[s].mediaTime || 0, l + 4),
                    d(a[s].mediaRate || 0, r, l + 8);
                return (n.elst.encode.bytes = 4 + 12 * a.length), r;
              }),
              (n.elst.decode = function(e, t) {
                e = e.slice(t);
                for (
                  var n = e.readUInt32BE(0), r = Array(n), o = 0, a;
                  o < n;
                  o++
                )
                  (a = 12 * o + 4),
                    (r[o] = {
                      trackDuration: e.readUInt32BE(a),
                      mediaTime: e.readInt32BE(a + 4),
                      mediaRate: m(e, a + 8)
                    });
                return { entries: r };
              }),
              (n.elst.encodingLength = function(e) {
                return 4 + 12 * e.entries.length;
              }),
              (n.hdlr = {}),
              (n.hdlr.encode = function(e, r, o) {
                r = r ? r.slice(o) : t.alloc(n.hdlr.encodingLength(e));
                var i = 21 + (e.name || "").length;
                return (
                  r.fill(0, 0, i),
                  r.write(e.handlerType || "", 4, 4, "ascii"),
                  u(e.name || "", r, 20),
                  (n.hdlr.encode.bytes = i),
                  r
                );
              }),
              (n.hdlr.decode = function(e, t, n) {
                return (
                  (e = e.slice(t)),
                  { handlerType: e.toString("ascii", 4, 8), name: _(e, 20, n) }
                );
              }),
              (n.hdlr.encodingLength = function(e) {
                return 21 + (e.name || "").length;
              }),
              (n.mehd = {}),
              (n.mehd.encode = function(e, r, o) {
                return (
                  (r = r ? r.slice(o) : t.alloc(4)),
                  r.writeUInt32BE(e.fragmentDuration || 0, 0),
                  (n.mehd.encode.bytes = 4),
                  r
                );
              }),
              (n.mehd.decode = function(e, t) {
                return (
                  (e = e.slice(t)), { fragmentDuration: e.readUInt32BE(0) }
                );
              }),
              (n.mehd.encodingLength = function() {
                return 4;
              }),
              (n.trex = {}),
              (n.trex.encode = function(e, r, o) {
                return (
                  (r = r ? r.slice(o) : t.alloc(20)),
                  r.writeUInt32BE(e.trackId || 0, 0),
                  r.writeUInt32BE(e.defaultSampleDescriptionIndex || 0, 4),
                  r.writeUInt32BE(e.defaultSampleDuration || 0, 8),
                  r.writeUInt32BE(e.defaultSampleSize || 0, 12),
                  r.writeUInt32BE(e.defaultSampleFlags || 0, 16),
                  (n.trex.encode.bytes = 20),
                  r
                );
              }),
              (n.trex.decode = function(e, t) {
                return (
                  (e = e.slice(t)),
                  {
                    trackId: e.readUInt32BE(0),
                    defaultSampleDescriptionIndex: e.readUInt32BE(4),
                    defaultSampleDuration: e.readUInt32BE(8),
                    defaultSampleSize: e.readUInt32BE(12),
                    defaultSampleFlags: e.readUInt32BE(16)
                  }
                );
              }),
              (n.trex.encodingLength = function() {
                return 20;
              }),
              (n.mfhd = {}),
              (n.mfhd.encode = function(e, r, o) {
                return (
                  (r = r ? r.slice(o) : t.alloc(4)),
                  r.writeUInt32BE(e.sequenceNumber || 0, 0),
                  (n.mfhd.encode.bytes = 4),
                  r
                );
              }),
              (n.mfhd.decode = function(e) {
                return { sequenceNumber: e.readUInt32BE(0) };
              }),
              (n.mfhd.encodingLength = function() {
                return 4;
              }),
              (n.tfhd = {}),
              (n.tfhd.encode = function(e, r, o) {
                return (
                  (r = r ? r.slice(o) : t.alloc(4)),
                  r.writeUInt32BE(e.trackId, 0),
                  (n.tfhd.encode.bytes = 4),
                  r
                );
              }),
              (n.tfhd.decode = function() {}),
              (n.tfhd.encodingLength = function() {
                return 4;
              }),
              (n.tfdt = {}),
              (n.tfdt.encode = function(e, r, o) {
                return (
                  (r = r ? r.slice(o) : t.alloc(4)),
                  r.writeUInt32BE(e.baseMediaDecodeTime || 0, 0),
                  (n.tfdt.encode.bytes = 4),
                  r
                );
              }),
              (n.tfdt.decode = function() {}),
              (n.tfdt.encodingLength = function() {
                return 4;
              }),
              (n.trun = {}),
              (n.trun.encode = function(e, r, o) {
                (r = r ? r.slice(o) : t.alloc(8 + 16 * e.entries.length)),
                  r.writeUInt32BE(e.entries.length, 0),
                  r.writeInt32BE(e.dataOffset, 4);
                for (var a = 8, d = 0, s; d < e.entries.length; d++)
                  (s = e.entries[d]),
                    r.writeUInt32BE(s.sampleDuration, a),
                    (a += 4),
                    r.writeUInt32BE(s.sampleSize, a),
                    (a += 4),
                    r.writeUInt32BE(s.sampleFlags, a),
                    (a += 4),
                    0 === (e.version || 0)
                      ? r.writeUInt32BE(s.sampleCompositionTimeOffset, a)
                      : r.writeInt32BE(s.sampleCompositionTimeOffset, a),
                    (a += 4);
                n.trun.encode.bytes = a;
              }),
              (n.trun.decode = function() {}),
              (n.trun.encodingLength = function(e) {
                return 8 + 16 * e.entries.length;
              }),
              (n.mdat = {}),
              (n.mdat.encode = function(e, t, r) {
                e.buffer
                  ? (e.buffer.copy(t, r),
                    (n.mdat.encode.bytes = e.buffer.length))
                  : (n.mdat.encode.bytes = n.mdat.encodingLength(e));
              }),
              (n.mdat.decode = function(e, n, r) {
                return { buffer: t.from(e.slice(n, r)) };
              }),
              (n.mdat.encodingLength = function(e) {
                return e.buffer ? e.buffer.length : e.contentLength;
              });
          }.call(this, e("buffer").Buffer));
        },
        { "./descriptor": 48, "./index": 49, buffer: 26, uint64be: 113 }
      ],
      48: [
        function(e, t, n) {
          (function(e) {
            var t = {
              3: "ESDescriptor",
              4: "DecoderConfigDescriptor",
              5: "DecoderSpecificInfo",
              6: "SLConfigDescriptor"
            };
            (n.Descriptor = {}),
              (n.Descriptor.decode = function(r, o, i) {
                var a = r.readUInt8(o),
                  d = o + 1,
                  s = 0,
                  l;
                do (l = r.readUInt8(d++)), (s = (s << 7) | (127 & l));
                while (128 & l);
                var c = t[a],
                  u;
                return (
                  (u = n[c]
                    ? n[c].decode(r, d, i)
                    : { buffer: e.from(r.slice(d, d + s)) }),
                  (u.tag = a),
                  (u.tagName = c),
                  (u.length = d - o + s),
                  (u.contentsLen = s),
                  u
                );
              }),
              (n.DescriptorArray = {}),
              (n.DescriptorArray.decode = function(e, r, o) {
                for (var i = r, a = {}; i + 2 <= o; ) {
                  var d = n.Descriptor.decode(e, i, o);
                  i += d.length;
                  var s = t[d.tag] || "Descriptor" + d.tag;
                  a[s] = d;
                }
                return a;
              }),
              (n.ESDescriptor = {}),
              (n.ESDescriptor.decode = function(e, t, r) {
                var o = e.readUInt8(t + 2),
                  i = t + 3;
                if ((128 & o && (i += 2), 64 & o)) {
                  var a = e.readUInt8(i);
                  i += a + 1;
                }
                return 32 & o && (i += 2), n.DescriptorArray.decode(e, i, r);
              }),
              (n.DecoderConfigDescriptor = {}),
              (n.DecoderConfigDescriptor.decode = function(e, t, r) {
                var o = e.readUInt8(t),
                  i = n.DescriptorArray.decode(e, t + 13, r);
                return (i.oti = o), i;
              });
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      49: [
        function(e, t, n) {
          (function(t) {
            var r = e("uint64be"),
              o = e("./boxes"),
              i = 4294967295,
              a = n,
              d = (n.containers = {
                moov: ["mvhd", "meta", "traks", "mvex"],
                trak: ["tkhd", "tref", "trgr", "edts", "meta", "mdia", "udta"],
                edts: ["elst"],
                mdia: ["mdhd", "hdlr", "elng", "minf"],
                minf: ["vmhd", "smhd", "hmhd", "sthd", "nmhd", "dinf", "stbl"],
                dinf: ["dref"],
                stbl: [
                  "stsd",
                  "stts",
                  "ctts",
                  "cslg",
                  "stsc",
                  "stsz",
                  "stz2",
                  "stco",
                  "co64",
                  "stss",
                  "stsh",
                  "padb",
                  "stdp",
                  "sdtp",
                  "sbgps",
                  "sgpds",
                  "subss",
                  "saizs",
                  "saios"
                ],
                mvex: ["mehd", "trexs", "leva"],
                moof: ["mfhd", "meta", "trafs"],
                traf: [
                  "tfhd",
                  "tfdt",
                  "trun",
                  "sbgps",
                  "sgpds",
                  "subss",
                  "saizs",
                  "saios",
                  "meta"
                ]
              });
            (a.encode = function(e, n, r) {
              return (
                a.encodingLength(e),
                (r = r || 0),
                (n = n || t.alloc(e.length)),
                a._encode(e, n, r)
              );
            }),
              (a._encode = function(e, t, n) {
                var s = e.type,
                  l = e.length;
                l > i && (l = 1),
                  t.writeUInt32BE(l, n),
                  t.write(e.type, n + 4, 4, "ascii");
                var c = n + 8;
                if (
                  (1 === l && (r.encode(e.length, t, c), (c += 8)),
                  o.fullBoxes[s] &&
                    (t.writeUInt32BE(e.flags || 0, c),
                    t.writeUInt8(e.version || 0, c),
                    (c += 4)),
                  d[s])
                ) {
                  var u = d[s];
                  u.forEach(function(n) {
                    if (5 === n.length) {
                      var r = e[n] || [];
                      (n = n.substr(0, 4)),
                        r.forEach(function(e) {
                          a._encode(e, t, c), (c += a.encode.bytes);
                        });
                    } else
                      e[n] && (a._encode(e[n], t, c), (c += a.encode.bytes));
                  }),
                    e.otherBoxes &&
                      e.otherBoxes.forEach(function(e) {
                        a._encode(e, t, c), (c += a.encode.bytes);
                      });
                } else if (o[s]) {
                  var f = o[s].encode;
                  f(e, t, c), (c += f.bytes);
                } else if (e.buffer) {
                  var p = e.buffer;
                  p.copy(t, c), (c += e.buffer.length);
                } else
                  throw new Error(
                    "Either `type` must be set to a known type (not'" +
                      s +
                      "') or `buffer` must be set"
                  );
                return (a.encode.bytes = c - n), t;
              }),
              (a.readHeaders = function(e, t, n) {
                if (((t = t || 0), (n = n || e.length), 8 > n - t)) return 8;
                var i = e.readUInt32BE(t),
                  a = e.toString("ascii", t + 4, t + 8),
                  d = t + 8;
                if (1 === i) {
                  if (16 > n - t) return 16;
                  (i = r.decode(e, d)), (d += 8);
                }
                var s, l;
                return (
                  o.fullBoxes[a] &&
                    ((s = e.readUInt8(d)),
                    (l = 16777215 & e.readUInt32BE(d)),
                    (d += 4)),
                  {
                    length: i,
                    headersLen: d - t,
                    contentLen: i - (d - t),
                    type: a,
                    version: s,
                    flags: l
                  }
                );
              }),
              (a.decode = function(e, t, n) {
                (t = t || 0), (n = n || e.length);
                var r = a.readHeaders(e, t, n);
                if (!r || r.length > n - t) throw new Error("Data too short");
                return a.decodeWithoutHeaders(
                  r,
                  e,
                  t + r.headersLen,
                  t + r.length
                );
              }),
              (a.decodeWithoutHeaders = function(e, n, r, i) {
                (r = r || 0), (i = i || n.length);
                var s = e.type,
                  l = {};
                if (d[s]) {
                  l.otherBoxes = [];
                  for (var c = d[s], u = r, f; 8 <= i - u; )
                    if (
                      ((f = a.decode(n, u, i)),
                      (u += f.length),
                      0 <= c.indexOf(f.type))
                    )
                      l[f.type] = f;
                    else if (0 <= c.indexOf(f.type + "s")) {
                      var p = f.type + "s",
                        h = (l[p] = l[p] || []);
                      h.push(f);
                    } else l.otherBoxes.push(f);
                } else if (o[s]) {
                  var m = o[s].decode;
                  l = m(n, r, i);
                } else l.buffer = t.from(n.slice(r, i));
                return (
                  (l.length = e.length),
                  (l.contentLen = e.contentLen),
                  (l.type = e.type),
                  (l.version = e.version),
                  (l.flags = e.flags),
                  l
                );
              }),
              (a.encodingLength = function(e) {
                var t = e.type,
                  n = 8;
                if ((o.fullBoxes[t] && (n += 4), d[t])) {
                  var r = d[t];
                  r.forEach(function(t) {
                    if (5 === t.length) {
                      var r = e[t] || [];
                      (t = t.substr(0, 4)),
                        r.forEach(function(e) {
                          (e.type = t), (n += a.encodingLength(e));
                        });
                    } else if (e[t]) {
                      var o = e[t];
                      (o.type = t), (n += a.encodingLength(o));
                    }
                  }),
                    e.otherBoxes &&
                      e.otherBoxes.forEach(function(e) {
                        n += a.encodingLength(e);
                      });
                } else if (o[t]) n += o[t].encodingLength(e);
                else if (e.buffer) n += e.buffer.length;
                else
                  throw new Error(
                    "Either `type` must be set to a known type (not'" +
                      t +
                      "') or `buffer` must be set"
                  );
                return n > i && (n += 8), (e.length = n), n;
              });
          }.call(this, e("buffer").Buffer));
        },
        { "./boxes": 47, buffer: 26, uint64be: 113 }
      ],
      50: [
        function(e, t) {
          (function(n) {
            var r = e("readable-stream"),
              o = e("next-event"),
              i = e("mp4-box-encoding"),
              a = n.alloc(0);
            class d extends r.Writable {
              constructor(e) {
                super(e),
                  (this.destroyed = !1),
                  (this._pending = 0),
                  (this._missing = 0),
                  (this._ignoreEmpty = !1),
                  (this._buf = null),
                  (this._str = null),
                  (this._cb = null),
                  (this._ondrain = null),
                  (this._writeBuffer = null),
                  (this._writeCb = null),
                  (this._ondrain = null),
                  this._kick();
              }
              destroy(e) {
                this.destroyed ||
                  ((this.destroyed = !0),
                  e && this.emit("error", e),
                  this.emit("close"));
              }
              _write(e, t, n) {
                if (!this.destroyed) {
                  for (
                    var r = !this._str || !this._str._writableState.needDrain;
                    e.length && !this.destroyed;

                  ) {
                    if (!this._missing && !this._ignoreEmpty)
                      return (this._writeBuffer = e), void (this._writeCb = n);
                    var o = e.length < this._missing ? e.length : this._missing;
                    if (
                      (this._buf
                        ? e.copy(this._buf, this._buf.length - this._missing)
                        : this._str &&
                          (r = this._str.write(
                            o === e.length ? e : e.slice(0, o)
                          )),
                      (this._missing -= o),
                      !this._missing)
                    ) {
                      var i = this._buf,
                        d = this._cb,
                        s = this._str;
                      (this._buf = this._cb = this._str = this._ondrain = null),
                        (r = !0),
                        (this._ignoreEmpty = !1),
                        s && s.end(),
                        d && d(i);
                    }
                    e = o === e.length ? a : e.slice(o);
                  }
                  return this._pending && !this._missing
                    ? ((this._writeBuffer = e), void (this._writeCb = n))
                    : void (r ? n() : this._ondrain(n));
                }
              }
              _buffer(e, t) {
                (this._missing = e), (this._buf = n.alloc(e)), (this._cb = t);
              }
              _stream(e, t) {
                return (
                  (this._missing = e),
                  (this._str = new s(this)),
                  (this._ondrain = o(this._str, "drain")),
                  this._pending++,
                  this._str.on("end", () => {
                    this._pending--, this._kick();
                  }),
                  (this._cb = t),
                  this._str
                );
              }
              _readBox() {
                const e = (t, r) => {
                  this._buffer(t, t => {
                    r = r ? n.concat([r, t]) : t;
                    var o = i.readHeaders(r);
                    "number" == typeof o
                      ? e(o - r.length, r)
                      : (this._pending++,
                        (this._headers = o),
                        this.emit("box", o));
                  });
                };
                e(8);
              }
              stream() {
                if (!this._headers)
                  throw new Error(
                    "this function can only be called once after 'box' is emitted"
                  );
                var e = this._headers;
                return (this._headers = null), this._stream(e.contentLen, null);
              }
              decode(e) {
                if (!this._headers)
                  throw new Error(
                    "this function can only be called once after 'box' is emitted"
                  );
                var t = this._headers;
                (this._headers = null),
                  this._buffer(t.contentLen, n => {
                    var r = i.decodeWithoutHeaders(t, n);
                    e(r), this._pending--, this._kick();
                  });
              }
              ignore() {
                if (!this._headers)
                  throw new Error(
                    "this function can only be called once after 'box' is emitted"
                  );
                var e = this._headers;
                (this._headers = null),
                  (this._missing = e.contentLen),
                  0 === this._missing && (this._ignoreEmpty = !0),
                  (this._cb = () => {
                    this._pending--, this._kick();
                  });
              }
              _kick() {
                if (
                  !this._pending &&
                  (this._buf || this._str || this._readBox(), this._writeBuffer)
                ) {
                  var e = this._writeCb,
                    t = this._writeBuffer;
                  (this._writeBuffer = null),
                    (this._writeCb = null),
                    this._write(t, null, e);
                }
              }
            }
            class s extends r.PassThrough {
              constructor(e) {
                super(), (this._parent = e), (this.destroyed = !1);
              }
              destroy(e) {
                this.destroyed ||
                  ((this.destroyed = !0),
                  this._parent.destroy(e),
                  e && this.emit("error", e),
                  this.emit("close"));
              }
            }
            t.exports = d;
          }.call(this, e("buffer").Buffer));
        },
        {
          buffer: 26,
          "mp4-box-encoding": 49,
          "next-event": 55,
          "readable-stream": 85
        }
      ],
      51: [
        function(e, t) {
          (function(n, r) {
            function o() {}
            var i = e("readable-stream"),
              a = e("mp4-box-encoding");
            class d extends i.Readable {
              constructor(e) {
                super(e),
                  (this.destroyed = !1),
                  (this._finalized = !1),
                  (this._reading = !1),
                  (this._stream = null),
                  (this._drain = null),
                  (this._want = !1),
                  (this._onreadable = () => {
                    this._want && ((this._want = !1), this._read());
                  }),
                  (this._onend = () => {
                    this._stream = null;
                  });
              }
              mdat(e, t) {
                this.mediaData(e, t);
              }
              mediaData(e, t) {
                var n = new s(this);
                return (
                  this.box(
                    {
                      type: "mdat",
                      contentLength: e,
                      encodeBufferLen: 8,
                      stream: n
                    },
                    t
                  ),
                  n
                );
              }
              box(e, t) {
                if ((t || (t = o), this.destroyed))
                  return t(new Error("Encoder is destroyed"));
                var i;
                if (
                  (e.encodeBufferLen && (i = r.alloc(e.encodeBufferLen)),
                  e.stream)
                )
                  (e.buffer = null),
                    (i = a.encode(e, i)),
                    this.push(i),
                    (this._stream = e.stream),
                    this._stream.on("readable", this._onreadable),
                    this._stream.on("end", this._onend),
                    this._stream.on("end", t),
                    this._forward();
                else {
                  i = a.encode(e, i);
                  var d = this.push(i);
                  if (d) return n.nextTick(t);
                  this._drain = t;
                }
              }
              destroy(e) {
                if (!this.destroyed) {
                  if (
                    ((this.destroyed = !0),
                    this._stream &&
                      this._stream.destroy &&
                      this._stream.destroy(),
                    (this._stream = null),
                    this._drain)
                  ) {
                    var t = this._drain;
                    (this._drain = null), t(e);
                  }
                  e && this.emit("error", e), this.emit("close");
                }
              }
              finalize() {
                (this._finalized = !0),
                  this._stream || this._drain || this.push(null);
              }
              _forward() {
                if (this._stream)
                  for (; !this.destroyed; ) {
                    var e = this._stream.read();
                    if (!e) return void (this._want = !!this._stream);
                    if (!this.push(e)) return;
                  }
              }
              _read() {
                if (!(this._reading || this.destroyed)) {
                  if (
                    ((this._reading = !0),
                    this._stream && this._forward(),
                    this._drain)
                  ) {
                    var e = this._drain;
                    (this._drain = null), e();
                  }
                  (this._reading = !1), this._finalized && this.push(null);
                }
              }
            }
            class s extends i.PassThrough {
              constructor(e) {
                super(), (this._parent = e), (this.destroyed = !1);
              }
              destroy(e) {
                this.destroyed ||
                  ((this.destroyed = !0),
                  this._parent.destroy(e),
                  e && this.emit("error", e),
                  this.emit("close"));
              }
            }
            t.exports = d;
          }.call(this, e("_process"), e("buffer").Buffer));
        },
        {
          _process: 61,
          buffer: 26,
          "mp4-box-encoding": 49,
          "readable-stream": 85
        }
      ],
      52: [
        function(e, t, n) {
          const r = e("./decode"),
            o = e("./encode");
          (n.decode = e => new r(e)), (n.encode = e => new o(e));
        },
        { "./decode": 50, "./encode": 51 }
      ],
      53: [
        function(e, n) {
          var s = Math.round;
          function r(e) {
            if (((e += ""), !(100 < e.length))) {
              var t = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
                e
              );
              if (t) {
                var r = parseFloat(t[1]),
                  n = (t[2] || "ms").toLowerCase();
                return "years" === n ||
                  "year" === n ||
                  "yrs" === n ||
                  "yr" === n ||
                  "y" === n
                  ? 31557600000 * r
                  : "weeks" === n || "week" === n || "w" === n
                  ? 604800000 * r
                  : "days" === n || "day" === n || "d" === n
                  ? 86400000 * r
                  : "hours" === n ||
                    "hour" === n ||
                    "hrs" === n ||
                    "hr" === n ||
                    "h" === n
                  ? 3600000 * r
                  : "minutes" === n ||
                    "minute" === n ||
                    "mins" === n ||
                    "min" === n ||
                    "m" === n
                  ? 60000 * r
                  : "seconds" === n ||
                    "second" === n ||
                    "secs" === n ||
                    "sec" === n ||
                    "s" === n
                  ? 1000 * r
                  : "milliseconds" === n ||
                    "millisecond" === n ||
                    "msecs" === n ||
                    "msec" === n ||
                    "ms" === n
                  ? r
                  : void 0;
              }
            }
          }
          function o(e) {
            var n = t(e);
            return 86400000 <= n
              ? s(e / 86400000) + "d"
              : 3600000 <= n
              ? s(e / 3600000) + "h"
              : 60000 <= n
              ? s(e / 60000) + "m"
              : 1000 <= n
              ? s(e / 1000) + "s"
              : e + "ms";
          }
          function i(e) {
            var n = t(e);
            return 86400000 <= n
              ? a(e, n, 86400000, "day")
              : 3600000 <= n
              ? a(e, n, 3600000, "hour")
              : 60000 <= n
              ? a(e, n, 60000, "minute")
              : 1000 <= n
              ? a(e, n, 1000, "second")
              : e + " ms";
          }
          function a(e, t, r, n) {
            return s(e / r) + " " + n + (t >= 1.5 * r ? "s" : "");
          }
          var l = 24 * (60 * 60000);
          n.exports = function(e, t) {
            t = t || {};
            var n = typeof e;
            if ("string" == n && 0 < e.length) return r(e);
            if ("number" === n && isFinite(e)) return t.long ? i(e) : o(e);
            throw new Error(
              "val is not a non-empty string or a valid number. val=" +
                JSON.stringify(e)
            );
          };
        },
        {}
      ],
      54: [
        function(e, t) {
          function n(e) {
            return o(e, { objectMode: !0, highWaterMark: 16 });
          }
          function r(e) {
            return o(e);
          }
          function o(e, t) {
            if (!e || "function" == typeof e || e._readableState) return e;
            var n = new i.Readable(t).wrap(e);
            return e.destroy && (n.destroy = e.destroy.bind(e)), n;
          }
          var i = e("readable-stream");
          class a extends i.Readable {
            constructor(e, t) {
              super(t),
                (this.destroyed = !1),
                (this._drained = !1),
                (this._forwarding = !1),
                (this._current = null),
                (this._toStreams2 = t && t.objectMode ? n : r),
                "function" == typeof e
                  ? (this._queue = e)
                  : ((this._queue = e.map(this._toStreams2)),
                    this._queue.forEach(e => {
                      "function" != typeof e && this._attachErrorListener(e);
                    })),
                this._next();
            }
            _read() {
              (this._drained = !0), this._forward();
            }
            _forward() {
              if (!this._forwarding && this._drained && this._current) {
                this._forwarding = !0;
                for (
                  var e;
                  null !== (e = this._current.read()) && this._drained;

                )
                  this._drained = this.push(e);
                this._forwarding = !1;
              }
            }
            destroy(e) {
              this.destroyed ||
                ((this.destroyed = !0),
                this._current &&
                  this._current.destroy &&
                  this._current.destroy(),
                "function" != typeof this._queue &&
                  this._queue.forEach(e => {
                    e.destroy && e.destroy();
                  }),
                e && this.emit("error", e),
                this.emit("close"));
            }
            _next() {
              if (((this._current = null), "function" == typeof this._queue))
                this._queue((e, t) =>
                  e
                    ? this.destroy(e)
                    : void ((t = this._toStreams2(t)),
                      this._attachErrorListener(t),
                      this._gotNextStream(t))
                );
              else {
                var e = this._queue.shift();
                "function" == typeof e &&
                  ((e = this._toStreams2(e())), this._attachErrorListener(e)),
                  this._gotNextStream(e);
              }
            }
            _gotNextStream(e) {
              if (!e) return this.push(null), void this.destroy();
              (this._current = e), this._forward();
              const t = () => {
                  this._forward();
                },
                n = () => {
                  e._readableState.ended || this.destroy();
                },
                r = () => {
                  (this._current = null),
                    e.removeListener("readable", t),
                    e.removeListener("end", r),
                    e.removeListener("close", n),
                    this._next();
                };
              e.on("readable", t), e.once("end", r), e.once("close", n);
            }
            _attachErrorListener(e) {
              if (!e) return;
              const t = n => {
                e.removeListener("error", t), this.destroy(n);
              };
              e.once("error", t);
            }
          }
          (a.obj = e => new a(e, { objectMode: !0, highWaterMark: 16 })),
            (t.exports = a);
        },
        { "readable-stream": 85 }
      ],
      55: [
        function(e, t) {
          t.exports = function(e, t) {
            var n = null;
            return (
              e.on(t, function(e) {
                if (n) {
                  var t = n;
                  (n = null), t(e);
                }
              }),
              function(e) {
                n = e;
              }
            );
          };
        },
        {}
      ],
      56: [
        function(e, t) {
          function n(e) {
            var t = function() {
              return t.called
                ? t.value
                : ((t.called = !0), (t.value = e.apply(this, arguments)));
            };
            return (t.called = !1), t;
          }
          function r(e) {
            var t = function() {
                if (t.called) throw new Error(t.onceError);
                return (t.called = !0), (t.value = e.apply(this, arguments));
              },
              n = e.name || "Function wrapped with `once`";
            return (
              (t.onceError = n + " shouldn't be called more than once"),
              (t.called = !1),
              t
            );
          }
          var o = e("wrappy");
          (t.exports = o(n)),
            (t.exports.strict = o(r)),
            (n.proto = n(function() {
              Object.defineProperty(Function.prototype, "once", {
                value: function() {
                  return n(this);
                },
                configurable: !0
              }),
                Object.defineProperty(Function.prototype, "onceStrict", {
                  value: function() {
                    return r(this);
                  },
                  configurable: !0
                });
            }));
        },
        { wrappy: 122 }
      ],
      57: [
        function(e, t) {
          function n(e) {
            if (/^-?\d+$/.test(e)) return parseInt(e, 10);
            var t;
            if (
              (t = e.match(/^(-?\d+)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d+)$/))
            ) {
              var n = t[1],
                r = t[2],
                o = t[3];
              if (n && o) {
                (n = parseInt(n)), (o = parseInt(o));
                var a = [],
                  d = n < o ? 1 : -1;
                ("-" == r || ".." == r || "\u2025" == r) && (o += d);
                for (var s = n; s != o; s += d) a.push(s);
                return a;
              }
            }
            return [];
          }
          t.exports.parse = function(e) {
            var t = e.split(","),
              r = t.map(function(e) {
                return n(e);
              });
            return 0 === r.length
              ? []
              : 1 === r.length
              ? Array.isArray(r[0])
                ? r[0]
                : r
              : r.reduce(function(e, t) {
                  return (
                    Array.isArray(e) || (e = [e]),
                    Array.isArray(t) || (t = [t]),
                    e.concat(t)
                  );
                });
          };
        },
        {}
      ],
      58: [
        function(e, t) {
          (function(n, r) {
            function o(e) {
              if ("string" == typeof e && /^(stream-)?magnet:/.test(e))
                return h(e);
              if (
                "string" == typeof e &&
                (/^[a-f0-9]{40}$/i.test(e) || /^[a-z2-7]{32}$/i.test(e))
              )
                return h(`magnet:?xt=urn:btih:${e}`);
              if (r.isBuffer(e) && 20 === e.length)
                return h(`magnet:?xt=urn:btih:${e.toString("hex")}`);
              if (r.isBuffer(e)) return i(e);
              if (e && e.infoHash)
                return (
                  (e.infoHash = e.infoHash.toLowerCase()),
                  e.announce || (e.announce = []),
                  "string" == typeof e.announce && (e.announce = [e.announce]),
                  e.urlList || (e.urlList = []),
                  e
                );
              throw new Error("Invalid torrent identifier");
            }
            function i(e) {
              r.isBuffer(e) && (e = c.decode(e)),
                l(e.info, "info"),
                l(e.info["name.utf-8"] || e.info.name, "info.name"),
                l(e.info["piece length"], "info['piece length']"),
                l(e.info.pieces, "info.pieces"),
                e.info.files
                  ? e.info.files.forEach(e => {
                      l("number" == typeof e.length, "info.files[0].length"),
                        l(e["path.utf-8"] || e.path, "info.files[0].path");
                    })
                  : l("number" == typeof e.info.length, "info.length");
              const t = {
                info: e.info,
                infoBuffer: c.encode(e.info),
                name: (e.info["name.utf-8"] || e.info.name).toString(),
                announce: []
              };
              (t.infoHash = g.sync(t.infoBuffer)),
                (t.infoHashBuffer = r.from(t.infoHash, "hex")),
                void 0 !== e.info.private && (t.private = !!e.info.private),
                e["creation date"] &&
                  (t.created = new Date(1e3 * e["creation date"])),
                e["created by"] && (t.createdBy = e["created by"].toString()),
                r.isBuffer(e.comment) && (t.comment = e.comment.toString()),
                Array.isArray(e["announce-list"]) &&
                0 < e["announce-list"].length
                  ? e["announce-list"].forEach(e => {
                      e.forEach(e => {
                        t.announce.push(e.toString());
                      });
                    })
                  : e.announce && t.announce.push(e.announce.toString()),
                r.isBuffer(e["url-list"]) &&
                  (e["url-list"] =
                    0 < e["url-list"].length ? [e["url-list"]] : []),
                (t.urlList = (e["url-list"] || []).map(e => e.toString())),
                _(t.announce),
                _(t.urlList);
              const n = e.info.files || [e.info];
              (t.files = n.map((e, r) => {
                const o = []
                  .concat(t.name, e["path.utf-8"] || e.path || [])
                  .map(e => e.toString());
                return {
                  path: m.join.apply(null, [m.sep].concat(o)).slice(1),
                  name: o[o.length - 1],
                  length: e.length,
                  offset: n.slice(0, r).reduce(d, 0)
                };
              })),
                (t.length = n.reduce(d, 0));
              const o = t.files[t.files.length - 1];
              return (
                (t.pieceLength = e.info["piece length"]),
                (t.lastPieceLength =
                  (o.offset + o.length) % t.pieceLength || t.pieceLength),
                (t.pieces = s(e.info.pieces)),
                t
              );
            }
            function a(e) {
              return "undefined" != typeof Blob && e instanceof Blob;
            }
            function d(e, t) {
              return e + t.length;
            }
            function s(e) {
              const t = [];
              for (let n = 0; n < e.length; n += 20)
                t.push(e.slice(n, n + 20).toString("hex"));
              return t;
            }
            function l(e, t) {
              if (!e)
                throw new Error(`Torrent is missing required field: ${t}`);
            }
            const c = e("bencode"),
              u = e("blob-to-buffer"),
              f = e("fs"),
              p = e("simple-get"),
              h = e("magnet-uri"),
              m = e("path"),
              g = e("simple-sha1"),
              _ = e("uniq");
            (t.exports = o),
              (t.exports.remote = function(e, t) {
                function r(e) {
                  try {
                    i = o(e);
                  } catch (e) {
                    return t(e);
                  }
                  i && i.infoHash
                    ? t(null, i)
                    : t(new Error("Invalid torrent identifier"));
                }
                let i;
                if ("function" != typeof t)
                  throw new Error("second argument must be a Function");
                try {
                  i = o(e);
                } catch (e) {}
                i && i.infoHash
                  ? n.nextTick(() => {
                      t(null, i);
                    })
                  : a(e)
                  ? u(e, (e, n) =>
                      e
                        ? t(new Error(`Error converting Blob: ${e.message}`))
                        : void r(n)
                    )
                  : "function" == typeof p && /^https?:/.test(e)
                  ? p.concat(
                      {
                        url: e,
                        timeout: 30000,
                        headers: {
                          "user-agent": "WebTorrent (https://webtorrent.io)"
                        }
                      },
                      (e, n, o) =>
                        e
                          ? t(
                              new Error(
                                `Error downloading torrent: ${e.message}`
                              )
                            )
                          : void r(o)
                    )
                  : "function" == typeof f.readFile && "string" == typeof e
                  ? f.readFile(e, (e, n) =>
                      e ? t(new Error("Invalid torrent identifier")) : void r(n)
                    )
                  : n.nextTick(() => {
                      t(new Error("Invalid torrent identifier"));
                    });
              }),
              (t.exports.toMagnetURI = h.encode),
              (t.exports.toTorrentFile = function(e) {
                const t = { info: e.info };
                return (
                  (t["announce-list"] = (e.announce || []).map(
                    e => (
                      t.announce || (t.announce = e),
                      (e = r.from(e, "utf8")),
                      [e]
                    )
                  )),
                  (t["url-list"] = e.urlList || []),
                  void 0 !== e.private && (t.private = +e.private),
                  e.created &&
                    (t["creation date"] = 0 | (e.created.getTime() / 1e3)),
                  e.createdBy && (t["created by"] = e.createdBy),
                  e.comment && (t.comment = e.comment),
                  c.encode(t)
                );
              });
            (() => {
              r.alloc(0);
            })();
          }.call(this, e("_process"), e("buffer").Buffer));
        },
        {
          _process: 61,
          bencode: 11,
          "blob-to-buffer": 19,
          buffer: 26,
          fs: 22,
          "magnet-uri": 44,
          path: 59,
          "simple-get": 93,
          "simple-sha1": 95,
          uniq: 114
        }
      ],
      59: [
        function(e, t, n) {
          (function(e) {
            function t(e, t) {
              for (var n = 0, r = e.length - 1, o; 0 <= r; r--)
                (o = e[r]),
                  "." === o
                    ? e.splice(r, 1)
                    : ".." === o
                    ? (e.splice(r, 1), n++)
                    : n && (e.splice(r, 1), n--);
              if (t) for (; n--; n) e.unshift("..");
              return e;
            }
            function r(e) {
              "string" != typeof e && (e += "");
              var t = 0,
                n = -1,
                r = !0,
                o;
              for (o = e.length - 1; 0 <= o; --o)
                if (!(47 === e.charCodeAt(o)))
                  -1 === n && ((r = !1), (n = o + 1));
                else if (!r) {
                  t = o + 1;
                  break;
                }
              return -1 === n ? "" : e.slice(t, n);
            }
            function o(e, t) {
              if (e.filter) return e.filter(t);
              for (var n = [], r = 0; r < e.length; r++)
                t(e[r], r, e) && n.push(e[r]);
              return n;
            }
            (n.resolve = function() {
              for (
                var n = "", r = !1, a = arguments.length - 1, d;
                -1 <= a && !r;
                a--
              ) {
                if (
                  ((d = 0 <= a ? arguments[a] : e.cwd()), "string" != typeof d)
                )
                  throw new TypeError(
                    "Arguments to path.resolve must be strings"
                  );
                else if (!d) continue;
                (n = d + "/" + n), (r = "/" === d.charAt(0));
              }
              return (
                (n = t(
                  o(n.split("/"), function(e) {
                    return !!e;
                  }),
                  !r
                ).join("/")),
                (r ? "/" : "") + n || "."
              );
            }),
              (n.normalize = function(e) {
                var r = n.isAbsolute(e),
                  a = "/" === i(e, -1);
                return (
                  (e = t(
                    o(e.split("/"), function(e) {
                      return !!e;
                    }),
                    !r
                  ).join("/")),
                  e || r || (e = "."),
                  e && a && (e += "/"),
                  (r ? "/" : "") + e
                );
              }),
              (n.isAbsolute = function(e) {
                return "/" === e.charAt(0);
              }),
              (n.join = function() {
                var e = Array.prototype.slice.call(arguments, 0);
                return n.normalize(
                  o(e, function(e) {
                    if ("string" != typeof e)
                      throw new TypeError(
                        "Arguments to path.join must be strings"
                      );
                    return e;
                  }).join("/")
                );
              }),
              (n.relative = function(e, t) {
                function r(e) {
                  for (var t = 0; t < e.length && "" === e[t]; t++);
                  for (var n = e.length - 1; 0 <= n && "" === e[n]; n--);
                  return t > n ? [] : e.slice(t, n - t + 1);
                }
                (e = n.resolve(e).substr(1)), (t = n.resolve(t).substr(1));
                for (
                  var o = r(e.split("/")),
                    a = r(t.split("/")),
                    d = s(o.length, a.length),
                    l = d,
                    c = 0;
                  c < d;
                  c++
                )
                  if (o[c] !== a[c]) {
                    l = c;
                    break;
                  }
                for (var u = [], c = l; c < o.length; c++) u.push("..");
                return (u = u.concat(a.slice(l))), u.join("/");
              }),
              (n.sep = "/"),
              (n.delimiter = ":"),
              (n.dirname = function(e) {
                if (("string" != typeof e && (e += ""), 0 === e.length))
                  return ".";
                for (
                  var t = e.charCodeAt(0),
                    n = 47 === t,
                    r = -1,
                    o = !0,
                    a = e.length - 1;
                  1 <= a;
                  --a
                )
                  if (((t = e.charCodeAt(a)), 47 !== t)) o = !1;
                  else if (!o) {
                    r = a;
                    break;
                  }
                return -1 === r
                  ? n
                    ? "/"
                    : "."
                  : n && 1 === r
                  ? "/"
                  : e.slice(0, r);
              }),
              (n.basename = function(e, t) {
                var n = r(e);
                return (
                  t &&
                    n.substr(-1 * t.length) === t &&
                    (n = n.substr(0, n.length - t.length)),
                  n
                );
              }),
              (n.extname = function(e) {
                "string" != typeof e && (e += "");
                for (
                  var t = -1, n = 0, r = -1, o = !0, a = 0, d = e.length - 1, s;
                  0 <= d;
                  --d
                ) {
                  if (((s = e.charCodeAt(d)), 47 === s)) {
                    if (!o) {
                      n = d + 1;
                      break;
                    }
                    continue;
                  }
                  -1 === r && ((o = !1), (r = d + 1)),
                    46 === s
                      ? -1 === t
                        ? (t = d)
                        : 1 !== a && (a = 1)
                      : -1 !== t && (a = -1);
                }
                return -1 === t ||
                  -1 === r ||
                  0 === a ||
                  (1 === a && t === r - 1 && t === n + 1)
                  ? ""
                  : e.slice(t, r);
              });
            var i = function(e, t, n) {
              return e.substr(t, n);
            };
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      60: [
        function(e, t) {
          t.exports = function(e) {
            return d(
              16384,
              0 | (1 << (Math.log2(1024 > e ? 1 : e / 1024) + 0.5))
            );
          };
        },
        {}
      ],
      61: [
        function(e, t) {
          function n() {
            throw new Error("setTimeout has not been defined");
          }
          function r() {
            throw new Error("clearTimeout has not been defined");
          }
          function o(t) {
            if (u === setTimeout) return setTimeout(t, 0);
            if ((u === n || !u) && setTimeout)
              return (u = setTimeout), setTimeout(t, 0);
            try {
              return u(t, 0);
            } catch (n) {
              try {
                return u.call(null, t, 0);
              } catch (n) {
                return u.call(this, t, 0);
              }
            }
          }
          function i(t) {
            if (f === clearTimeout) return clearTimeout(t);
            if ((f === r || !f) && clearTimeout)
              return (f = clearTimeout), clearTimeout(t);
            try {
              return f(t);
            } catch (n) {
              try {
                return f.call(null, t);
              } catch (n) {
                return f.call(this, t);
              }
            }
          }
          function a() {
            h &&
              g &&
              ((h = !1),
              g.length ? (p = g.concat(p)) : (m = -1),
              p.length && d());
          }
          function d() {
            if (!h) {
              var e = o(a);
              h = !0;
              for (var t = p.length; t; ) {
                for (g = p, p = []; ++m < t; ) g && g[m].run();
                (m = -1), (t = p.length);
              }
              (g = null), (h = !1), i(e);
            }
          }
          function s(e, t) {
            (this.fun = e), (this.array = t);
          }
          function l() {}
          var c = (t.exports = {}),
            u,
            f;
          (function() {
            try {
              u = "function" == typeof setTimeout ? setTimeout : n;
            } catch (t) {
              u = n;
            }
            try {
              f = "function" == typeof clearTimeout ? clearTimeout : r;
            } catch (t) {
              f = r;
            }
          })();
          var p = [],
            h = !1,
            m = -1,
            g;
          (c.nextTick = function(e) {
            var t = Array(arguments.length - 1);
            if (1 < arguments.length)
              for (var n = 1; n < arguments.length; n++)
                t[n - 1] = arguments[n];
            p.push(new s(e, t)), 1 !== p.length || h || o(d);
          }),
            (s.prototype.run = function() {
              this.fun.apply(null, this.array);
            }),
            (c.title = "browser"),
            (c.browser = !0),
            (c.env = {}),
            (c.argv = []),
            (c.version = ""),
            (c.versions = {}),
            (c.on = l),
            (c.addListener = l),
            (c.once = l),
            (c.off = l),
            (c.removeListener = l),
            (c.removeAllListeners = l),
            (c.emit = l),
            (c.prependListener = l),
            (c.prependOnceListener = l),
            (c.listeners = function() {
              return [];
            }),
            (c.binding = function() {
              throw new Error("process.binding is not supported");
            }),
            (c.cwd = function() {
              return "/";
            }),
            (c.chdir = function() {
              throw new Error("process.chdir is not supported");
            }),
            (c.umask = function() {
              return 0;
            });
        },
        {}
      ],
      62: [
        function(e, t) {
          (function(n) {
            var r = e("once"),
              o = e("end-of-stream"),
              i = e("fs"),
              a = function() {},
              d = /^v?\.0/.test(n.version),
              s = function(e) {
                return "function" == typeof e;
              },
              l = function(e) {
                return (
                  !!d &&
                  !!i &&
                  (e instanceof (i.ReadStream || a) ||
                    e instanceof (i.WriteStream || a)) &&
                  s(e.close)
                );
              },
              c = function(e) {
                return e.setHeader && s(e.abort);
              },
              u = function(e, t, n, i) {
                i = r(i);
                var d = !1;
                e.on("close", function() {
                  d = !0;
                }),
                  o(e, { readable: t, writable: n }, function(e) {
                    return e ? i(e) : void ((d = !0), i());
                  });
                var u = !1;
                return function(t) {
                  if (!d)
                    return u
                      ? void 0
                      : ((u = !0),
                        l(e)
                          ? e.close(a)
                          : c(e)
                          ? e.abort()
                          : s(e.destroy)
                          ? e.destroy()
                          : void i(t || new Error("stream was destroyed")));
                };
              },
              f = function(e) {
                e();
              },
              p = function(e, t) {
                return e.pipe(t);
              };
            t.exports = function() {
              var e = Array.prototype.slice.call(arguments),
                t = (s(e[e.length - 1] || a) && e.pop()) || a;
              if ((Array.isArray(e[0]) && (e = e[0]), 2 > e.length))
                throw new Error("pump requires two streams per minimum");
              var n = e.map(function(o, a) {
                  var i = a < e.length - 1;
                  return u(o, i, 0 < a, function(e) {
                    r || (r = e), e && n.forEach(f), i || (n.forEach(f), t(r));
                  });
                }),
                r;
              return e.reduce(p);
            };
          }.call(this, e("_process")));
        },
        { _process: 61, "end-of-stream": 32, fs: 21, once: 56 }
      ],
      63: [
        function(e, t, n) {
          (function(e) {
            /*! https://mths.be/punycode v1.4.1 by @mathias */ (function(i) {
              function a(e) {
                throw new RangeError(x[e]);
              }
              function d(e, t) {
                for (var n = e.length, r = []; n--; ) r[n] = t(e[n]);
                return r;
              }
              function s(e, t) {
                var n = e.split("@"),
                  r = "";
                1 < n.length && ((r = n[0] + "@"), (e = n[1])),
                  (e = e.replace(E, "."));
                var o = e.split("."),
                  i = d(o, t).join(".");
                return r + i;
              }
              function c(e) {
                for (var t = [], n = 0, r = e.length, o, i; n < r; )
                  (o = e.charCodeAt(n++)),
                    55296 <= o && 56319 >= o && n < r
                      ? ((i = e.charCodeAt(n++)),
                        56320 == (64512 & i)
                          ? t.push(((1023 & o) << 10) + (1023 & i) + 65536)
                          : (t.push(o), n--))
                      : t.push(o);
                return t;
              }
              function u(e) {
                return d(e, function(e) {
                  var t = "";
                  return (
                    65535 < e &&
                      ((e -= 65536),
                      (t += S(55296 | (1023 & (e >>> 10)))),
                      (e = 56320 | (1023 & e))),
                    (t += S(e)),
                    t
                  );
                }).join("");
              }
              function f(e) {
                return 10 > e - 48
                  ? e - 22
                  : 26 > e - 65
                  ? e - 65
                  : 26 > e - 97
                  ? e - 97
                  : 36;
              }
              function p(e, t) {
                return e + 22 + 75 * (26 > e) - ((0 != t) << 5);
              }
              function h(e, t, n) {
                var r = 0;
                for (
                  e = n ? v(e / 700) : e >> 1, e += v(e / t);
                  455 < e;
                  r += 36
                )
                  e = v(e / 35);
                return v(r + (36 * e) / (e + 38));
              }
              function m(e) {
                var r = [],
                  o = e.length,
                  d = 0,
                  s = 128,
                  l = 72,
                  c,
                  p,
                  m,
                  g,
                  _,
                  b,
                  y,
                  E,
                  x,
                  S;
                for (
                  p = e.lastIndexOf("-"), 0 > p && (p = 0), m = 0;
                  m < p;
                  ++m
                )
                  128 <= e.charCodeAt(m) && a("not-basic"),
                    r.push(e.charCodeAt(m));
                for (g = 0 < p ? p + 1 : 0; g < o; ) {
                  for (_ = d, b = 1, y = 36; ; y += 36) {
                    if (
                      (g >= o && a("invalid-input"),
                      (E = f(e.charCodeAt(g++))),
                      (36 <= E || E > v((2147483647 - d) / b)) && a("overflow"),
                      (d += E * b),
                      (x = y <= l ? 1 : y >= l + 26 ? 26 : y - l),
                      E < x)
                    )
                      break;
                    (S = 36 - x),
                      b > v(2147483647 / S) && a("overflow"),
                      (b *= S);
                  }
                  (c = r.length + 1),
                    (l = h(d - _, c, 0 == _)),
                    v(d / c) > 2147483647 - s && a("overflow"),
                    (s += v(d / c)),
                    (d %= c),
                    r.splice(d++, 0, s);
                }
                return u(r);
              }
              function g(e) {
                var r = [],
                  o,
                  i,
                  d,
                  s,
                  l,
                  u,
                  f,
                  g,
                  _,
                  b,
                  y,
                  w,
                  E,
                  x,
                  C;
                for (
                  e = c(e), w = e.length, o = 128, i = 0, l = 72, u = 0;
                  u < w;
                  ++u
                )
                  (y = e[u]), 128 > y && r.push(S(y));
                for (d = s = r.length, s && r.push("-"); d < w; ) {
                  for (f = 2147483647, u = 0; u < w; ++u)
                    (y = e[u]), y >= o && y < f && (f = y);
                  for (
                    E = d + 1,
                      f - o > v((2147483647 - i) / E) && a("overflow"),
                      i += (f - o) * E,
                      o = f,
                      u = 0;
                    u < w;
                    ++u
                  )
                    if (
                      ((y = e[u]),
                      y < o && 2147483647 < ++i && a("overflow"),
                      y == o)
                    ) {
                      for (g = i, _ = 36; ; _ += 36) {
                        if (
                          ((b = _ <= l ? 1 : _ >= l + 26 ? 26 : _ - l), g < b)
                        )
                          break;
                        (C = g - b),
                          (x = 36 - b),
                          r.push(S(p(b + (C % x), 0))),
                          (g = v(C / x));
                      }
                      r.push(S(p(g, 0))), (l = h(i, E, d == s)), (i = 0), ++d;
                    }
                  ++i, ++o;
                }
                return r.join("");
              }
              var _ = "object" == typeof n && n && !n.nodeType && n,
                b = "object" == typeof t && t && !t.nodeType && t,
                y = "object" == typeof e && e;
              (y.global === y || y.window === y || y.self === y) && (i = y);
              var w = /^xn--/,
                k = /[^\x20-\x7E]/,
                E = /[\x2E\u3002\uFF0E\uFF61]/g,
                x = {
                  overflow: "Overflow: input needs wider integers to process",
                  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
                  "invalid-input": "Invalid input"
                },
                v = r,
                S = o,
                C,
                I;
              if (
                ((C = {
                  version: "1.4.1",
                  ucs2: { decode: c, encode: u },
                  decode: m,
                  encode: g,
                  toASCII: function(e) {
                    return s(e, function(e) {
                      return k.test(e) ? "xn--" + g(e) : e;
                    });
                  },
                  toUnicode: function(e) {
                    return s(e, function(e) {
                      return w.test(e) ? m(e.slice(4).toLowerCase()) : e;
                    });
                  }
                }),
                "function" == typeof l && "object" == typeof l.amd && l.amd)
              )
                l("punycode", function() {
                  return C;
                });
              else if (!(_ && b)) i.punycode = C;
              else if (t.exports == _) b.exports = C;
              else for (I in C) C.hasOwnProperty(I) && (_[I] = C[I]);
            })(this);
          }.call(
            this,
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {}
      ],
      64: [
        function(e, t) {
          "use strict";
          function n(e, t) {
            return Object.prototype.hasOwnProperty.call(e, t);
          }
          t.exports = function(e, t, o, a) {
            (t = t || "&"), (o = o || "=");
            var d = {};
            if ("string" != typeof e || 0 === e.length) return d;
            var s = /\+/g;
            e = e.split(t);
            var l = 1e3;
            a && "number" == typeof a.maxKeys && (l = a.maxKeys);
            var c = e.length;
            0 < l && c > l && (c = l);
            for (var u = 0; u < c; ++u) {
              var f = e[u].replace(s, "%20"),
                p = f.indexOf(o),
                h,
                m,
                g,
                _;
              0 <= p
                ? ((h = f.substr(0, p)), (m = f.substr(p + 1)))
                : ((h = f), (m = "")),
                (g = decodeURIComponent(h)),
                (_ = decodeURIComponent(m)),
                n(d, g)
                  ? r(d[g])
                    ? d[g].push(_)
                    : (d[g] = [d[g], _])
                  : (d[g] = _);
            }
            return d;
          };
          var r =
            Array.isArray ||
            function(e) {
              return "[object Array]" === Object.prototype.toString.call(e);
            };
        },
        {}
      ],
      65: [
        function(e, t) {
          "use strict";
          function n(e, t) {
            if (e.map) return e.map(t);
            for (var n = [], r = 0; r < e.length; r++) n.push(t(e[r], r));
            return n;
          }
          var r = function(e) {
            switch (typeof e) {
              case "string":
                return e;
              case "boolean":
                return e ? "true" : "false";
              case "number":
                return isFinite(e) ? e : "";
              default:
                return "";
            }
          };
          t.exports = function(e, t, a, d) {
            return (
              (t = t || "&"),
              (a = a || "="),
              null === e && (e = void 0),
              "object" == typeof e
                ? n(i(e), function(i) {
                    var d = encodeURIComponent(r(i)) + a;
                    return o(e[i])
                      ? n(e[i], function(e) {
                          return d + encodeURIComponent(r(e));
                        }).join(t)
                      : d + encodeURIComponent(r(e[i]));
                  }).join(t)
                : d
                ? encodeURIComponent(r(d)) + a + encodeURIComponent(r(e))
                : ""
            );
          };
          var o =
              Array.isArray ||
              function(e) {
                return "[object Array]" === Object.prototype.toString.call(e);
              },
            i =
              Object.keys ||
              function(e) {
                var t = [];
                for (var n in e)
                  Object.prototype.hasOwnProperty.call(e, n) && t.push(n);
                return t;
              };
        },
        {}
      ],
      66: [
        function(e, t, n) {
          "use strict";
          (n.decode = n.parse = e("./decode")),
            (n.encode = n.stringify = e("./encode"));
        },
        { "./decode": 64, "./encode": 65 }
      ],
      67: [
        function(e, t) {
          let n;
          t.exports =
            "function" == typeof queueMicrotask
              ? queueMicrotask
              : e =>
                  (n || (n = Promise.resolve())).then(e).catch(e =>
                    setTimeout(() => {
                      throw e;
                    }, 0)
                  );
        },
        {}
      ],
      68: [
        function(e, t) {
          t.exports = function(e) {
            var t = 0;
            return function() {
              if (t === e.length) return null;
              var n = e.length - t,
                r = 0 | (Math.random() * n),
                o = e[t + r],
                i = e[t];
              return (e[t] = o), (e[t + r] = i), t++, o;
            };
          };
        },
        {}
      ],
      69: [
        function(e, t) {
          (function(n, r) {
            "use strict";
            var o = e("safe-buffer").Buffer,
              i = r.crypto || r.msCrypto;
            t.exports =
              i && i.getRandomValues
                ? function(e, t) {
                    if (e > 4294967295)
                      throw new RangeError("requested too many random bytes");
                    var r = o.allocUnsafe(e);
                    if (0 < e)
                      if (65536 < e)
                        for (var a = 0; a < e; a += 65536)
                          i.getRandomValues(r.slice(a, a + 65536));
                      else i.getRandomValues(r);
                    return "function" == typeof t
                      ? n.nextTick(function() {
                          t(null, r);
                        })
                      : r;
                  }
                : function() {
                    throw new Error(
                      "Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11"
                    );
                  };
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        { _process: 61, "safe-buffer": 91 }
      ],
      70: [
        function(e, t) {
          const { Writable: n, PassThrough: r } = e("readable-stream");
          t.exports = class extends n {
            constructor(e, t = {}) {
              super(t),
                (this.destroyed = !1),
                (this._queue = []),
                (this._position = e || 0),
                (this._cb = null),
                (this._buffer = null),
                (this._out = null);
            }
            _write(e, t, n) {
              let r = !0;
              for (;;) {
                if (this.destroyed) return;
                if (0 === this._queue.length)
                  return (this._buffer = e), void (this._cb = n);
                this._buffer = null;
                var o = this._queue[0];
                const t = d(o.start - this._position, 0),
                  i = o.end - this._position;
                if (t >= e.length) return (this._position += e.length), n(null);
                let a;
                if (i > e.length) {
                  (this._position += e.length),
                    (a = 0 === t ? e : e.slice(t)),
                    (r = o.stream.write(a) && r);
                  break;
                }
                (this._position += i),
                  (a = 0 === t && i === e.length ? e : e.slice(t, i)),
                  (r = o.stream.write(a) && r),
                  o.last && o.stream.end(),
                  (e = e.slice(i)),
                  this._queue.shift();
              }
              r ? n(null) : o.stream.once("drain", n.bind(null, null));
            }
            slice(e) {
              if (this.destroyed) return null;
              Array.isArray(e) || (e = [e]);
              const t = new r();
              return (
                e.forEach((n, r) => {
                  this._queue.push({
                    start: n.start,
                    end: n.end,
                    stream: t,
                    last: r === e.length - 1
                  });
                }),
                this._buffer && this._write(this._buffer, null, this._cb),
                t
              );
            }
            destroy(e) {
              this.destroyed ||
                ((this.destroyed = !0), e && this.emit("error", e));
            }
          };
        },
        { "readable-stream": 85 }
      ],
      71: [
        function(e, t) {
          "use strict";
          function n(e, t) {
            (e.prototype = Object.create(t.prototype)),
              (e.prototype.constructor = e),
              (e.__proto__ = t);
          }
          function r(e, t, r) {
            function o(e, n, r) {
              return "string" == typeof t ? t : t(e, n, r);
            }
            r || (r = Error);
            var i = (function(e) {
              function t(t, n, r) {
                return e.call(this, o(t, n, r)) || this;
              }
              return n(t, e), t;
            })(r);
            (i.prototype.name = r.name), (i.prototype.code = e), (s[e] = i);
          }
          function o(e, t) {
            if (Array.isArray(e)) {
              var n = e.length;
              return (
                (e = e.map(function(e) {
                  return e + "";
                })),
                2 < n
                  ? "one of "
                      .concat(t, " ")
                      .concat(e.slice(0, n - 1).join(", "), ", or ") + e[n - 1]
                  : 2 === n
                  ? "one of "
                      .concat(t, " ")
                      .concat(e[0], " or ")
                      .concat(e[1])
                  : "of ".concat(t, " ").concat(e[0])
              );
            }
            return "of ".concat(t, " ").concat(e + "");
          }
          function i(e, t, n) {
            return e.substr(!n || 0 > n ? 0 : +n, t.length) === t;
          }
          function a(e, t, n) {
            return (
              (void 0 === n || n > e.length) && (n = e.length),
              e.substring(n - t.length, n) === t
            );
          }
          function d(e, t, n) {
            return (
              "number" != typeof n && (n = 0),
              !(n + t.length > e.length) && -1 !== e.indexOf(t, n)
            );
          }
          var s = {};
          r(
            "ERR_INVALID_OPT_VALUE",
            function(e, t) {
              return 'The value "' + t + '" is invalid for option "' + e + '"';
            },
            TypeError
          ),
            r(
              "ERR_INVALID_ARG_TYPE",
              function(e, t, n) {
                var r;
                "string" == typeof t && i(t, "not ")
                  ? ((r = "must not be"), (t = t.replace(/^not /, "")))
                  : (r = "must be");
                var s;
                if (a(e, " argument"))
                  s = "The "
                    .concat(e, " ")
                    .concat(r, " ")
                    .concat(o(t, "type"));
                else {
                  var l = d(e, ".") ? "property" : "argument";
                  s = 'The "'
                    .concat(e, '" ')
                    .concat(l, " ")
                    .concat(r, " ")
                    .concat(o(t, "type"));
                }
                return (s += ". Received type ".concat(typeof n)), s;
              },
              TypeError
            ),
            r("ERR_STREAM_PUSH_AFTER_EOF", "stream.push() after EOF"),
            r("ERR_METHOD_NOT_IMPLEMENTED", function(e) {
              return "The " + e + " method is not implemented";
            }),
            r("ERR_STREAM_PREMATURE_CLOSE", "Premature close"),
            r("ERR_STREAM_DESTROYED", function(e) {
              return "Cannot call " + e + " after a stream was destroyed";
            }),
            r("ERR_MULTIPLE_CALLBACK", "Callback called multiple times"),
            r("ERR_STREAM_CANNOT_PIPE", "Cannot pipe, not readable"),
            r("ERR_STREAM_WRITE_AFTER_END", "write after end"),
            r(
              "ERR_STREAM_NULL_VALUES",
              "May not write null values to stream",
              TypeError
            ),
            r(
              "ERR_UNKNOWN_ENCODING",
              function(e) {
                return "Unknown encoding: " + e;
              },
              TypeError
            ),
            r(
              "ERR_STREAM_UNSHIFT_AFTER_END_EVENT",
              "stream.unshift() after end event"
            ),
            (t.exports.codes = s);
        },
        {}
      ],
      72: [
        function(e, t) {
          (function(e) {
            "use strict";
            var n = new Set();
            t.exports.emitExperimentalWarning = e.emitWarning
              ? function(t) {
                  if (!n.has(t)) {
                    n.add(t),
                      e.emitWarning(
                        t +
                          " is an experimental feature. This feature could change at any time",
                        "ExperimentalWarning"
                      );
                  }
                }
              : function() {};
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      73: [
        function(e, t) {
          (function(n) {
            "use strict";
            function r(e) {
              return this instanceof r
                ? void (d.call(this, e),
                  s.call(this, e),
                  (this.allowHalfOpen = !0),
                  e &&
                    (!1 === e.readable && (this.readable = !1),
                    !1 === e.writable && (this.writable = !1),
                    !1 === e.allowHalfOpen &&
                      ((this.allowHalfOpen = !1), this.once("end", o))))
                : new r(e);
            }
            function o() {
              this._writableState.ended || n.nextTick(i, this);
            }
            function i(e) {
              e.end();
            }
            var a =
              Object.keys ||
              function(e) {
                var t = [];
                for (var n in e) t.push(n);
                return t;
              };
            t.exports = r;
            var d = e("./_stream_readable"),
              s = e("./_stream_writable");
            e("inherits")(r, d);
            for (var l = a(s.prototype), c = 0, u; c < l.length; c++)
              (u = l[c]), r.prototype[u] || (r.prototype[u] = s.prototype[u]);
            Object.defineProperty(r.prototype, "writableHighWaterMark", {
              enumerable: !1,
              get: function() {
                return this._writableState.highWaterMark;
              }
            }),
              Object.defineProperty(r.prototype, "writableBuffer", {
                enumerable: !1,
                get: function() {
                  return this._writableState && this._writableState.getBuffer();
                }
              }),
              Object.defineProperty(r.prototype, "writableLength", {
                enumerable: !1,
                get: function() {
                  return this._writableState.length;
                }
              }),
              Object.defineProperty(r.prototype, "destroyed", {
                enumerable: !1,
                get: function() {
                  return (
                    void 0 !== this._readableState &&
                    void 0 !== this._writableState &&
                    this._readableState.destroyed &&
                    this._writableState.destroyed
                  );
                },
                set: function(e) {
                  void 0 === this._readableState ||
                    void 0 === this._writableState ||
                    ((this._readableState.destroyed = e),
                    (this._writableState.destroyed = e));
                }
              });
          }.call(this, e("_process")));
        },
        {
          "./_stream_readable": 75,
          "./_stream_writable": 77,
          _process: 61,
          inherits: 39
        }
      ],
      74: [
        function(e, t) {
          "use strict";
          function n(e) {
            return this instanceof n ? void r.call(this, e) : new n(e);
          }
          t.exports = n;
          var r = e("./_stream_transform");
          e("inherits")(n, r),
            (n.prototype._transform = function(e, t, n) {
              n(null, e);
            });
        },
        { "./_stream_transform": 76, inherits: 39 }
      ],
      75: [
        function(e, t) {
          (function(n, r) {
            "use strict";
            function o(e) {
              return U.from(e);
            }
            function i(e) {
              return U.isBuffer(e) || e instanceof P;
            }
            function a(e, t, n) {
              return "function" == typeof e.prependListener
                ? e.prependListener(t, n)
                : void (e._events && e._events[t]
                    ? Array.isArray(e._events[t])
                      ? e._events[t].unshift(n)
                      : (e._events[t] = [n, e._events[t]])
                    : e.on(t, n));
            }
            function d(t, n, r) {
              (T = T || e("./_stream_duplex")),
                (t = t || {}),
                "boolean" != typeof r && (r = n instanceof T),
                (this.objectMode = !!t.objectMode),
                r &&
                  (this.objectMode = this.objectMode || !!t.readableObjectMode),
                (this.highWaterMark = D(this, t, "readableHighWaterMark", r)),
                (this.buffer = new M()),
                (this.length = 0),
                (this.pipes = null),
                (this.pipesCount = 0),
                (this.flowing = null),
                (this.ended = !1),
                (this.endEmitted = !1),
                (this.reading = !1),
                (this.sync = !0),
                (this.needReadable = !1),
                (this.emittedReadable = !1),
                (this.readableListening = !1),
                (this.resumeScheduled = !1),
                (this.paused = !0),
                (this.emitClose = !1 !== t.emitClose),
                (this.destroyed = !1),
                (this.defaultEncoding = t.defaultEncoding || "utf8"),
                (this.awaitDrain = 0),
                (this.readingMore = !1),
                (this.decoder = null),
                (this.encoding = null),
                t.encoding &&
                  (!Y && (Y = e("string_decoder/").StringDecoder),
                  (this.decoder = new Y(t.encoding)),
                  (this.encoding = t.encoding));
            }
            function s(t) {
              if (((T = T || e("./_stream_duplex")), !(this instanceof s)))
                return new s(t);
              var n = this instanceof T;
              (this._readableState = new d(t, this, n)),
                (this.readable = !0),
                t &&
                  ("function" == typeof t.read && (this._read = t.read),
                  "function" == typeof t.destroy &&
                    (this._destroy = t.destroy)),
                A.call(this);
            }
            function l(e, t, n, r, i) {
              N("readableAddChunk", t);
              var a = e._readableState;
              if (null === t) (a.reading = !1), h(e, a);
              else {
                var d;
                if ((i || (d = u(a, t)), d)) e.emit("error", d);
                else if (!(a.objectMode || (t && 0 < t.length)))
                  r || ((a.reading = !1), _(e, a));
                else if (
                  ("string" == typeof t ||
                    a.objectMode ||
                    Object.getPrototypeOf(t) === U.prototype ||
                    (t = o(t)),
                  r)
                )
                  a.endEmitted ? e.emit("error", new V()) : c(e, a, t, !0);
                else if (a.ended) e.emit("error", new W());
                else {
                  if (a.destroyed) return !1;
                  (a.reading = !1),
                    a.decoder && !n
                      ? ((t = a.decoder.write(t)),
                        a.objectMode || 0 !== t.length
                          ? c(e, a, t, !1)
                          : _(e, a))
                      : c(e, a, t, !1);
                }
              }
              return !a.ended && (a.length < a.highWaterMark || 0 === a.length);
            }
            function c(e, t, n, r) {
              t.flowing && 0 === t.length && !t.sync
                ? ((t.awaitDrain = 0), e.emit("data", n))
                : ((t.length += t.objectMode ? 1 : n.length),
                  r ? t.buffer.unshift(n) : t.buffer.push(n),
                  t.needReadable && m(e)),
                _(e, t);
            }
            function u(e, t) {
              var n;
              return (
                i(t) ||
                  "string" == typeof t ||
                  void 0 === t ||
                  e.objectMode ||
                  (n = new F("chunk", ["string", "Buffer", "Uint8Array"], t)),
                n
              );
            }
            function f(e) {
              return (
                8388608 <= e
                  ? (e = 8388608)
                  : (e--,
                    (e |= e >>> 1),
                    (e |= e >>> 2),
                    (e |= e >>> 4),
                    (e |= e >>> 8),
                    (e |= e >>> 16),
                    e++),
                e
              );
            }
            function p(e, t) {
              return 0 >= e || (0 === t.length && t.ended)
                ? 0
                : t.objectMode
                ? 1
                : e === e
                ? (e > t.highWaterMark && (t.highWaterMark = f(e)),
                  e <= t.length
                    ? e
                    : t.ended
                    ? t.length
                    : ((t.needReadable = !0), 0))
                : t.flowing && t.length
                ? t.buffer.head.data.length
                : t.length;
            }
            function h(e, t) {
              if (!t.ended) {
                if (t.decoder) {
                  var n = t.decoder.end();
                  n &&
                    n.length &&
                    (t.buffer.push(n),
                    (t.length += t.objectMode ? 1 : n.length));
                }
                (t.ended = !0),
                  t.sync
                    ? m(e)
                    : ((t.needReadable = !1),
                      !t.emittedReadable && ((t.emittedReadable = !0), g(e)));
              }
            }
            function m(e) {
              var t = e._readableState;
              (t.needReadable = !1),
                t.emittedReadable ||
                  (N("emitReadable", t.flowing),
                  (t.emittedReadable = !0),
                  n.nextTick(g, e));
            }
            function g(e) {
              var t = e._readableState;
              N("emitReadable_", t.destroyed, t.length, t.ended),
                !t.destroyed && (t.length || t.ended) && e.emit("readable"),
                (t.needReadable =
                  !t.flowing && !t.ended && t.length <= t.highWaterMark),
                v(e);
            }
            function _(e, t) {
              t.readingMore || ((t.readingMore = !0), n.nextTick(b, e, t));
            }
            function b(e, t) {
              for (
                ;
                !t.reading &&
                !t.ended &&
                (t.length < t.highWaterMark || (t.flowing && 0 === t.length));

              ) {
                var n = t.length;
                if ((N("maybeReadMore read 0"), e.read(0), n === t.length))
                  break;
              }
              t.readingMore = !1;
            }
            function y(e) {
              return function() {
                var t = e._readableState;
                N("pipeOnDrain", t.awaitDrain),
                  t.awaitDrain && t.awaitDrain--,
                  0 === t.awaitDrain &&
                    R(e, "data") &&
                    ((t.flowing = !0), v(e));
              };
            }
            function w(e) {
              var t = e._readableState;
              (t.readableListening = 0 < e.listenerCount("readable")),
                t.resumeScheduled && !t.paused
                  ? (t.flowing = !0)
                  : 0 < e.listenerCount("data") && e.resume();
            }
            function k(e) {
              N("readable nexttick read 0"), e.read(0);
            }
            function E(e, t) {
              t.resumeScheduled ||
                ((t.resumeScheduled = !0), n.nextTick(x, e, t));
            }
            function x(e, t) {
              N("resume", t.reading),
                t.reading || e.read(0),
                (t.resumeScheduled = !1),
                e.emit("resume"),
                v(e),
                t.flowing && !t.reading && e.read(0);
            }
            function v(e) {
              var t = e._readableState;
              for (N("flow", t.flowing); t.flowing && null !== e.read(); );
            }
            function S(e, t) {
              if (0 === t.length) return null;
              var n;
              return (
                t.objectMode
                  ? (n = t.buffer.shift())
                  : !e || e >= t.length
                  ? ((n = t.decoder
                      ? t.buffer.join("")
                      : 1 === t.buffer.length
                      ? t.buffer.first()
                      : t.buffer.concat(t.length)),
                    t.buffer.clear())
                  : (n = t.buffer.consume(e, t.decoder)),
                n
              );
            }
            function C(e) {
              var t = e._readableState;
              N("endReadable", t.endEmitted),
                t.endEmitted || ((t.ended = !0), n.nextTick(I, t, e));
            }
            function I(e, t) {
              N("endReadableNT", e.endEmitted, e.length),
                e.endEmitted ||
                  0 !== e.length ||
                  ((e.endEmitted = !0), (t.readable = !1), t.emit("end"));
            }
            function L(e, t) {
              for (var n = 0, r = e.length; n < r; n++)
                if (e[n] === t) return n;
              return -1;
            }
            t.exports = s;
            var T;
            s.ReadableState = d;
            var B = e("events").EventEmitter,
              R = function(e, t) {
                return e.listeners(t).length;
              },
              A = e("./internal/streams/stream"),
              U = e("buffer").Buffer,
              P = r.Uint8Array || function() {},
              O = e("util"),
              N;
            N = O && O.debuglog ? O.debuglog("stream") : function() {};
            var M = e("./internal/streams/buffer_list"),
              H = e("./internal/streams/destroy"),
              q = e("./internal/streams/state"),
              D = q.getHighWaterMark,
              j = e("../errors").codes,
              F = j.ERR_INVALID_ARG_TYPE,
              W = j.ERR_STREAM_PUSH_AFTER_EOF,
              z = j.ERR_METHOD_NOT_IMPLEMENTED,
              V = j.ERR_STREAM_UNSHIFT_AFTER_END_EVENT,
              G = e("../experimentalWarning"),
              K = G.emitExperimentalWarning,
              Y,
              X;
            e("inherits")(s, A);
            var $ = ["error", "close", "destroy", "pause", "resume"];
            Object.defineProperty(s.prototype, "destroyed", {
              enumerable: !1,
              get: function() {
                return (
                  void 0 !== this._readableState &&
                  this._readableState.destroyed
                );
              },
              set: function(e) {
                this._readableState && (this._readableState.destroyed = e);
              }
            }),
              (s.prototype.destroy = H.destroy),
              (s.prototype._undestroy = H.undestroy),
              (s.prototype._destroy = function(e, t) {
                t(e);
              }),
              (s.prototype.push = function(e, t) {
                var n = this._readableState,
                  r;
                return (
                  n.objectMode
                    ? (r = !0)
                    : "string" == typeof e &&
                      ((t = t || n.defaultEncoding),
                      t !== n.encoding && ((e = U.from(e, t)), (t = "")),
                      (r = !0)),
                  l(this, e, t, !1, r)
                );
              }),
              (s.prototype.unshift = function(e) {
                return l(this, e, null, !0, !1);
              }),
              (s.prototype.isPaused = function() {
                return !1 === this._readableState.flowing;
              }),
              (s.prototype.setEncoding = function(t) {
                return (
                  Y || (Y = e("string_decoder/").StringDecoder),
                  (this._readableState.decoder = new Y(t)),
                  (this._readableState.encoding = this._readableState.decoder.encoding),
                  this
                );
              });
            (s.prototype.read = function(e) {
              N("read", e), (e = parseInt(e, 10));
              var t = this._readableState,
                r = e;
              if (
                (0 !== e && (t.emittedReadable = !1),
                0 === e &&
                  t.needReadable &&
                  ((0 === t.highWaterMark
                    ? 0 < t.length
                    : t.length >= t.highWaterMark) ||
                    t.ended))
              )
                return (
                  N("read: emitReadable", t.length, t.ended),
                  0 === t.length && t.ended ? C(this) : m(this),
                  null
                );
              if (((e = p(e, t)), 0 === e && t.ended))
                return 0 === t.length && C(this), null;
              var o = t.needReadable;
              N("need readable", o),
                (0 === t.length || t.length - e < t.highWaterMark) &&
                  ((o = !0), N("length less than watermark", o)),
                t.ended || t.reading
                  ? ((o = !1), N("reading or ended", o))
                  : o &&
                    (N("do read"),
                    (t.reading = !0),
                    (t.sync = !0),
                    0 === t.length && (t.needReadable = !0),
                    this._read(t.highWaterMark),
                    (t.sync = !1),
                    !t.reading && (e = p(r, t)));
              var i;
              return (
                (i = 0 < e ? S(e, t) : null),
                null === i
                  ? ((t.needReadable = !0), (e = 0))
                  : ((t.length -= e), (t.awaitDrain = 0)),
                0 === t.length &&
                  (!t.ended && (t.needReadable = !0),
                  r !== e && t.ended && C(this)),
                null !== i && this.emit("data", i),
                i
              );
            }),
              (s.prototype._read = function() {
                this.emit("error", new z("_read()"));
              }),
              (s.prototype.pipe = function(e, t) {
                function r(e, t) {
                  N("onunpipe"),
                    e === f &&
                      t &&
                      !1 === t.hasUnpiped &&
                      ((t.hasUnpiped = !0), i());
                }
                function o() {
                  N("onend"), e.end();
                }
                function i() {
                  N("cleanup"),
                    e.removeListener("close", l),
                    e.removeListener("finish", c),
                    e.removeListener("drain", g),
                    e.removeListener("error", s),
                    e.removeListener("unpipe", r),
                    f.removeListener("end", o),
                    f.removeListener("end", u),
                    f.removeListener("data", d),
                    (_ = !0),
                    p.awaitDrain &&
                      (!e._writableState || e._writableState.needDrain) &&
                      g();
                }
                function d(t) {
                  N("ondata");
                  var n = e.write(t);
                  N("dest.write", n),
                    !1 === n &&
                      (((1 === p.pipesCount && p.pipes === e) ||
                        (1 < p.pipesCount && -1 !== L(p.pipes, e))) &&
                        !_ &&
                        (N("false write response, pause", p.awaitDrain),
                        p.awaitDrain++),
                      f.pause());
                }
                function s(t) {
                  N("onerror", t),
                    u(),
                    e.removeListener("error", s),
                    0 === R(e, "error") && e.emit("error", t);
                }
                function l() {
                  e.removeListener("finish", c), u();
                }
                function c() {
                  N("onfinish"), e.removeListener("close", l), u();
                }
                function u() {
                  N("unpipe"), f.unpipe(e);
                }
                var f = this,
                  p = this._readableState;
                switch (p.pipesCount) {
                  case 0:
                    p.pipes = e;
                    break;
                  case 1:
                    p.pipes = [p.pipes, e];
                    break;
                  default:
                    p.pipes.push(e);
                }
                (p.pipesCount += 1),
                  N("pipe count=%d opts=%j", p.pipesCount, t);
                var h =
                    (!t || !1 !== t.end) && e !== n.stdout && e !== n.stderr,
                  m = h ? o : u;
                p.endEmitted ? n.nextTick(m) : f.once("end", m),
                  e.on("unpipe", r);
                var g = y(f);
                e.on("drain", g);
                var _ = !1;
                return (
                  f.on("data", d),
                  a(e, "error", s),
                  e.once("close", l),
                  e.once("finish", c),
                  e.emit("pipe", f),
                  p.flowing || (N("pipe resume"), f.resume()),
                  e
                );
              }),
              (s.prototype.unpipe = function(e) {
                var t = this._readableState,
                  n = { hasUnpiped: !1 };
                if (0 === t.pipesCount) return this;
                if (1 === t.pipesCount)
                  return e && e !== t.pipes
                    ? this
                    : (e || (e = t.pipes),
                      (t.pipes = null),
                      (t.pipesCount = 0),
                      (t.flowing = !1),
                      e && e.emit("unpipe", this, n),
                      this);
                if (!e) {
                  var r = t.pipes,
                    o = t.pipesCount;
                  (t.pipes = null), (t.pipesCount = 0), (t.flowing = !1);
                  for (var a = 0; a < o; a++)
                    r[a].emit("unpipe", this, { hasUnpiped: !1 });
                  return this;
                }
                var d = L(t.pipes, e);
                return -1 === d
                  ? this
                  : (t.pipes.splice(d, 1),
                    (t.pipesCount -= 1),
                    1 === t.pipesCount && (t.pipes = t.pipes[0]),
                    e.emit("unpipe", this, n),
                    this);
              }),
              (s.prototype.on = function(e, t) {
                var r = A.prototype.on.call(this, e, t),
                  o = this._readableState;
                return (
                  "data" === e
                    ? ((o.readableListening =
                        0 < this.listenerCount("readable")),
                      !1 !== o.flowing && this.resume())
                    : "readable" == e &&
                      !o.endEmitted &&
                      !o.readableListening &&
                      ((o.readableListening = o.needReadable = !0),
                      (o.flowing = !1),
                      (o.emittedReadable = !1),
                      N("on readable", o.length, o.reading),
                      o.length ? m(this) : !o.reading && n.nextTick(k, this)),
                  r
                );
              }),
              (s.prototype.addListener = s.prototype.on),
              (s.prototype.removeListener = function(e, t) {
                var r = A.prototype.removeListener.call(this, e, t);
                return "readable" === e && n.nextTick(w, this), r;
              }),
              (s.prototype.removeAllListeners = function(e) {
                var t = A.prototype.removeAllListeners.apply(this, arguments);
                return (
                  ("readable" === e || void 0 === e) && n.nextTick(w, this), t
                );
              }),
              (s.prototype.resume = function() {
                var e = this._readableState;
                return (
                  e.flowing ||
                    (N("resume"),
                    (e.flowing = !e.readableListening),
                    E(this, e)),
                  (e.paused = !1),
                  this
                );
              }),
              (s.prototype.pause = function() {
                return (
                  N("call pause flowing=%j", this._readableState.flowing),
                  !1 !== this._readableState.flowing &&
                    (N("pause"),
                    (this._readableState.flowing = !1),
                    this.emit("pause")),
                  (this._readableState.paused = !0),
                  this
                );
              }),
              (s.prototype.wrap = function(e) {
                var t = this,
                  r = this._readableState,
                  o = !1;
                for (var a in (e.on("end", function() {
                  if ((N("wrapped end"), r.decoder && !r.ended)) {
                    var e = r.decoder.end();
                    e && e.length && t.push(e);
                  }
                  t.push(null);
                }),
                e.on("data", function(n) {
                  if (
                    (N("wrapped data"),
                    r.decoder && (n = r.decoder.write(n)),
                    !(r.objectMode && (null === n || void 0 === n))) &&
                    (r.objectMode || (n && n.length))
                  ) {
                    var i = t.push(n);
                    i || ((o = !0), e.pause());
                  }
                }),
                e))
                  void 0 === this[a] &&
                    "function" == typeof e[a] &&
                    (this[a] = (function(t) {
                      return function() {
                        return e[t].apply(e, arguments);
                      };
                    })(a));
                for (var i = 0; i < $.length; i++)
                  e.on($[i], this.emit.bind(this, $[i]));
                return (
                  (this._read = function(t) {
                    N("wrapped _read", t), o && ((o = !1), e.resume());
                  }),
                  this
                );
              }),
              "function" == typeof Symbol &&
                (s.prototype[Symbol.asyncIterator] = function() {
                  return (
                    K("Readable[Symbol.asyncIterator]"),
                    void 0 === X &&
                      (X = e("./internal/streams/async_iterator")),
                    X(this)
                  );
                }),
              Object.defineProperty(s.prototype, "readableHighWaterMark", {
                enumerable: !1,
                get: function() {
                  return this._readableState.highWaterMark;
                }
              }),
              Object.defineProperty(s.prototype, "readableBuffer", {
                enumerable: !1,
                get: function() {
                  return this._readableState && this._readableState.buffer;
                }
              }),
              Object.defineProperty(s.prototype, "readableFlowing", {
                enumerable: !1,
                get: function() {
                  return this._readableState.flowing;
                },
                set: function(e) {
                  this._readableState && (this._readableState.flowing = e);
                }
              }),
              (s._fromList = S),
              Object.defineProperty(s.prototype, "readableLength", {
                enumerable: !1,
                get: function() {
                  return this._readableState.length;
                }
              });
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {
          "../errors": 71,
          "../experimentalWarning": 72,
          "./_stream_duplex": 73,
          "./internal/streams/async_iterator": 78,
          "./internal/streams/buffer_list": 79,
          "./internal/streams/destroy": 80,
          "./internal/streams/state": 83,
          "./internal/streams/stream": 84,
          _process: 61,
          buffer: 26,
          events: 33,
          inherits: 39,
          "string_decoder/": 106,
          util: 21
        }
      ],
      76: [
        function(e, t) {
          "use strict";
          function n(e, t) {
            var n = this._transformState;
            n.transforming = !1;
            var r = n.writecb;
            if (null === r) return this.emit("error", new s());
            (n.writechunk = null),
              (n.writecb = null),
              null != t && this.push(t),
              r(e);
            var o = this._readableState;
            (o.reading = !1),
              (o.needReadable || o.length < o.highWaterMark) &&
                this._read(o.highWaterMark);
          }
          function r(e) {
            return this instanceof r
              ? void (u.call(this, e),
                (this._transformState = {
                  afterTransform: n.bind(this),
                  needTransform: !1,
                  transforming: !1,
                  writecb: null,
                  writechunk: null,
                  writeencoding: null
                }),
                (this._readableState.needReadable = !0),
                (this._readableState.sync = !1),
                e &&
                  ("function" == typeof e.transform &&
                    (this._transform = e.transform),
                  "function" == typeof e.flush && (this._flush = e.flush)),
                this.on("prefinish", o))
              : new r(e);
          }
          function o() {
            var e = this;
            "function" != typeof this._flush || this._readableState.destroyed
              ? i(this, null, null)
              : this._flush(function(t, n) {
                  i(e, t, n);
                });
          }
          function i(e, t, n) {
            if (t) return e.emit("error", t);
            if ((null != n && e.push(n), e._writableState.length))
              throw new c();
            if (e._transformState.transforming) throw new l();
            return e.push(null);
          }
          t.exports = r;
          var a = e("../errors").codes,
            d = a.ERR_METHOD_NOT_IMPLEMENTED,
            s = a.ERR_MULTIPLE_CALLBACK,
            l = a.ERR_TRANSFORM_ALREADY_TRANSFORMING,
            c = a.ERR_TRANSFORM_WITH_LENGTH_0,
            u = e("./_stream_duplex");
          e("inherits")(r, u),
            (r.prototype.push = function(e, t) {
              return (
                (this._transformState.needTransform = !1),
                u.prototype.push.call(this, e, t)
              );
            }),
            (r.prototype._transform = function(e, t, n) {
              n(new d("_transform()"));
            }),
            (r.prototype._write = function(e, t, n) {
              var r = this._transformState;
              if (
                ((r.writecb = n),
                (r.writechunk = e),
                (r.writeencoding = t),
                !r.transforming)
              ) {
                var o = this._readableState;
                (r.needTransform ||
                  o.needReadable ||
                  o.length < o.highWaterMark) &&
                  this._read(o.highWaterMark);
              }
            }),
            (r.prototype._read = function() {
              var e = this._transformState;
              null === e.writechunk || e.transforming
                ? (e.needTransform = !0)
                : ((e.transforming = !0),
                  this._transform(
                    e.writechunk,
                    e.writeencoding,
                    e.afterTransform
                  ));
            }),
            (r.prototype._destroy = function(e, t) {
              u.prototype._destroy.call(this, e, function(e) {
                t(e);
              });
            });
        },
        { "../errors": 71, "./_stream_duplex": 73, inherits: 39 }
      ],
      77: [
        function(e, t) {
          (function(n, r) {
            "use strict";
            function o(e) {
              var t = this;
              (this.next = null),
                (this.entry = null),
                (this.finish = function() {
                  C(t, e);
                });
            }
            function i(e) {
              return B.from(e);
            }
            function a(e) {
              return B.isBuffer(e) || e instanceof R;
            }
            function d() {}
            function s(t, n, r) {
              (I = I || e("./_stream_duplex")),
                (t = t || {}),
                "boolean" != typeof r && (r = n instanceof I),
                (this.objectMode = !!t.objectMode),
                r &&
                  (this.objectMode = this.objectMode || !!t.writableObjectMode),
                (this.highWaterMark = P(this, t, "writableHighWaterMark", r)),
                (this.finalCalled = !1),
                (this.needDrain = !1),
                (this.ending = !1),
                (this.ended = !1),
                (this.finished = !1),
                (this.destroyed = !1);
              var i = !1 === t.decodeStrings;
              (this.decodeStrings = !i),
                (this.defaultEncoding = t.defaultEncoding || "utf8"),
                (this.length = 0),
                (this.writing = !1),
                (this.corked = 0),
                (this.sync = !0),
                (this.bufferProcessing = !1),
                (this.onwrite = function(e) {
                  _(n, e);
                }),
                (this.writecb = null),
                (this.writelen = 0),
                (this.bufferedRequest = null),
                (this.lastBufferedRequest = null),
                (this.pendingcb = 0),
                (this.prefinished = !1),
                (this.errorEmitted = !1),
                (this.emitClose = !1 !== t.emitClose),
                (this.bufferedRequestCount = 0),
                (this.corkedRequestsFree = new o(this));
            }
            function l(t) {
              I = I || e("./_stream_duplex");
              var n = this instanceof I;
              return n || z.call(l, this)
                ? void ((this._writableState = new s(t, this, n)),
                  (this.writable = !0),
                  t &&
                    ("function" == typeof t.write && (this._write = t.write),
                    "function" == typeof t.writev && (this._writev = t.writev),
                    "function" == typeof t.destroy &&
                      (this._destroy = t.destroy),
                    "function" == typeof t.final && (this._final = t.final)),
                  T.call(this))
                : new l(t);
            }
            function c(e, t) {
              var r = new F();
              e.emit("error", r), n.nextTick(t, r);
            }
            function u(e, t, r, o) {
              var i;
              return (
                null === r
                  ? (i = new j())
                  : "string" != typeof r &&
                    !t.objectMode &&
                    (i = new N("chunk", ["string", "Buffer"], r)),
                !i || (e.emit("error", i), n.nextTick(o, i), !1)
              );
            }
            function f(e, t, n) {
              return (
                e.objectMode ||
                  !1 === e.decodeStrings ||
                  "string" != typeof t ||
                  (t = B.from(t, n)),
                t
              );
            }
            function p(e, t, n, r, o, i) {
              if (!n) {
                var a = f(t, r, o);
                r !== a && ((n = !0), (o = "buffer"), (r = a));
              }
              var d = t.objectMode ? 1 : r.length;
              t.length += d;
              var s = t.length < t.highWaterMark;
              if ((s || (t.needDrain = !0), t.writing || t.corked)) {
                var l = t.lastBufferedRequest;
                (t.lastBufferedRequest = {
                  chunk: r,
                  encoding: o,
                  isBuf: n,
                  callback: i,
                  next: null
                }),
                  l
                    ? (l.next = t.lastBufferedRequest)
                    : (t.bufferedRequest = t.lastBufferedRequest),
                  (t.bufferedRequestCount += 1);
              } else h(e, t, !1, d, r, o, i);
              return s;
            }
            function h(e, t, n, r, o, i, a) {
              (t.writelen = r),
                (t.writecb = a),
                (t.writing = !0),
                (t.sync = !0),
                t.destroyed
                  ? t.onwrite(new D("write"))
                  : n
                  ? e._writev(o, t.onwrite)
                  : e._write(o, i, t.onwrite),
                (t.sync = !1);
            }
            function m(e, t, r, o, i) {
              --t.pendingcb,
                r
                  ? (n.nextTick(i, o),
                    n.nextTick(v, e, t),
                    (e._writableState.errorEmitted = !0),
                    e.emit("error", o))
                  : (i(o),
                    (e._writableState.errorEmitted = !0),
                    e.emit("error", o),
                    v(e, t));
            }
            function g(e) {
              (e.writing = !1),
                (e.writecb = null),
                (e.length -= e.writelen),
                (e.writelen = 0);
            }
            function _(e, t) {
              var r = e._writableState,
                o = r.sync,
                i = r.writecb;
              if ("function" != typeof i) throw new H();
              if ((g(r), t)) m(e, r, o, t, i);
              else {
                var a = k(r) || e.destroyed;
                a ||
                  r.corked ||
                  r.bufferProcessing ||
                  !r.bufferedRequest ||
                  w(e, r),
                  o ? n.nextTick(b, e, r, a, i) : b(e, r, a, i);
              }
            }
            function b(e, t, n, r) {
              n || y(e, t), t.pendingcb--, r(), v(e, t);
            }
            function y(e, t) {
              0 === t.length &&
                t.needDrain &&
                ((t.needDrain = !1), e.emit("drain"));
            }
            function w(e, t) {
              t.bufferProcessing = !0;
              var n = t.bufferedRequest;
              if (e._writev && n && n.next) {
                var r = t.bufferedRequestCount,
                  i = Array(r),
                  a = t.corkedRequestsFree;
                a.entry = n;
                for (var d = 0, s = !0; n; )
                  (i[d] = n), n.isBuf || (s = !1), (n = n.next), (d += 1);
                (i.allBuffers = s),
                  h(e, t, !0, t.length, i, "", a.finish),
                  t.pendingcb++,
                  (t.lastBufferedRequest = null),
                  a.next
                    ? ((t.corkedRequestsFree = a.next), (a.next = null))
                    : (t.corkedRequestsFree = new o(t)),
                  (t.bufferedRequestCount = 0);
              } else {
                for (; n; ) {
                  var l = n.chunk,
                    c = n.encoding,
                    u = n.callback,
                    f = t.objectMode ? 1 : l.length;
                  if (
                    (h(e, t, !1, f, l, c, u),
                    (n = n.next),
                    t.bufferedRequestCount--,
                    t.writing)
                  )
                    break;
                }
                null === n && (t.lastBufferedRequest = null);
              }
              (t.bufferedRequest = n), (t.bufferProcessing = !1);
            }
            function k(e) {
              return (
                e.ending &&
                0 === e.length &&
                null === e.bufferedRequest &&
                !e.finished &&
                !e.writing
              );
            }
            function E(e, t) {
              e._final(function(n) {
                t.pendingcb--,
                  n && e.emit("error", n),
                  (t.prefinished = !0),
                  e.emit("prefinish"),
                  v(e, t);
              });
            }
            function x(e, t) {
              t.prefinished ||
                t.finalCalled ||
                ("function" != typeof e._final || t.destroyed
                  ? ((t.prefinished = !0), e.emit("prefinish"))
                  : (t.pendingcb++, (t.finalCalled = !0), n.nextTick(E, e, t)));
            }
            function v(e, t) {
              var n = k(t);
              return (
                n &&
                  (x(e, t),
                  0 === t.pendingcb && ((t.finished = !0), e.emit("finish"))),
                n
              );
            }
            function S(e, t, r) {
              (t.ending = !0),
                v(e, t),
                r && (t.finished ? n.nextTick(r) : e.once("finish", r)),
                (t.ended = !0),
                (e.writable = !1);
            }
            function C(e, t, n) {
              var r = e.entry;
              for (e.entry = null; r; ) {
                var o = r.callback;
                t.pendingcb--, o(n), (r = r.next);
              }
              t.corkedRequestsFree.next = e;
            }
            t.exports = l;
            var I;
            l.WritableState = s;
            var L = { deprecate: e("util-deprecate") },
              T = e("./internal/streams/stream"),
              B = e("buffer").Buffer,
              R = r.Uint8Array || function() {},
              A = e("./internal/streams/destroy"),
              U = e("./internal/streams/state"),
              P = U.getHighWaterMark,
              O = e("../errors").codes,
              N = O.ERR_INVALID_ARG_TYPE,
              M = O.ERR_METHOD_NOT_IMPLEMENTED,
              H = O.ERR_MULTIPLE_CALLBACK,
              q = O.ERR_STREAM_CANNOT_PIPE,
              D = O.ERR_STREAM_DESTROYED,
              j = O.ERR_STREAM_NULL_VALUES,
              F = O.ERR_STREAM_WRITE_AFTER_END,
              W = O.ERR_UNKNOWN_ENCODING;
            e("inherits")(l, T),
              (s.prototype.getBuffer = function() {
                for (var e = this.bufferedRequest, t = []; e; )
                  t.push(e), (e = e.next);
                return t;
              }),
              (function() {
                try {
                  Object.defineProperty(s.prototype, "buffer", {
                    get: L.deprecate(
                      function() {
                        return this.getBuffer();
                      },
                      "_writableState.buffer is deprecated. Use _writableState.getBuffer instead.",
                      "DEP0003"
                    )
                  });
                } catch (e) {}
              })();
            var z;
            "function" == typeof Symbol &&
            Symbol.hasInstance &&
            "function" == typeof Function.prototype[Symbol.hasInstance]
              ? ((z = Function.prototype[Symbol.hasInstance]),
                Object.defineProperty(l, Symbol.hasInstance, {
                  value: function(e) {
                    return (
                      !!z.call(this, e) ||
                      (!(this !== l) && e && e._writableState instanceof s)
                    );
                  }
                }))
              : (z = function(e) {
                  return e instanceof this;
                }),
              (l.prototype.pipe = function() {
                this.emit("error", new q());
              }),
              (l.prototype.write = function(e, t, n) {
                var r = this._writableState,
                  o = !1,
                  s = !r.objectMode && a(e);
                return (
                  s && !B.isBuffer(e) && (e = i(e)),
                  "function" == typeof t && ((n = t), (t = null)),
                  s ? (t = "buffer") : !t && (t = r.defaultEncoding),
                  "function" != typeof n && (n = d),
                  r.ending
                    ? c(this, n)
                    : (s || u(this, r, e, n)) &&
                      (r.pendingcb++, (o = p(this, r, s, e, t, n))),
                  o
                );
              }),
              (l.prototype.cork = function() {
                this._writableState.corked++;
              }),
              (l.prototype.uncork = function() {
                var e = this._writableState;
                e.corked &&
                  (e.corked--,
                  !e.writing &&
                    !e.corked &&
                    !e.bufferProcessing &&
                    e.bufferedRequest &&
                    w(this, e));
              }),
              (l.prototype.setDefaultEncoding = function(e) {
                if (
                  ("string" == typeof e && (e = e.toLowerCase()),
                  !(
                    -1 <
                    [
                      "hex",
                      "utf8",
                      "utf-8",
                      "ascii",
                      "binary",
                      "base64",
                      "ucs2",
                      "ucs-2",
                      "utf16le",
                      "utf-16le",
                      "raw"
                    ].indexOf((e + "").toLowerCase())
                  ))
                )
                  throw new W(e);
                return (this._writableState.defaultEncoding = e), this;
              }),
              Object.defineProperty(l.prototype, "writableBuffer", {
                enumerable: !1,
                get: function() {
                  return this._writableState && this._writableState.getBuffer();
                }
              }),
              Object.defineProperty(l.prototype, "writableHighWaterMark", {
                enumerable: !1,
                get: function() {
                  return this._writableState.highWaterMark;
                }
              }),
              (l.prototype._write = function(e, t, n) {
                n(new M("_write()"));
              }),
              (l.prototype._writev = null),
              (l.prototype.end = function(e, t, n) {
                var r = this._writableState;
                return (
                  "function" == typeof e
                    ? ((n = e), (e = null), (t = null))
                    : "function" == typeof t && ((n = t), (t = null)),
                  null !== e && void 0 !== e && this.write(e, t),
                  r.corked && ((r.corked = 1), this.uncork()),
                  r.ending || S(this, r, n),
                  this
                );
              }),
              Object.defineProperty(l.prototype, "writableLength", {
                enumerable: !1,
                get: function() {
                  return this._writableState.length;
                }
              }),
              Object.defineProperty(l.prototype, "destroyed", {
                enumerable: !1,
                get: function() {
                  return (
                    void 0 !== this._writableState &&
                    this._writableState.destroyed
                  );
                },
                set: function(e) {
                  this._writableState && (this._writableState.destroyed = e);
                }
              }),
              (l.prototype.destroy = A.destroy),
              (l.prototype._undestroy = A.undestroy),
              (l.prototype._destroy = function(e, t) {
                t(e);
              });
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {
          "../errors": 71,
          "./_stream_duplex": 73,
          "./internal/streams/destroy": 80,
          "./internal/streams/state": 83,
          "./internal/streams/stream": 84,
          _process: 61,
          buffer: 26,
          inherits: 39,
          "util-deprecate": 119
        }
      ],
      78: [
        function(e, t) {
          (function(n) {
            "use strict";
            function r(e, t, n) {
              return (
                t in e
                  ? Object.defineProperty(e, t, {
                      value: n,
                      enumerable: !0,
                      configurable: !0,
                      writable: !0
                    })
                  : (e[t] = n),
                e
              );
            }
            function o(e, t) {
              return { value: e, done: t };
            }
            function i(e) {
              var t = e[l];
              if (null !== t) {
                var n = e[m].read();
                null !== n &&
                  ((e[p] = null), (e[l] = null), (e[c] = null), t(o(n, !1)));
              }
            }
            function a(e) {
              n.nextTick(i, e);
            }
            function d(e, t) {
              return function(n, r) {
                e.then(function() {
                  return t[f] ? void n(o(void 0, !0)) : void t[h](n, r);
                }, r);
              };
            }
            var s = e("./end-of-stream"),
              l = Symbol("lastResolve"),
              c = Symbol("lastReject"),
              u = Symbol("error"),
              f = Symbol("ended"),
              p = Symbol("lastPromise"),
              h = Symbol("handlePromise"),
              m = Symbol("stream"),
              g = Object.getPrototypeOf(function() {}),
              _ = Object.setPrototypeOf(
                ((b = {
                  get stream() {
                    return this[m];
                  },
                  next: function() {
                    var e = this,
                      t = this[u];
                    if (null !== t) return Promise.reject(t);
                    if (this[f]) return Promise.resolve(o(void 0, !0));
                    if (this[m].destroyed)
                      return new Promise(function(t, r) {
                        n.nextTick(function() {
                          e[u] ? r(e[u]) : t(o(void 0, !0));
                        });
                      });
                    var r = this[p],
                      i;
                    if (r) i = new Promise(d(r, this));
                    else {
                      var a = this[m].read();
                      if (null !== a) return Promise.resolve(o(a, !1));
                      i = new Promise(this[h]);
                    }
                    return (this[p] = i), i;
                  }
                }),
                r(b, Symbol.asyncIterator, function() {
                  return this;
                }),
                r(b, "return", function() {
                  var e = this;
                  return new Promise(function(t, n) {
                    e[m].destroy(null, function(e) {
                      return e ? void n(e) : void t(o(void 0, !0));
                    });
                  });
                }),
                b),
                g
              ),
              b;
            t.exports = function(e) {
              var t = Object.create(
                  _,
                  ((n = {}),
                  r(n, m, { value: e, writable: !0 }),
                  r(n, l, { value: null, writable: !0 }),
                  r(n, c, { value: null, writable: !0 }),
                  r(n, u, { value: null, writable: !0 }),
                  r(n, f, { value: e._readableState.endEmitted, writable: !0 }),
                  r(n, h, {
                    value: function(e, n) {
                      var r = t[m].read();
                      r
                        ? ((t[p] = null),
                          (t[l] = null),
                          (t[c] = null),
                          e(o(r, !1)))
                        : ((t[l] = e), (t[c] = n));
                    },
                    writable: !0
                  }),
                  n)
                ),
                n;
              return (
                (t[p] = null),
                s(e, function(e) {
                  if (e && "ERR_STREAM_PREMATURE_CLOSE" !== e.code) {
                    var n = t[c];
                    return (
                      null !== n &&
                        ((t[p] = null), (t[l] = null), (t[c] = null), n(e)),
                      void (t[u] = e)
                    );
                  }
                  var r = t[l];
                  null !== r &&
                    ((t[p] = null),
                    (t[l] = null),
                    (t[c] = null),
                    r(o(void 0, !0))),
                    (t[f] = !0);
                }),
                e.on("readable", a.bind(null, t)),
                t
              );
            };
          }.call(this, e("_process")));
        },
        { "./end-of-stream": 81, _process: 61 }
      ],
      79: [
        function(e, t) {
          "use strict";
          function n(e) {
            for (var t = 1; t < arguments.length; t++) {
              var n = null == arguments[t] ? {} : arguments[t],
                o = Object.keys(n);
              "function" == typeof Object.getOwnPropertySymbols &&
                (o = o.concat(
                  Object.getOwnPropertySymbols(n).filter(function(e) {
                    return Object.getOwnPropertyDescriptor(n, e).enumerable;
                  })
                )),
                o.forEach(function(t) {
                  r(e, t, n[t]);
                });
            }
            return e;
          }
          function r(e, t, n) {
            return (
              t in e
                ? Object.defineProperty(e, t, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                  })
                : (e[t] = n),
              e
            );
          }
          function o(e, t, n) {
            a.prototype.copy.call(e, t, n);
          }
          var i = e("buffer"),
            a = i.Buffer,
            d = e("util"),
            s = d.inspect,
            l = (s && s.custom) || "inspect";
          t.exports = (function() {
            function e() {
              (this.head = null), (this.tail = null), (this.length = 0);
            }
            var t = e.prototype;
            return (
              (t.push = function(e) {
                var t = { data: e, next: null };
                0 < this.length ? (this.tail.next = t) : (this.head = t),
                  (this.tail = t),
                  ++this.length;
              }),
              (t.unshift = function(e) {
                var t = { data: e, next: this.head };
                0 === this.length && (this.tail = t),
                  (this.head = t),
                  ++this.length;
              }),
              (t.shift = function() {
                if (0 !== this.length) {
                  var e = this.head.data;
                  return (
                    (this.head =
                      1 === this.length ? (this.tail = null) : this.head.next),
                    --this.length,
                    e
                  );
                }
              }),
              (t.clear = function() {
                (this.head = this.tail = null), (this.length = 0);
              }),
              (t.join = function(e) {
                if (0 === this.length) return "";
                for (var t = this.head, n = "" + t.data; (t = t.next); )
                  n += e + t.data;
                return n;
              }),
              (t.concat = function(e) {
                if (0 === this.length) return a.alloc(0);
                for (var t = a.allocUnsafe(e >>> 0), n = this.head, r = 0; n; )
                  o(n.data, t, r), (r += n.data.length), (n = n.next);
                return t;
              }),
              (t.consume = function(e, t) {
                var n;
                return (
                  e < this.head.data.length
                    ? ((n = this.head.data.slice(0, e)),
                      (this.head.data = this.head.data.slice(e)))
                    : e === this.head.data.length
                    ? (n = this.shift())
                    : (n = t ? this._getString(e) : this._getBuffer(e)),
                  n
                );
              }),
              (t.first = function() {
                return this.head.data;
              }),
              (t._getString = function(e) {
                var t = this.head,
                  r = 1,
                  o = t.data;
                for (e -= o.length; (t = t.next); ) {
                  var i = t.data,
                    a = e > i.length ? i.length : e;
                  if (
                    ((o += a === i.length ? i : i.slice(0, e)),
                    (e -= a),
                    0 === e)
                  ) {
                    a === i.length
                      ? (++r,
                        (this.head = t.next ? t.next : (this.tail = null)))
                      : ((this.head = t), (t.data = i.slice(a)));
                    break;
                  }
                  ++r;
                }
                return (this.length -= r), o;
              }),
              (t._getBuffer = function(e) {
                var t = a.allocUnsafe(e),
                  r = this.head,
                  o = 1;
                for (r.data.copy(t), e -= r.data.length; (r = r.next); ) {
                  var i = r.data,
                    d = e > i.length ? i.length : e;
                  if ((i.copy(t, t.length - e, 0, d), (e -= d), 0 === e)) {
                    d === i.length
                      ? (++o,
                        (this.head = r.next ? r.next : (this.tail = null)))
                      : ((this.head = r), (r.data = i.slice(d)));
                    break;
                  }
                  ++o;
                }
                return (this.length -= o), t;
              }),
              (t[l] = function(e, t) {
                return s(this, n({}, t, { depth: 0, customInspect: !1 }));
              }),
              e
            );
          })();
        },
        { buffer: 26, util: 21 }
      ],
      80: [
        function(e, t) {
          (function(e) {
            "use strict";
            function n(e, t) {
              o(e, t), r(e);
            }
            function r(e) {
              (e._writableState && !e._writableState.emitClose) ||
                (e._readableState && !e._readableState.emitClose) ||
                e.emit("close");
            }
            function o(e, t) {
              e.emit("error", t);
            }
            t.exports = {
              destroy: function(t, i) {
                var a = this,
                  d = this._readableState && this._readableState.destroyed,
                  s = this._writableState && this._writableState.destroyed;
                return d || s
                  ? (i
                      ? i(t)
                      : t &&
                        (!this._writableState ||
                          !this._writableState.errorEmitted) &&
                        e.nextTick(o, this, t),
                    this)
                  : (this._readableState &&
                      (this._readableState.destroyed = !0),
                    this._writableState && (this._writableState.destroyed = !0),
                    this._destroy(t || null, function(t) {
                      !i && t
                        ? (e.nextTick(n, a, t),
                          a._writableState &&
                            (a._writableState.errorEmitted = !0))
                        : i
                        ? (e.nextTick(r, a), i(t))
                        : e.nextTick(r, a);
                    }),
                    this);
              },
              undestroy: function() {
                this._readableState &&
                  ((this._readableState.destroyed = !1),
                  (this._readableState.reading = !1),
                  (this._readableState.ended = !1),
                  (this._readableState.endEmitted = !1)),
                  this._writableState &&
                    ((this._writableState.destroyed = !1),
                    (this._writableState.ended = !1),
                    (this._writableState.ending = !1),
                    (this._writableState.finalCalled = !1),
                    (this._writableState.prefinished = !1),
                    (this._writableState.finished = !1),
                    (this._writableState.errorEmitted = !1));
              }
            };
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      81: [
        function(e, t) {
          "use strict";
          function n(e) {
            var t = !1;
            return function() {
              if (!t) {
                t = !0;
                for (var n = arguments.length, r = Array(n), o = 0; o < n; o++)
                  r[o] = arguments[o];
                e.apply(this, r);
              }
            };
          }
          function r() {}
          function o(e) {
            return e.setHeader && "function" == typeof e.abort;
          }
          function i(e, t, d) {
            if ("function" == typeof t) return i(e, null, t);
            t || (t = {}), (d = n(d || r));
            var s = t.readable || (!1 !== t.readable && e.readable),
              l = t.writable || (!1 !== t.writable && e.writable),
              c = function() {
                e.writable || f();
              },
              u = e._writableState && e._writableState.finished,
              f = function() {
                (l = !1), (u = !0), s || d.call(e);
              },
              p = e._readableState && e._readableState.endEmitted,
              h = function() {
                (s = !1), (p = !0), l || d.call(e);
              },
              m = function(t) {
                d.call(e, t);
              },
              g = function() {
                var t;
                return s && !p
                  ? ((e._readableState && e._readableState.ended) ||
                      (t = new a()),
                    d.call(e, t))
                  : l && !u
                  ? ((e._writableState && e._writableState.ended) ||
                      (t = new a()),
                    d.call(e, t))
                  : void 0;
              },
              _ = function() {
                e.req.on("finish", f);
              };
            return (
              o(e)
                ? (e.on("complete", f),
                  e.on("abort", g),
                  e.req ? _() : e.on("request", _))
                : l && !e._writableState && (e.on("end", c), e.on("close", c)),
              e.on("end", h),
              e.on("finish", f),
              !1 !== t.error && e.on("error", m),
              e.on("close", g),
              function() {
                e.removeListener("complete", f),
                  e.removeListener("abort", g),
                  e.removeListener("request", _),
                  e.req && e.req.removeListener("finish", f),
                  e.removeListener("end", c),
                  e.removeListener("close", c),
                  e.removeListener("finish", f),
                  e.removeListener("end", h),
                  e.removeListener("error", m),
                  e.removeListener("close", g);
              }
            );
          }
          var a = e("../../../errors").codes.ERR_STREAM_PREMATURE_CLOSE;
          t.exports = i;
        },
        { "../../../errors": 71 }
      ],
      82: [
        function(e, t) {
          "use strict";
          function n(e) {
            var t = !1;
            return function() {
              t || ((t = !0), e.apply(void 0, arguments));
            };
          }
          function r(e) {
            if (e) throw e;
          }
          function o(e) {
            return e.setHeader && "function" == typeof e.abort;
          }
          function a(t, r, i, a) {
            a = n(a);
            var d = !1;
            t.on("close", function() {
              d = !0;
            }),
              p === void 0 && (p = e("./end-of-stream")),
              p(t, { readable: r, writable: i }, function(e) {
                return e ? a(e) : void ((d = !0), a());
              });
            var s = !1;
            return function(e) {
              if (!d)
                return s
                  ? void 0
                  : ((s = !0),
                    o(t)
                      ? t.abort()
                      : "function" == typeof t.destroy
                      ? t.destroy()
                      : void a(e || new f("pipe")));
            };
          }
          function d(e) {
            e();
          }
          function s(e, t) {
            return e.pipe(t);
          }
          function l(e) {
            return e.length
              ? "function" == typeof e[e.length - 1]
                ? e.pop()
                : r
              : r;
          }
          var c = e("../../../errors").codes,
            u = c.ERR_MISSING_ARGS,
            f = c.ERR_STREAM_DESTROYED,
            p;
          t.exports = function() {
            for (var e = arguments.length, t = Array(e), n = 0; n < e; n++)
              t[n] = arguments[n];
            var r = l(t);
            if ((Array.isArray(t[0]) && (t = t[0]), 2 > t.length))
              throw new u("streams");
            var o = t.map(function(e, n) {
                var s = n < t.length - 1;
                return a(e, s, 0 < n, function(e) {
                  i || (i = e), e && o.forEach(d), s || (o.forEach(d), r(i));
                });
              }),
              i;
            return t.reduce(s);
          };
        },
        { "../../../errors": 71, "./end-of-stream": 81 }
      ],
      83: [
        function(e, t) {
          "use strict";
          function n(e, t, n) {
            return null == e.highWaterMark
              ? t
                ? e[n]
                : null
              : e.highWaterMark;
          }
          var o = e("../../../errors").codes.ERR_INVALID_OPT_VALUE;
          t.exports = {
            getHighWaterMark: function(e, t, i, a) {
              var d = n(t, a, i);
              if (null != d) {
                if (!(isFinite(d) && r(d) === d) || 0 > d) {
                  var s = a ? i : "highWaterMark";
                  throw new o(s, d);
                }
                return r(d);
              }
              return e.objectMode ? 16 : 16384;
            }
          };
        },
        { "../../../errors": 71 }
      ],
      84: [
        function(e, t) {
          t.exports = e("events").EventEmitter;
        },
        { events: 33 }
      ],
      85: [
        function(e, t, n) {
          (n = t.exports = e("./lib/_stream_readable.js")),
            (n.Stream = n),
            (n.Readable = n),
            (n.Writable = e("./lib/_stream_writable.js")),
            (n.Duplex = e("./lib/_stream_duplex.js")),
            (n.Transform = e("./lib/_stream_transform.js")),
            (n.PassThrough = e("./lib/_stream_passthrough.js")),
            (n.finished = e("./lib/internal/streams/end-of-stream.js")),
            (n.pipeline = e("./lib/internal/streams/pipeline.js"));
        },
        {
          "./lib/_stream_duplex.js": 73,
          "./lib/_stream_passthrough.js": 74,
          "./lib/_stream_readable.js": 75,
          "./lib/_stream_transform.js": 76,
          "./lib/_stream_writable.js": 77,
          "./lib/internal/streams/end-of-stream.js": 81,
          "./lib/internal/streams/pipeline.js": 82
        }
      ],
      86: [
        function(e, t, n) {
          function r(e, t, n, r) {
            function i() {
              return (
                !("number" == typeof e.length && e.length > n.maxBlobLength) ||
                (l(
                  "File length too large for Blob URL approach: %d (max: %d)",
                  e.length,
                  n.maxBlobLength
                ),
                v(
                  new Error(
                    "File length too large for Blob URL approach: " +
                      e.length +
                      " (max: " +
                      n.maxBlobLength +
                      ")"
                  )
                ),
                !1)
              );
            }
            function d(n) {
              i() &&
                ((I = t(n)),
                o(e, function(e, t) {
                  return e
                    ? v(e)
                    : void (I.addEventListener("error", v),
                      I.addEventListener("loadstart", s),
                      I.addEventListener("canplay", p),
                      (I.src = t));
                }));
            }
            function s() {
              I.removeEventListener("loadstart", s), n.autoplay && I.play();
            }
            function p() {
              I.removeEventListener("canplay", p), r(null, I);
            }
            function x() {
              o(e, function(e, n) {
                return e
                  ? v(e)
                  : void (".pdf" === S
                      ? ((I = t("object")),
                        I.setAttribute("typemustmatch", !0),
                        I.setAttribute("type", "application/pdf"),
                        I.setAttribute("data", n))
                      : ((I = t("iframe")),
                        (I.sandbox = "allow-forms allow-scripts"),
                        (I.src = n)),
                    r(null, I));
              });
            }
            function v(t) {
              (t.message =
                'Error rendering file "' + e.name + '": ' + t.message),
                l(t.message),
                r(t);
            }
            var S = f.extname(e.name).toLowerCase(),
              C = 0,
              I;
            0 <= _.indexOf(S)
              ? (function() {
                  function n() {
                    l("Use `videostream` package for " + e.name),
                      _(),
                      I.addEventListener("error", c),
                      I.addEventListener("loadstart", s),
                      I.addEventListener("canplay", p),
                      h(e, I);
                  }
                  function r() {
                    l("Use MediaSource API for " + e.name),
                      _(),
                      I.addEventListener("error", f),
                      I.addEventListener("loadstart", s),
                      I.addEventListener("canplay", p);
                    var t = new u(I),
                      n = t.createWriteStream(a(e.name));
                    e.createReadStream().pipe(n), C && (I.currentTime = C);
                  }
                  function d() {
                    l("Use Blob URL for " + e.name),
                      _(),
                      I.addEventListener("error", v),
                      I.addEventListener("loadstart", s),
                      I.addEventListener("canplay", p),
                      o(e, function(e, t) {
                        return e
                          ? v(e)
                          : void ((I.src = t), C && (I.currentTime = C));
                      });
                  }
                  function c(e) {
                    l(
                      "videostream error: fallback to MediaSource API: %o",
                      e.message || e
                    ),
                      I.removeEventListener("error", c),
                      I.removeEventListener("canplay", p),
                      r();
                  }
                  function f(e) {
                    l(
                      "MediaSource API error: fallback to Blob URL: %o",
                      e.message || e
                    );
                    i() &&
                      (I.removeEventListener("error", f),
                      I.removeEventListener("canplay", p),
                      d());
                  }
                  function _() {
                    I ||
                      ((I = t(b)),
                      I.addEventListener("progress", function() {
                        C = I.currentTime;
                      }));
                  }
                  var b = 0 <= g.indexOf(S) ? "video" : "audio";
                  E ? (0 <= m.indexOf(S) ? n() : r()) : d();
                })()
              : 0 <= b.indexOf(S)
              ? d("video")
              : 0 <= y.indexOf(S)
              ? d("audio")
              : 0 <= w.indexOf(S)
              ? (function() {
                  (I = t("img")),
                    o(e, function(t, n) {
                      return t
                        ? v(t)
                        : void ((I.src = n), (I.alt = e.name), r(null, I));
                    });
                })()
              : 0 <= k.indexOf(S)
              ? x()
              : (function() {
                  function t() {
                    c(n)
                      ? (l(
                          'File extension "%s" appears ascii, so will render.',
                          S
                        ),
                        x())
                      : (l(
                          'File extension "%s" appears non-ascii, will not render.',
                          S
                        ),
                        r(
                          new Error(
                            'Unsupported file type "' +
                              S +
                              '": Cannot append to DOM'
                          )
                        ));
                  }
                  l(
                    'Unknown file extension "%s" - will attempt to render into iframe',
                    S
                  );
                  var n = "";
                  e.createReadStream({ start: 0, end: 1e3 })
                    .setEncoding("utf8")
                    .on("data", function(e) {
                      n += e;
                    })
                    .on("end", t)
                    .on("error", r);
                })();
          }
          function o(e, t) {
            var r = f.extname(e.name).toLowerCase();
            p(e.createReadStream(), n.mime[r]).then(
              e => t(null, e),
              e => t(e)
            );
          }
          function i(e) {
            if (null == e) throw new Error("file cannot be null or undefined");
            if ("string" != typeof e.name)
              throw new Error("missing or invalid file.name property");
            if ("function" != typeof e.createReadStream)
              throw new Error(
                "missing or invalid file.createReadStream property"
              );
          }
          function a(e) {
            var t = f.extname(e).toLowerCase();
            return {
              ".m4a": 'audio/mp4; codecs="mp4a.40.5"',
              ".m4b": 'audio/mp4; codecs="mp4a.40.5"',
              ".m4p": 'audio/mp4; codecs="mp4a.40.5"',
              ".m4v": 'video/mp4; codecs="avc1.640029, mp4a.40.5"',
              ".mkv": 'video/webm; codecs="avc1.640029, mp4a.40.5"',
              ".mp3": "audio/mpeg",
              ".mp4": 'video/mp4; codecs="avc1.640029, mp4a.40.5"',
              ".webm": 'video/webm; codecs="vorbis, vp8"'
            }[t];
          }
          function d(e) {
            null == e.autoplay && (e.autoplay = !1),
              null == e.muted && (e.muted = !1),
              null == e.controls && (e.controls = !0),
              null == e.maxBlobLength && (e.maxBlobLength = 200000000);
          }
          function s(e, t) {
            (e.autoplay = !!t.autoplay),
              (e.muted = !!t.muted),
              (e.controls = !!t.controls);
          }
          (n.render = function(e, t, n, o) {
            "function" == typeof n && ((o = n), (n = {})),
              n || (n = {}),
              o || (o = function() {}),
              i(e),
              d(n),
              "string" == typeof t && (t = document.querySelector(t)),
              r(
                e,
                function(r) {
                  if (t.nodeName !== r.toUpperCase()) {
                    var o = f.extname(e.name).toLowerCase();
                    throw new Error(
                      'Cannot render "' +
                        o +
                        '" inside a "' +
                        t.nodeName.toLowerCase() +
                        '" element, expected "' +
                        r +
                        '"'
                    );
                  }
                  return ("video" === r || "audio" === r) && s(t, n), t;
                },
                n,
                o
              );
          }),
            (n.append = function(e, t, n, o) {
              function a(e) {
                var r = l(e);
                return s(r, n), t.appendChild(r), r;
              }
              function l(e) {
                var n = document.createElement(e);
                return t.appendChild(n), n;
              }
              function c(e, t) {
                e && t && t.remove(), o(e, t);
              }
              if (
                ("function" == typeof n && ((o = n), (n = {})),
                n || (n = {}),
                o || (o = function() {}),
                i(e),
                d(n),
                "string" == typeof t && (t = document.querySelector(t)),
                t && ("VIDEO" === t.nodeName || "AUDIO" === t.nodeName))
              )
                throw new Error(
                  "Invalid video/audio node argument. Argument must be root element that video/audio tag will be appended to."
                );
              r(
                e,
                function(e) {
                  return "video" === e || "audio" === e ? a(e) : l(e);
                },
                n,
                c
              );
            }),
            (n.mime = e("./lib/mime.json"));
          var l = e("debug")("render-media"),
            c = e("is-ascii"),
            u = e("mediasource"),
            f = e("path"),
            p = e("stream-to-blob-url"),
            h = e("videostream"),
            m = [".m4a", ".m4b", ".m4p", ".m4v", ".mp4"],
            g = [".m4v", ".mkv", ".mp4", ".webm"],
            _ = [].concat(g, [".m4a", ".m4b", ".m4p", ".mp3"]),
            b = [".mov", ".ogv"],
            y = [".aac", ".oga", ".ogg", ".wav", ".flac"],
            w = [".bmp", ".gif", ".jpeg", ".jpg", ".png", ".svg"],
            k = [".css", ".html", ".js", ".md", ".pdf", ".txt"],
            E = "undefined" != typeof window && window.MediaSource;
        },
        {
          "./lib/mime.json": 87,
          debug: 30,
          "is-ascii": 40,
          mediasource: 45,
          path: 59,
          "stream-to-blob-url": 103,
          videostream: 121
        }
      ],
      87: [
        function(e, t) {
          t.exports = {
            ".3gp": "video/3gpp",
            ".aac": "audio/aac",
            ".aif": "audio/x-aiff",
            ".aiff": "audio/x-aiff",
            ".atom": "application/atom+xml",
            ".avi": "video/x-msvideo",
            ".bmp": "image/bmp",
            ".bz2": "application/x-bzip2",
            ".conf": "text/plain",
            ".css": "text/css",
            ".csv": "text/plain",
            ".diff": "text/x-diff",
            ".doc": "application/msword",
            ".flv": "video/x-flv",
            ".gif": "image/gif",
            ".gz": "application/x-gzip",
            ".htm": "text/html",
            ".html": "text/html",
            ".ico": "image/vnd.microsoft.icon",
            ".ics": "text/calendar",
            ".iso": "application/octet-stream",
            ".jar": "application/java-archive",
            ".jpeg": "image/jpeg",
            ".jpg": "image/jpeg",
            ".js": "application/javascript",
            ".json": "application/json",
            ".less": "text/css",
            ".log": "text/plain",
            ".m3u": "audio/x-mpegurl",
            ".m4a": "audio/x-m4a",
            ".m4b": "audio/mp4",
            ".m4p": "audio/mp4",
            ".m4v": "video/x-m4v",
            ".manifest": "text/cache-manifest",
            ".markdown": "text/x-markdown",
            ".mathml": "application/mathml+xml",
            ".md": "text/x-markdown",
            ".mid": "audio/midi",
            ".midi": "audio/midi",
            ".mov": "video/quicktime",
            ".mp3": "audio/mpeg",
            ".mp4": "video/mp4",
            ".mp4v": "video/mp4",
            ".mpeg": "video/mpeg",
            ".mpg": "video/mpeg",
            ".odp": "application/vnd.oasis.opendocument.presentation",
            ".ods": "application/vnd.oasis.opendocument.spreadsheet",
            ".odt": "application/vnd.oasis.opendocument.text",
            ".oga": "audio/ogg",
            ".ogg": "application/ogg",
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".pps": "application/vnd.ms-powerpoint",
            ".ppt": "application/vnd.ms-powerpoint",
            ".ps": "application/postscript",
            ".psd": "image/vnd.adobe.photoshop",
            ".qt": "video/quicktime",
            ".rar": "application/x-rar-compressed",
            ".rdf": "application/rdf+xml",
            ".rss": "application/rss+xml",
            ".rtf": "application/rtf",
            ".svg": "image/svg+xml",
            ".svgz": "image/svg+xml",
            ".swf": "application/x-shockwave-flash",
            ".tar": "application/x-tar",
            ".tbz": "application/x-bzip-compressed-tar",
            ".text": "text/plain",
            ".tif": "image/tiff",
            ".tiff": "image/tiff",
            ".torrent": "application/x-bittorrent",
            ".ttf": "application/x-font-ttf",
            ".txt": "text/plain",
            ".wav": "audio/wav",
            ".webm": "video/webm",
            ".wma": "audio/x-ms-wma",
            ".wmv": "video/x-ms-wmv",
            ".xls": "application/vnd.ms-excel",
            ".xml": "application/xml",
            ".yaml": "text/yaml",
            ".yml": "text/yaml",
            ".zip": "application/zip"
          };
        },
        {}
      ],
      88: [
        function(e, t) {
          (function(e) {
            t.exports = function(t, n, r) {
              function o(t) {
                function n() {
                  r && r(t, s), (r = null);
                }
                d ? e.nextTick(n) : n();
              }
              function a(e, n, r) {
                if (((s[e] = r), n && (f = !0), 0 == --c || n)) o(n);
                else if (!f && p < l) {
                  var i;
                  u
                    ? ((i = u[p]),
                      (p += 1),
                      t[i](function(e, t) {
                        a(i, e, t);
                      }))
                    : ((i = p),
                      (p += 1),
                      t[i](function(e, t) {
                        a(i, e, t);
                      }));
                }
              }
              if ("number" != typeof n)
                throw new Error("second argument must be a Number");
              var d = !0,
                s,
                l,
                c,
                u,
                f;
              Array.isArray(t)
                ? ((s = []), (c = l = t.length))
                : ((u = Object.keys(t)), (s = {}), (c = l = u.length));
              var p = n;
              c
                ? u
                  ? u.some(function(e, r) {
                      if (
                        (t[e](function(t, n) {
                          a(e, t, n);
                        }),
                        r === n - 1)
                      )
                        return !0;
                    })
                  : t.some(function(e, t) {
                      if (
                        (e(function(e, n) {
                          a(t, e, n);
                        }),
                        t === n - 1)
                      )
                        return !0;
                    })
                : o(null),
                (d = !1);
            };
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      89: [
        function(e, t) {
          (function(e) {
            t.exports = function(t, n) {
              function r(t) {
                function r() {
                  n && n(t, a), (n = null);
                }
                i ? e.nextTick(r) : r();
              }
              function o(e, t, n) {
                (a[e] = n), (0 == --d || t) && r(t);
              }
              var i = !0,
                a,
                d,
                s;
              Array.isArray(t)
                ? ((a = []), (d = t.length))
                : ((s = Object.keys(t)), (a = {}), (d = s.length)),
                d
                  ? s
                    ? s.forEach(function(e) {
                        t[e](function(t, n) {
                          o(e, t, n);
                        });
                      })
                    : t.forEach(function(e, t) {
                        e(function(e, n) {
                          o(t, e, n);
                        });
                      })
                  : r(null),
                (i = !1);
            };
          }.call(this, e("_process")));
        },
        { _process: 61 }
      ],
      90: [
        function(e, t, n) {
          (function(e, r) {
            "object" == typeof n && "object" == typeof t
              ? (t.exports = r())
              : "function" == typeof l && l.amd
              ? l([], r)
              : "object" == typeof n
              ? (n.Rusha = r())
              : (e.Rusha = r());
          })("undefined" == typeof self ? this : self, function() {
            return (function(e) {
              function t(r) {
                if (n[r]) return n[r].exports;
                var o = (n[r] = { i: r, l: !1, exports: {} });
                return (
                  e[r].call(o.exports, o, o.exports, t), (o.l = !0), o.exports
                );
              }
              var n = {};
              return (
                (t.m = e),
                (t.c = n),
                (t.d = function(e, n, r) {
                  t.o(e, n) ||
                    Object.defineProperty(e, n, {
                      configurable: !1,
                      enumerable: !0,
                      get: r
                    });
                }),
                (t.n = function(e) {
                  var n =
                    e && e.__esModule
                      ? function() {
                          return e["default"];
                        }
                      : function() {
                          return e;
                        };
                  return t.d(n, "a", n), n;
                }),
                (t.o = function(e, t) {
                  return Object.prototype.hasOwnProperty.call(e, t);
                }),
                (t.p = ""),
                t((t.s = 3))
              );
            })([
              function(e, t, n) {
                function r(e, t) {
                  if (!(e instanceof t))
                    throw new TypeError("Cannot call a class as a function");
                }
                var o = n(5),
                  i = n(1),
                  a = i.toHex,
                  d = i.ceilHeapSize,
                  l = n(6),
                  c = function(e) {
                    for (e += 9; 0 < e % 64; e += 1);
                    return e;
                  },
                  u = function(e, t) {
                    var n = new Uint8Array(e.buffer),
                      r = t % 4,
                      o = t - r;
                    switch (r) {
                      case 0:
                        n[o + 3] = 0;
                      case 1:
                        n[o + 2] = 0;
                      case 2:
                        n[o + 1] = 0;
                      case 3:
                        n[o + 0] = 0;
                    }
                    for (var a = (t >> 2) + 1; a < e.length; a++) e[a] = 0;
                  },
                  f = function(e, t, n) {
                    (e[t >> 2] |= 128 << (24 - (t % 4 << 3))),
                      (e[(-16 & ((t >> 2) + 2)) + 14] = 0 | (n / 536870912)),
                      (e[(-16 & ((t >> 2) + 2)) + 15] = n << 3);
                  },
                  p = function(e, t) {
                    var n = new Int32Array(e, t + 320, 5),
                      r = new Int32Array(5),
                      o = new DataView(r.buffer);
                    return (
                      o.setInt32(0, n[0], !1),
                      o.setInt32(4, n[1], !1),
                      o.setInt32(8, n[2], !1),
                      o.setInt32(12, n[3], !1),
                      o.setInt32(16, n[4], !1),
                      r
                    );
                  },
                  h = (function() {
                    function e(t) {
                      if ((r(this, e), (t = t || 65536), 0 < t % 64))
                        throw new Error(
                          "Chunk size must be a multiple of 128 bit"
                        );
                      (this._offset = 0),
                        (this._maxChunkLen = t),
                        (this._padMaxChunkLen = c(t)),
                        (this._heap = new ArrayBuffer(
                          d(this._padMaxChunkLen + 320 + 20)
                        )),
                        (this._h32 = new Int32Array(this._heap)),
                        (this._h8 = new Int8Array(this._heap)),
                        (this._core = new o(
                          { Int32Array: Int32Array },
                          {},
                          this._heap
                        ));
                    }
                    return (
                      (e.prototype._initState = function(e, t) {
                        this._offset = 0;
                        var n = new Int32Array(e, t + 320, 5);
                        (n[0] = 1732584193),
                          (n[1] = -271733879),
                          (n[2] = -1732584194),
                          (n[3] = 271733878),
                          (n[4] = -1009589776);
                      }),
                      (e.prototype._padChunk = function(e, t) {
                        var n = c(e),
                          r = new Int32Array(this._heap, 0, n >> 2);
                        return u(r, e), f(r, e, t), n;
                      }),
                      (e.prototype._write = function(e, t, n, r) {
                        l(e, this._h8, this._h32, t, n, r || 0);
                      }),
                      (e.prototype._coreCall = function(e, t, n, r, o) {
                        var i = n;
                        this._write(e, t, n),
                          o && (i = this._padChunk(n, r)),
                          this._core.hash(i, this._padMaxChunkLen);
                      }),
                      (e.prototype.rawDigest = function(e) {
                        var t = e.byteLength || e.length || e.size || 0;
                        this._initState(this._heap, this._padMaxChunkLen);
                        var n = 0,
                          r = this._maxChunkLen;
                        for (n = 0; t > n + r; n += r)
                          this._coreCall(e, n, r, t, !1);
                        return (
                          this._coreCall(e, n, t - n, t, !0),
                          p(this._heap, this._padMaxChunkLen)
                        );
                      }),
                      (e.prototype.digest = function(e) {
                        return a(this.rawDigest(e).buffer);
                      }),
                      (e.prototype.digestFromString = function(e) {
                        return this.digest(e);
                      }),
                      (e.prototype.digestFromBuffer = function(e) {
                        return this.digest(e);
                      }),
                      (e.prototype.digestFromArrayBuffer = function(e) {
                        return this.digest(e);
                      }),
                      (e.prototype.resetState = function() {
                        return (
                          this._initState(this._heap, this._padMaxChunkLen),
                          this
                        );
                      }),
                      (e.prototype.append = function(e) {
                        var t = 0,
                          n = e.byteLength || e.length || e.size || 0,
                          r = this._offset % this._maxChunkLen,
                          o = void 0;
                        for (this._offset += n; t < n; )
                          (o = s(n - t, this._maxChunkLen - r)),
                            this._write(e, t, o, r),
                            (r += o),
                            (t += o),
                            r === this._maxChunkLen &&
                              (this._core.hash(
                                this._maxChunkLen,
                                this._padMaxChunkLen
                              ),
                              (r = 0));
                        return this;
                      }),
                      (e.prototype.getState = function() {
                        var e = this._offset % this._maxChunkLen,
                          t = void 0;
                        if (!e) {
                          var n = new Int32Array(
                            this._heap,
                            this._padMaxChunkLen + 320,
                            5
                          );
                          t = n.buffer.slice(
                            n.byteOffset,
                            n.byteOffset + n.byteLength
                          );
                        } else t = this._heap.slice(0);
                        return { offset: this._offset, heap: t };
                      }),
                      (e.prototype.setState = function(e) {
                        if (
                          ((this._offset = e.offset), 20 === e.heap.byteLength)
                        ) {
                          var t = new Int32Array(
                            this._heap,
                            this._padMaxChunkLen + 320,
                            5
                          );
                          t.set(new Int32Array(e.heap));
                        } else this._h32.set(new Int32Array(e.heap));
                        return this;
                      }),
                      (e.prototype.rawEnd = function() {
                        var e = this._offset,
                          t = e % this._maxChunkLen,
                          n = this._padChunk(t, e);
                        this._core.hash(n, this._padMaxChunkLen);
                        var r = p(this._heap, this._padMaxChunkLen);
                        return (
                          this._initState(this._heap, this._padMaxChunkLen), r
                        );
                      }),
                      (e.prototype.end = function() {
                        return a(this.rawEnd().buffer);
                      }),
                      e
                    );
                  })();
                (e.exports = h), (e.exports._core = o);
              },
              function(e) {
                for (var t = Array(256), n = 0; 256 > n; n++)
                  t[n] = (16 > n ? "0" : "") + n.toString(16);
                (e.exports.toHex = function(e) {
                  for (
                    var n = new Uint8Array(e), r = Array(e.byteLength), o = 0;
                    o < r.length;
                    o++
                  )
                    r[o] = t[n[o]];
                  return r.join("");
                }),
                  (e.exports.ceilHeapSize = function(e) {
                    var t = 0;
                    if (65536 >= e) return 65536;
                    if (16777216 > e) for (t = 1; t < e; t <<= 1);
                    else for (t = 16777216; t < e; t += 16777216);
                    return t;
                  }),
                  (e.exports.isDedicatedWorkerScope = function(e) {
                    var t =
                        "WorkerGlobalScope" in e &&
                        e instanceof e.WorkerGlobalScope,
                      n =
                        "SharedWorkerGlobalScope" in e &&
                        e instanceof e.SharedWorkerGlobalScope,
                      r =
                        "ServiceWorkerGlobalScope" in e &&
                        e instanceof e.ServiceWorkerGlobalScope;
                    return t && !n && !r;
                  });
              },
              function(e, t, n) {
                e.exports = function() {
                  var e = n(0),
                    t = function(e, t, n) {
                      try {
                        return n(null, e.digest(t));
                      } catch (t) {
                        return n(t);
                      }
                    },
                    r = function(e, t, n, o, i) {
                      var a = new self.FileReader();
                      (a.onloadend = function() {
                        if (a.error) return i(a.error);
                        var d = a.result;
                        t += a.result.byteLength;
                        try {
                          e.append(d);
                        } catch (t) {
                          return void i(t);
                        }
                        t < o.size ? r(e, t, n, o, i) : i(null, e.end());
                      }),
                        a.readAsArrayBuffer(o.slice(t, t + n));
                    },
                    o = !0;
                  return (
                    (self.onmessage = function(n) {
                      if (o) {
                        var i = n.data.data,
                          a = n.data.file,
                          d = n.data.id;
                        if ("undefined" != typeof d && (a || i)) {
                          var s = n.data.blockSize || 4194304,
                            l = new e(s);
                          l.resetState();
                          var c = function(e, t) {
                            e
                              ? self.postMessage({ id: d, error: e.name })
                              : self.postMessage({ id: d, hash: t });
                          };
                          i && t(l, i, c), a && r(l, 0, s, a, c);
                        }
                      }
                    }),
                    function() {
                      o = !1;
                    }
                  );
                };
              },
              function(e, t, n) {
                var r = n(4),
                  o = n(0),
                  i = n(7),
                  a = n(2),
                  d = n(1),
                  s = d.isDedicatedWorkerScope,
                  l = "undefined" != typeof self && s(self);
                (o.disableWorkerBehaviour = l ? a() : function() {}),
                  (o.createWorker = function() {
                    var e = r(2),
                      t = e.terminate;
                    return (
                      (e.terminate = function() {
                        URL.revokeObjectURL(e.objectURL), t.call(e);
                      }),
                      e
                    );
                  }),
                  (o.createHash = i),
                  (e.exports = o);
              },
              function(e, t, n) {
                function r(e) {
                  function t(r) {
                    if (n[r]) return n[r].exports;
                    var o = (n[r] = { i: r, l: !1, exports: {} });
                    return (
                      e[r].call(o.exports, o, o.exports, t),
                      (o.l = !0),
                      o.exports
                    );
                  }
                  var n = {};
                  (t.m = e),
                    (t.c = n),
                    (t.i = function(e) {
                      return e;
                    }),
                    (t.d = function(e, n, r) {
                      t.o(e, n) ||
                        Object.defineProperty(e, n, {
                          configurable: !1,
                          enumerable: !0,
                          get: r
                        });
                    }),
                    (t.r = function(e) {
                      Object.defineProperty(e, "__esModule", { value: !0 });
                    }),
                    (t.n = function(e) {
                      var n =
                        e && e.__esModule
                          ? function() {
                              return e["default"];
                            }
                          : function() {
                              return e;
                            };
                      return t.d(n, "a", n), n;
                    }),
                    (t.o = function(e, t) {
                      return Object.prototype.hasOwnProperty.call(e, t);
                    }),
                    (t.p = "/"),
                    (t.oe = function(e) {
                      throw (console.error(e), e);
                    });
                  var r = t((t.s = ENTRY_MODULE));
                  return r.default || r;
                }
                function o(e) {
                  return (e + "").replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
                }
                function i(e, t, r) {
                  var i = {};
                  i[r] = [];
                  var a = t.toString(),
                    d = a.match(/^function\s?\(\w+,\s*\w+,\s*(\w+)\)/);
                  if (!d) return i;
                  for (
                    var s = d[1],
                      l = new RegExp(
                        "(\\\\n|\\W)" +
                          o(s) +
                          "\\((/\\*.*?\\*/)?s?.*?([\\.|\\-|\\+|\\w|/|@]+).*?\\)",
                        "g"
                      ),
                      c;
                    (c = l.exec(a));

                  )
                    "dll-reference" !== c[3] && i[r].push(c[3]);
                  for (
                    l = new RegExp(
                      "\\(" +
                        o(s) +
                        '\\("(dll-reference\\s([\\.|\\-|\\+|\\w|/|@]+))"\\)\\)\\((/\\*.*?\\*/)?s?.*?([\\.|\\-|\\+|\\w|/|@]+).*?\\)',
                      "g"
                    );
                    (c = l.exec(a));

                  )
                    e[c[2]] || (i[r].push(c[1]), (e[c[2]] = n(c[1]).m)),
                      (i[c[2]] = i[c[2]] || []),
                      i[c[2]].push(c[4]);
                  return i;
                }
                function a(e) {
                  var t = Object.keys(e);
                  return t.reduce(function(t, n) {
                    return t || 0 < e[n].length;
                  }, !1);
                }
                function d(e, t) {
                  for (
                    var n = { main: [t] }, r = { main: [] }, o = { main: {} };
                    a(n);

                  )
                    for (var d = Object.keys(n), s = 0; s < d.length; s++) {
                      var l = d[s],
                        c = n[l],
                        u = c.pop();
                      if (((o[l] = o[l] || {}), !o[l][u] && e[l][u])) {
                        (o[l][u] = !0), (r[l] = r[l] || []), r[l].push(u);
                        for (
                          var f = i(e, e[l][u], l), p = Object.keys(f), h = 0;
                          h < p.length;
                          h++
                        )
                          (n[p[h]] = n[p[h]] || []),
                            (n[p[h]] = n[p[h]].concat(f[p[h]]));
                      }
                    }
                  return r;
                }
                e.exports = function(e, t) {
                  t = t || {};
                  var o = { main: n.m },
                    i = t.all ? { main: Object.keys(o) } : d(o, e),
                    a = "";
                  Object.keys(i)
                    .filter(function(e) {
                      return "main" !== e;
                    })
                    .forEach(function(e) {
                      for (var t = 0; i[e][t]; ) t++;
                      i[e].push(t),
                        (o[e][t] =
                          "(function(module, exports, __webpack_require__) { module.exports = __webpack_require__; })"),
                        (a =
                          a +
                          "var " +
                          e +
                          " = (" +
                          r
                            .toString()
                            .replace("ENTRY_MODULE", JSON.stringify(t)) +
                          ")({" +
                          i[e]
                            .map(function(t) {
                              return (
                                "" +
                                JSON.stringify(t) +
                                ": " +
                                o[e][t].toString()
                              );
                            })
                            .join(",") +
                          "});\n");
                    }),
                    (a =
                      a +
                      "(" +
                      r.toString().replace("ENTRY_MODULE", JSON.stringify(e)) +
                      ")({" +
                      i.main
                        .map(function(e) {
                          return (
                            "" + JSON.stringify(e) + ": " + o.main[e].toString()
                          );
                        })
                        .join(",") +
                      "})(self);");
                  var s = new window.Blob([a], { type: "text/javascript" });
                  if (t.bare) return s;
                  var l =
                      window.URL ||
                      window.webkitURL ||
                      window.mozURL ||
                      window.msURL,
                    c = l.createObjectURL(s),
                    u = new window.Worker(c);
                  return (u.objectURL = c), u;
                };
              },
              function(e) {
                e.exports = function(e, t, n) {
                  "use asm";
                  var r = new e.Int32Array(n);
                  return {
                    hash: function(e, t) {
                      (e |= 0), (t |= 0);
                      var n = 0,
                        o = 0,
                        i = 0,
                        a = 0,
                        d = 0,
                        s = 0,
                        l = 0,
                        c = 0,
                        u = 0,
                        f = 0,
                        p = 0,
                        h = 0,
                        m = 0,
                        g = 0;
                      for (
                        i = 0 | r[(t + 320) >> 2],
                          d = 0 | r[(t + 324) >> 2],
                          l = 0 | r[(t + 328) >> 2],
                          u = 0 | r[(t + 332) >> 2],
                          p = 0 | r[(t + 336) >> 2],
                          n = 0;
                        (0 | n) < (0 | e);
                        n = 0 | (n + 64)
                      ) {
                        for (
                          a = i, s = d, c = l, f = u, h = p, o = 0;
                          64 > (0 | o);
                          o = 0 | (o + 4)
                        )
                          (g = 0 | r[(n + o) >> 2]),
                            (m =
                              0 |
                              ((0 |
                                (((i << 5) | (i >>> 27)) +
                                  ((d & l) | (~d & u)))) +
                                (0 | ((0 | (g + p)) + 1518500249)))),
                            (p = u),
                            (u = l),
                            (l = (d << 30) | (d >>> 2)),
                            (d = i),
                            (i = m),
                            (r[(e + o) >> 2] = g);
                        for (
                          o = 0 | (e + 64);
                          (0 | o) < (0 | (e + 80));
                          o = 0 | (o + 4)
                        )
                          (g =
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) <<
                              1) |
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) >>>
                              31)),
                            (m =
                              0 |
                              ((0 |
                                (((i << 5) | (i >>> 27)) +
                                  ((d & l) | (~d & u)))) +
                                (0 | ((0 | (g + p)) + 1518500249)))),
                            (p = u),
                            (u = l),
                            (l = (d << 30) | (d >>> 2)),
                            (d = i),
                            (i = m),
                            (r[o >> 2] = g);
                        for (
                          o = 0 | (e + 80);
                          (0 | o) < (0 | (e + 160));
                          o = 0 | (o + 4)
                        )
                          (g =
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) <<
                              1) |
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) >>>
                              31)),
                            (m =
                              0 |
                              ((0 | (((i << 5) | (i >>> 27)) + (d ^ l ^ u))) +
                                (0 | ((0 | (g + p)) + 1859775393)))),
                            (p = u),
                            (u = l),
                            (l = (d << 30) | (d >>> 2)),
                            (d = i),
                            (i = m),
                            (r[o >> 2] = g);
                        for (
                          o = 0 | (e + 160);
                          (0 | o) < (0 | (e + 240));
                          o = 0 | (o + 4)
                        )
                          (g =
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) <<
                              1) |
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) >>>
                              31)),
                            (m =
                              0 |
                              ((0 |
                                (((i << 5) | (i >>> 27)) +
                                  ((d & l) | (d & u) | (l & u)))) +
                                (0 | ((0 | (g + p)) - 1894007588)))),
                            (p = u),
                            (u = l),
                            (l = (d << 30) | (d >>> 2)),
                            (d = i),
                            (i = m),
                            (r[o >> 2] = g);
                        for (
                          o = 0 | (e + 240);
                          (0 | o) < (0 | (e + 320));
                          o = 0 | (o + 4)
                        )
                          (g =
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) <<
                              1) |
                            ((r[(o - 12) >> 2] ^
                              r[(o - 32) >> 2] ^
                              r[(o - 56) >> 2] ^
                              r[(o - 64) >> 2]) >>>
                              31)),
                            (m =
                              0 |
                              ((0 | (((i << 5) | (i >>> 27)) + (d ^ l ^ u))) +
                                (0 | ((0 | (g + p)) - 899497514)))),
                            (p = u),
                            (u = l),
                            (l = (d << 30) | (d >>> 2)),
                            (d = i),
                            (i = m),
                            (r[o >> 2] = g);
                        (i = 0 | (i + a)),
                          (d = 0 | (d + s)),
                          (l = 0 | (l + c)),
                          (u = 0 | (u + f)),
                          (p = 0 | (p + h));
                      }
                      (r[(t + 320) >> 2] = i),
                        (r[(t + 324) >> 2] = d),
                        (r[(t + 328) >> 2] = l),
                        (r[(t + 332) >> 2] = u),
                        (r[(t + 336) >> 2] = p);
                    }
                  };
                };
              },
              function(e) {
                var t = this,
                  n = void 0;
                "undefined" != typeof self &&
                  "undefined" != typeof self.FileReaderSync &&
                  (n = new self.FileReaderSync());
                var r = function(e, t, n, r, o, a) {
                    var d = a % 4,
                      s = (o + d) % 4,
                      l = o - s,
                      c;
                    switch (d) {
                      case 0:
                        t[a] = e.charCodeAt(r + 3);
                      case 1:
                        t[0 | (a + 1 - (d << 1))] = e.charCodeAt(r + 2);
                      case 2:
                        t[0 | (a + 2 - (d << 1))] = e.charCodeAt(r + 1);
                      case 3:
                        t[0 | (a + 3 - (d << 1))] = e.charCodeAt(r);
                    }
                    if (!(o < s + (4 - d))) {
                      for (c = 4 - d; c < l; c = 0 | (c + 4))
                        n[(a + c) >> 2] =
                          (e.charCodeAt(r + c) << 24) |
                          (e.charCodeAt(r + c + 1) << 16) |
                          (e.charCodeAt(r + c + 2) << 8) |
                          e.charCodeAt(r + c + 3);
                      switch (s) {
                        case 3:
                          t[0 | (a + l + 1)] = e.charCodeAt(r + l + 2);
                        case 2:
                          t[0 | (a + l + 2)] = e.charCodeAt(r + l + 1);
                        case 1:
                          t[0 | (a + l + 3)] = e.charCodeAt(r + l);
                      }
                    }
                  },
                  o = function(e, t, n, r, o, a) {
                    var d = a % 4,
                      s = (o + d) % 4,
                      l = o - s,
                      c;
                    switch (d) {
                      case 0:
                        t[a] = e[r + 3];
                      case 1:
                        t[0 | (a + 1 - (d << 1))] = e[r + 2];
                      case 2:
                        t[0 | (a + 2 - (d << 1))] = e[r + 1];
                      case 3:
                        t[0 | (a + 3 - (d << 1))] = e[r];
                    }
                    if (!(o < s + (4 - d))) {
                      for (c = 4 - d; c < l; c = 0 | (c + 4))
                        n[0 | ((a + c) >> 2)] =
                          (e[r + c] << 24) |
                          (e[r + c + 1] << 16) |
                          (e[r + c + 2] << 8) |
                          e[r + c + 3];
                      switch (s) {
                        case 3:
                          t[0 | (a + l + 1)] = e[r + l + 2];
                        case 2:
                          t[0 | (a + l + 2)] = e[r + l + 1];
                        case 1:
                          t[0 | (a + l + 3)] = e[r + l];
                      }
                    }
                  },
                  i = function(e, t, r, o, a, d) {
                    var s = void 0,
                      l = d % 4,
                      c = (a + l) % 4,
                      u = a - c,
                      f = new Uint8Array(
                        n.readAsArrayBuffer(e.slice(o, o + a))
                      );
                    switch (l) {
                      case 0:
                        t[d] = f[3];
                      case 1:
                        t[0 | (d + 1 - (l << 1))] = f[2];
                      case 2:
                        t[0 | (d + 2 - (l << 1))] = f[1];
                      case 3:
                        t[0 | (d + 3 - (l << 1))] = f[0];
                    }
                    if (!(a < c + (4 - l))) {
                      for (s = 4 - l; s < u; s = 0 | (s + 4))
                        r[0 | ((d + s) >> 2)] =
                          (f[s] << 24) |
                          (f[s + 1] << 16) |
                          (f[s + 2] << 8) |
                          f[s + 3];
                      switch (c) {
                        case 3:
                          t[0 | (d + u + 1)] = f[u + 2];
                        case 2:
                          t[0 | (d + u + 2)] = f[u + 1];
                        case 1:
                          t[0 | (d + u + 3)] = f[u];
                      }
                    }
                  };
                e.exports = function(e, n, a, d, s, l) {
                  if ("string" == typeof e) return r(e, n, a, d, s, l);
                  if (e instanceof Array) return o(e, n, a, d, s, l);
                  if (t && t.Buffer && t.Buffer.isBuffer(e))
                    return o(e, n, a, d, s, l);
                  if (e instanceof ArrayBuffer)
                    return o(new Uint8Array(e), n, a, d, s, l);
                  if (e.buffer instanceof ArrayBuffer)
                    return o(
                      new Uint8Array(e.buffer, e.byteOffset, e.byteLength),
                      n,
                      a,
                      d,
                      s,
                      l
                    );
                  if (e instanceof Blob) return i(e, n, a, d, s, l);
                  throw new Error("Unsupported data type.");
                };
              },
              function(e, t, n) {
                function r(e, t) {
                  if (!(e instanceof t))
                    throw new TypeError("Cannot call a class as a function");
                }
                var o = n(0),
                  i = n(1),
                  a = i.toHex,
                  d = (function() {
                    function e() {
                      r(this, e),
                        (this._rusha = new o()),
                        this._rusha.resetState();
                    }
                    return (
                      (e.prototype.update = function(e) {
                        return this._rusha.append(e), this;
                      }),
                      (e.prototype.digest = function e(t) {
                        var e = this._rusha.rawEnd().buffer;
                        if (!t) return e;
                        if ("hex" === t) return a(e);
                        throw new Error("unsupported digest encoding");
                      }),
                      e
                    );
                  })();
                e.exports = function() {
                  return new d();
                };
              }
            ]);
          });
        },
        {}
      ],
      91: [
        function(e, t, n) {
          function r(e, t) {
            for (var n in e) t[n] = e[n];
          }
          function o(e, t, n) {
            return a(e, t, n);
          }
          var i = e("buffer"),
            a = i.Buffer;
          a.from && a.alloc && a.allocUnsafe && a.allocUnsafeSlow
            ? (t.exports = i)
            : (r(i, n), (n.Buffer = o)),
            (o.prototype = Object.create(a.prototype)),
            r(a, o),
            (o.from = function(e, t, n) {
              if ("number" == typeof e)
                throw new TypeError("Argument must not be a number");
              return a(e, t, n);
            }),
            (o.alloc = function(e, t, n) {
              if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
              var r = a(e);
              return (
                void 0 === t
                  ? r.fill(0)
                  : "string" == typeof n
                  ? r.fill(t, n)
                  : r.fill(t),
                r
              );
            }),
            (o.allocUnsafe = function(e) {
              if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
              return a(e);
            }),
            (o.allocUnsafeSlow = function(e) {
              if ("number" != typeof e)
                throw new TypeError("Argument must be a number");
              return i.SlowBuffer(e);
            });
        },
        { buffer: 26 }
      ],
      92: [
        function(e, t) {
          (function(e) {
            t.exports = function(t, n) {
              var r = [];
              t.on("data", function(e) {
                r.push(e);
              }),
                t.once("end", function() {
                  n && n(null, e.concat(r)), (n = null);
                }),
                t.once("error", function(e) {
                  n && n(e), (n = null);
                });
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      93: [
        function(e, t) {
          (function(n) {
            function r(e, t) {
              if (
                ((e = Object.assign(
                  { maxRedirects: 10 },
                  "string" == typeof e ? { url: e } : e
                )),
                (t = s(t)),
                e.url)
              ) {
                const {
                  hostname: t,
                  port: n,
                  protocol: r,
                  auth: o,
                  path: i
                } = c.parse(e.url);
                delete e.url,
                  t || n || r || o
                    ? Object.assign(e, {
                        hostname: t,
                        port: n,
                        protocol: r,
                        auth: o,
                        path: i
                      })
                    : (e.path = i);
              }
              const o = { "accept-encoding": "gzip, deflate" };
              e.headers &&
                Object.keys(e.headers).forEach(
                  t => (o[t.toLowerCase()] = e.headers[t])
                ),
                (e.headers = o);
              let f;
              e.body
                ? (f = e.json && !u(e.body) ? JSON.stringify(e.body) : e.body)
                : e.form &&
                  ((f =
                    "string" == typeof e.form ? e.form : l.stringify(e.form)),
                  (e.headers["content-type"] =
                    "application/x-www-form-urlencoded")),
                f &&
                  (!e.method && (e.method = "POST"),
                  !u(f) && (e.headers["content-length"] = n.byteLength(f)),
                  e.json &&
                    !e.form &&
                    (e.headers["content-type"] = "application/json")),
                delete e.body,
                delete e.form,
                e.json && (e.headers.accept = "application/json"),
                e.method && (e.method = e.method.toUpperCase());
              const p = "https:" === e.protocol ? d : a,
                h = p.request(e, n => {
                  if (
                    !1 !== e.followRedirects &&
                    300 <= n.statusCode &&
                    400 > n.statusCode &&
                    n.headers.location
                  )
                    return (
                      (e.url = n.headers.location),
                      delete e.headers.host,
                      n.resume(),
                      "POST" === e.method &&
                        [301, 302].includes(n.statusCode) &&
                        ((e.method = "GET"),
                        delete e.headers["content-length"],
                        delete e.headers["content-type"]),
                      0 == e.maxRedirects--
                        ? t(new Error("too many redirects"))
                        : r(e, t)
                    );
                  const o = "function" == typeof i && "HEAD" !== e.method;
                  t(null, o ? i(n) : n);
                });
              return (
                h.on("timeout", () => {
                  h.abort(), t(new Error("Request timed out"));
                }),
                h.on("error", t),
                u(f) ? f.on("error", t).pipe(h) : h.end(f),
                h
              );
            }
            t.exports = r;
            const o = e("simple-concat"),
              i = e("decompress-response"),
              a = e("http"),
              d = e("https"),
              s = e("once"),
              l = e("querystring"),
              c = e("url"),
              u = e =>
                null !== e &&
                "object" == typeof e &&
                "function" == typeof e.pipe;
            (r.concat = (e, t) =>
              r(e, (n, r) =>
                n
                  ? t(n)
                  : void o(r, (n, o) => {
                      if (n) return t(n);
                      if (e.json)
                        try {
                          o = JSON.parse(o.toString());
                        } catch (e) {
                          return t(e, r, o);
                        }
                      t(null, r, o);
                    })
              )),
              ["get", "post", "put", "patch", "head", "delete"].forEach(e => {
                r[e] = (t, n) => (
                  "string" == typeof t && (t = { url: t }),
                  r(Object.assign({ method: e.toUpperCase() }, t), n)
                );
              });
          }.call(this, e("buffer").Buffer));
        },
        {
          buffer: 26,
          "decompress-response": 21,
          http: 99,
          https: 36,
          once: 56,
          querystring: 66,
          "simple-concat": 92,
          url: 116
        }
      ],
      94: [
        function(e, t) {
          (function(n) {
            function r(e) {
              return e.replace(/a=ice-options:trickle\s\n/g, "");
            }
            function o(e, t) {
              var n = new Error(e);
              return (n.code = t), n;
            }
            function i(e) {
              console.warn(e);
            }
            var a = e("debug")("simple-peer"),
              d = e("get-browser-rtc"),
              s = e("randombytes"),
              l = e("readable-stream"),
              c = e("queue-microtask"),
              u = 65536;
            class f extends l.Duplex {
              constructor(e) {
                if (
                  ((e = Object.assign({ allowHalfOpen: !1 }, e)),
                  super(e),
                  (this._id = s(4)
                    .toString("hex")
                    .slice(0, 7)),
                  this._debug("new peer %o", e),
                  (this.channelName = e.initiator
                    ? e.channelName || s(20).toString("hex")
                    : null),
                  (this.initiator = e.initiator || !1),
                  (this.channelConfig = e.channelConfig || f.channelConfig),
                  (this.config = Object.assign({}, f.config, e.config)),
                  (this.offerOptions = e.offerOptions || {}),
                  (this.answerOptions = e.answerOptions || {}),
                  (this.sdpTransform = e.sdpTransform || (e => e)),
                  (this.streams = e.streams || (e.stream ? [e.stream] : [])),
                  (this.trickle = void 0 === e.trickle || e.trickle),
                  (this.allowHalfTrickle =
                    void 0 !== e.allowHalfTrickle && e.allowHalfTrickle),
                  (this.iceCompleteTimeout = e.iceCompleteTimeout || 5000),
                  (this.destroyed = !1),
                  (this._connected = !1),
                  (this.remoteAddress = void 0),
                  (this.remoteFamily = void 0),
                  (this.remotePort = void 0),
                  (this.localAddress = void 0),
                  (this.localFamily = void 0),
                  (this.localPort = void 0),
                  (this._wrtc =
                    e.wrtc && "object" == typeof e.wrtc ? e.wrtc : d()),
                  !this._wrtc)
                )
                  if ("undefined" == typeof window)
                    throw o(
                      "No WebRTC support: Specify `opts.wrtc` option in this environment",
                      "ERR_WEBRTC_SUPPORT"
                    );
                  else
                    throw o(
                      "No WebRTC support: Not a supported browser",
                      "ERR_WEBRTC_SUPPORT"
                    );
                (this._pcReady = !1),
                  (this._channelReady = !1),
                  (this._iceComplete = !1),
                  (this._iceCompleteTimer = null),
                  (this._channel = null),
                  (this._pendingCandidates = []),
                  (this._isNegotiating = !this.initiator),
                  (this._batchedNegotiation = !1),
                  (this._queuedNegotiation = !1),
                  (this._sendersAwaitingStable = []),
                  (this._senderMap = new Map()),
                  (this._firstStable = !0),
                  (this._closingInterval = null),
                  (this._remoteTracks = []),
                  (this._remoteStreams = []),
                  (this._chunk = null),
                  (this._cb = null),
                  (this._interval = null);
                try {
                  this._pc = new this._wrtc.RTCPeerConnection(this.config);
                } catch (e) {
                  return void c(() => this.destroy(o(e, "ERR_PC_CONSTRUCTOR")));
                }
                (this._isReactNativeWebrtc =
                  "number" == typeof this._pc._peerConnectionId),
                  (this._pc.oniceconnectionstatechange = () => {
                    this._onIceStateChange();
                  }),
                  (this._pc.onicegatheringstatechange = () => {
                    this._onIceStateChange();
                  }),
                  (this._pc.onconnectionstatechange = () => {
                    this._onConnectionStateChange();
                  }),
                  (this._pc.onsignalingstatechange = () => {
                    this._onSignalingStateChange();
                  }),
                  (this._pc.onicecandidate = e => {
                    this._onIceCandidate(e);
                  }),
                  this.initiator
                    ? this._setupData({
                        channel: this._pc.createDataChannel(
                          this.channelName,
                          this.channelConfig
                        )
                      })
                    : (this._pc.ondatachannel = e => {
                        this._setupData(e);
                      }),
                  this.streams &&
                    this.streams.forEach(e => {
                      this.addStream(e);
                    }),
                  (this._pc.ontrack = e => {
                    this._onTrack(e);
                  }),
                  this.initiator && this._needsNegotiation(),
                  (this._onFinishBound = () => {
                    this._onFinish();
                  }),
                  this.once("finish", this._onFinishBound);
              }
              get bufferSize() {
                return (this._channel && this._channel.bufferedAmount) || 0;
              }
              get connected() {
                return this._connected && "open" === this._channel.readyState;
              }
              address() {
                return {
                  port: this.localPort,
                  family: this.localFamily,
                  address: this.localAddress
                };
              }
              signal(e) {
                if (this.destroyed)
                  throw o(
                    "cannot signal after peer is destroyed",
                    "ERR_SIGNALING"
                  );
                if ("string" == typeof e)
                  try {
                    e = JSON.parse(e);
                  } catch (t) {
                    e = {};
                  }
                this._debug("signal()"),
                  e.renegotiate &&
                    this.initiator &&
                    (this._debug("got request to renegotiate"),
                    this._needsNegotiation()),
                  e.transceiverRequest &&
                    this.initiator &&
                    (this._debug("got request for transceiver"),
                    this.addTransceiver(
                      e.transceiverRequest.kind,
                      e.transceiverRequest.init
                    )),
                  e.candidate &&
                    (this._pc.remoteDescription &&
                    this._pc.remoteDescription.type
                      ? this._addIceCandidate(e.candidate)
                      : this._pendingCandidates.push(e.candidate)),
                  e.sdp &&
                    this._pc
                      .setRemoteDescription(
                        new this._wrtc.RTCSessionDescription(e)
                      )
                      .then(() => {
                        this.destroyed ||
                          (this._pendingCandidates.forEach(e => {
                            this._addIceCandidate(e);
                          }),
                          (this._pendingCandidates = []),
                          "offer" === this._pc.remoteDescription.type &&
                            this._createAnswer());
                      })
                      .catch(e => {
                        this.destroy(o(e, "ERR_SET_REMOTE_DESCRIPTION"));
                      }),
                  e.sdp ||
                    e.candidate ||
                    e.renegotiate ||
                    e.transceiverRequest ||
                    this.destroy(
                      o(
                        "signal() called with invalid signal data",
                        "ERR_SIGNALING"
                      )
                    );
              }
              _addIceCandidate(e) {
                var t = new this._wrtc.RTCIceCandidate(e);
                this._pc.addIceCandidate(t).catch(e => {
                  !t.address || t.address.endsWith(".local")
                    ? i("Ignoring unsupported ICE candidate.")
                    : this.destroy(o(e, "ERR_ADD_ICE_CANDIDATE"));
                });
              }
              send(e) {
                this._channel.send(e);
              }
              addTransceiver(e, t) {
                if ((this._debug("addTransceiver()"), this.initiator))
                  try {
                    this._pc.addTransceiver(e, t), this._needsNegotiation();
                  } catch (e) {
                    this.destroy(o(e, "ERR_ADD_TRANSCEIVER"));
                  }
                else
                  this.emit("signal", {
                    transceiverRequest: { kind: e, init: t }
                  });
              }
              addStream(e) {
                this._debug("addStream()"),
                  e.getTracks().forEach(t => {
                    this.addTrack(t, e);
                  });
              }
              addTrack(e, t) {
                this._debug("addTrack()");
                var n = this._senderMap.get(e) || new Map(),
                  r = n.get(t);
                if (!r)
                  (r = this._pc.addTrack(e, t)),
                    n.set(t, r),
                    this._senderMap.set(e, n),
                    this._needsNegotiation();
                else if (r.removed)
                  throw o(
                    "Track has been removed. You should enable/disable tracks that you want to re-add.",
                    "ERR_SENDER_REMOVED"
                  );
                else
                  throw o(
                    "Track has already been added to that stream.",
                    "ERR_SENDER_ALREADY_ADDED"
                  );
              }
              replaceTrack(e, t, n) {
                this._debug("replaceTrack()");
                var r = this._senderMap.get(e),
                  i = r ? r.get(n) : null;
                if (!i)
                  throw o(
                    "Cannot replace track that was never added.",
                    "ERR_TRACK_NOT_ADDED"
                  );
                t && this._senderMap.set(t, r),
                  null == i.replaceTrack
                    ? this.destroy(
                        o(
                          "replaceTrack is not supported in this browser",
                          "ERR_UNSUPPORTED_REPLACETRACK"
                        )
                      )
                    : i.replaceTrack(t);
              }
              removeTrack(e, t) {
                this._debug("removeSender()");
                var n = this._senderMap.get(e),
                  r = n ? n.get(t) : null;
                if (!r)
                  throw o(
                    "Cannot remove track that was never added.",
                    "ERR_TRACK_NOT_ADDED"
                  );
                try {
                  (r.removed = !0), this._pc.removeTrack(r);
                } catch (e) {
                  "NS_ERROR_UNEXPECTED" === e.name
                    ? this._sendersAwaitingStable.push(r)
                    : this.destroy(o(e, "ERR_REMOVE_TRACK"));
                }
                this._needsNegotiation();
              }
              removeStream(e) {
                this._debug("removeSenders()"),
                  e.getTracks().forEach(t => {
                    this.removeTrack(t, e);
                  });
              }
              _needsNegotiation() {
                this._debug("_needsNegotiation");
                this._batchedNegotiation ||
                  ((this._batchedNegotiation = !0),
                  c(() => {
                    (this._batchedNegotiation = !1),
                      this._debug("starting batched negotiation"),
                      this.negotiate();
                  }));
              }
              negotiate() {
                this.initiator
                  ? this._isNegotiating
                    ? ((this._queuedNegotiation = !0),
                      this._debug("already negotiating, queueing"))
                    : (this._debug("start negotiation"),
                      setTimeout(() => {
                        this._createOffer();
                      }, 0))
                  : !this._isNegotiating &&
                    (this._debug("requesting negotiation from initiator"),
                    this.emit("signal", { renegotiate: !0 })),
                  (this._isNegotiating = !0);
              }
              destroy(e) {
                this._destroy(e, () => {});
              }
              _destroy(e, t) {
                if (!this.destroyed) {
                  if (
                    (this._debug("destroy (error: %s)", e && (e.message || e)),
                    (this.readable = this.writable = !1),
                    this._readableState.ended || this.push(null),
                    this._writableState.finished || this.end(),
                    (this.destroyed = !0),
                    (this._connected = !1),
                    (this._pcReady = !1),
                    (this._channelReady = !1),
                    (this._remoteTracks = null),
                    (this._remoteStreams = null),
                    (this._senderMap = null),
                    clearInterval(this._closingInterval),
                    (this._closingInterval = null),
                    clearInterval(this._interval),
                    (this._interval = null),
                    (this._chunk = null),
                    (this._cb = null),
                    this._onFinishBound &&
                      this.removeListener("finish", this._onFinishBound),
                    (this._onFinishBound = null),
                    this._channel)
                  ) {
                    try {
                      this._channel.close();
                    } catch (e) {}
                    (this._channel.onmessage = null),
                      (this._channel.onopen = null),
                      (this._channel.onclose = null),
                      (this._channel.onerror = null);
                  }
                  if (this._pc) {
                    try {
                      this._pc.close();
                    } catch (e) {}
                    (this._pc.oniceconnectionstatechange = null),
                      (this._pc.onicegatheringstatechange = null),
                      (this._pc.onsignalingstatechange = null),
                      (this._pc.onicecandidate = null),
                      (this._pc.ontrack = null),
                      (this._pc.ondatachannel = null);
                  }
                  (this._pc = null),
                    (this._channel = null),
                    e && this.emit("error", e),
                    this.emit("close"),
                    t();
                }
              }
              _setupData(e) {
                if (!e.channel)
                  return this.destroy(
                    o(
                      "Data channel event is missing `channel` property",
                      "ERR_DATA_CHANNEL"
                    )
                  );
                (this._channel = e.channel),
                  (this._channel.binaryType = "arraybuffer"),
                  "number" == typeof this._channel.bufferedAmountLowThreshold &&
                    (this._channel.bufferedAmountLowThreshold = u),
                  (this.channelName = this._channel.label),
                  (this._channel.onmessage = e => {
                    this._onChannelMessage(e);
                  }),
                  (this._channel.onbufferedamountlow = () => {
                    this._onChannelBufferedAmountLow();
                  }),
                  (this._channel.onopen = () => {
                    this._onChannelOpen();
                  }),
                  (this._channel.onclose = () => {
                    this._onChannelClose();
                  }),
                  (this._channel.onerror = e => {
                    this.destroy(o(e, "ERR_DATA_CHANNEL"));
                  });
                var t = !1;
                this._closingInterval = setInterval(() => {
                  this._channel && "closing" === this._channel.readyState
                    ? (t && this._onChannelClose(), (t = !0))
                    : (t = !1);
                }, 5000);
              }
              _read() {}
              _write(e, t, n) {
                if (this.destroyed)
                  return n(
                    o(
                      "cannot write after peer is destroyed",
                      "ERR_DATA_CHANNEL"
                    )
                  );
                if (this._connected) {
                  try {
                    this.send(e);
                  } catch (e) {
                    return this.destroy(o(e, "ERR_DATA_CHANNEL"));
                  }
                  this._channel.bufferedAmount > u
                    ? (this._debug(
                        "start backpressure: bufferedAmount %d",
                        this._channel.bufferedAmount
                      ),
                      (this._cb = n))
                    : n(null);
                } else
                  this._debug("write before connect"),
                    (this._chunk = e),
                    (this._cb = n);
              }
              _onFinish() {
                if (!this.destroyed) {
                  const e = () => {
                    setTimeout(() => this.destroy(), 1e3);
                  };
                  this._connected ? e() : this.once("connect", e);
                }
              }
              _startIceCompleteTimeout() {
                this.destroyed ||
                  this._iceCompleteTimer ||
                  (this._debug("started iceComplete timeout"),
                  (this._iceCompleteTimer = setTimeout(() => {
                    this._iceComplete ||
                      ((this._iceComplete = !0),
                      this._debug("iceComplete timeout completed"),
                      this.emit("iceTimeout"),
                      this.emit("_iceComplete"));
                  }, this.iceCompleteTimeout)));
              }
              _createOffer() {
                this.destroyed ||
                  this._pc
                    .createOffer(this.offerOptions)
                    .then(e => {
                      if (this.destroyed) return;
                      this.trickle ||
                        this.allowHalfTrickle ||
                        (e.sdp = r(e.sdp)),
                        (e.sdp = this.sdpTransform(e.sdp));
                      const t = () => {
                        if (!this.destroyed) {
                          var t = this._pc.localDescription || e;
                          this._debug("signal"),
                            this.emit("signal", { type: t.type, sdp: t.sdp });
                        }
                      };
                      this._pc
                        .setLocalDescription(e)
                        .then(() => {
                          this._debug("createOffer success");
                          this.destroyed ||
                            (this.trickle || this._iceComplete
                              ? t()
                              : this.once("_iceComplete", t));
                        })
                        .catch(e => {
                          this.destroy(o(e, "ERR_SET_LOCAL_DESCRIPTION"));
                        });
                    })
                    .catch(e => {
                      this.destroy(o(e, "ERR_CREATE_OFFER"));
                    });
              }
              _requestMissingTransceivers() {
                this._pc.getTransceivers &&
                  this._pc.getTransceivers().forEach(e => {
                    e.mid ||
                      !e.sender.track ||
                      e.requested ||
                      ((e.requested = !0),
                      this.addTransceiver(e.sender.track.kind));
                  });
              }
              _createAnswer() {
                this.destroyed ||
                  this._pc
                    .createAnswer(this.answerOptions)
                    .then(e => {
                      if (this.destroyed) return;
                      this.trickle ||
                        this.allowHalfTrickle ||
                        (e.sdp = r(e.sdp)),
                        (e.sdp = this.sdpTransform(e.sdp));
                      const t = () => {
                        if (!this.destroyed) {
                          var t = this._pc.localDescription || e;
                          this._debug("signal"),
                            this.emit("signal", { type: t.type, sdp: t.sdp }),
                            this.initiator ||
                              this._requestMissingTransceivers();
                        }
                      };
                      this._pc
                        .setLocalDescription(e)
                        .then(() => {
                          this.destroyed ||
                            (this.trickle || this._iceComplete
                              ? t()
                              : this.once("_iceComplete", t));
                        })
                        .catch(e => {
                          this.destroy(o(e, "ERR_SET_LOCAL_DESCRIPTION"));
                        });
                    })
                    .catch(e => {
                      this.destroy(o(e, "ERR_CREATE_ANSWER"));
                    });
              }
              _onConnectionStateChange() {
                this.destroyed ||
                  ("failed" === this._pc.connectionState &&
                    this.destroy(
                      o("Connection failed.", "ERR_CONNECTION_FAILURE")
                    ));
              }
              _onIceStateChange() {
                if (!this.destroyed) {
                  var e = this._pc.iceConnectionState,
                    t = this._pc.iceGatheringState;
                  this._debug(
                    "iceStateChange (connection: %s) (gathering: %s)",
                    e,
                    t
                  ),
                    this.emit("iceStateChange", e, t),
                    ("connected" === e || "completed" === e) &&
                      ((this._pcReady = !0), this._maybeReady()),
                    "failed" === e &&
                      this.destroy(
                        o(
                          "Ice connection failed.",
                          "ERR_ICE_CONNECTION_FAILURE"
                        )
                      ),
                    "closed" === e &&
                      this.destroy(
                        o("Ice connection closed.", "ERR_ICE_CONNECTION_CLOSED")
                      );
                }
              }
              getStats(e) {
                const t = e => (
                  "[object Array]" ===
                    Object.prototype.toString.call(e.values) &&
                    e.values.forEach(t => {
                      Object.assign(e, t);
                    }),
                  e
                );
                0 === this._pc.getStats.length || this._isReactNativeWebrtc
                  ? this._pc.getStats().then(
                      n => {
                        var r = [];
                        n.forEach(e => {
                          r.push(t(e));
                        }),
                          e(null, r);
                      },
                      t => e(t)
                    )
                  : 0 < this._pc.getStats.length
                  ? this._pc.getStats(
                      n => {
                        if (!this.destroyed) {
                          var r = [];
                          n.result().forEach(e => {
                            var n = {};
                            e.names().forEach(t => {
                              n[t] = e.stat(t);
                            }),
                              (n.id = e.id),
                              (n.type = e.type),
                              (n.timestamp = e.timestamp),
                              r.push(t(n));
                          }),
                            e(null, r);
                        }
                      },
                      t => e(t)
                    )
                  : e(null, []);
              }
              _maybeReady() {
                if (
                  (this._debug(
                    "maybeReady pc %s channel %s",
                    this._pcReady,
                    this._channelReady
                  ),
                  this._connected ||
                    this._connecting ||
                    !this._pcReady ||
                    !this._channelReady)
                )
                  return;
                this._connecting = !0;
                const e = () => {
                  this.destroyed ||
                    this.getStats((t, n) => {
                      if (this.destroyed) return;
                      t && (n = []);
                      var r = {},
                        i = {},
                        a = {},
                        d = !1;
                      n.forEach(e => {
                        ("remotecandidate" === e.type ||
                          "remote-candidate" === e.type) &&
                          (r[e.id] = e),
                          ("localcandidate" === e.type ||
                            "local-candidate" === e.type) &&
                            (i[e.id] = e),
                          ("candidatepair" === e.type ||
                            "candidate-pair" === e.type) &&
                            (a[e.id] = e);
                      });
                      const s = e => {
                        d = !0;
                        var t = i[e.localCandidateId];
                        t && (t.ip || t.address)
                          ? ((this.localAddress = t.ip || t.address),
                            (this.localPort = +t.port))
                          : t && t.ipAddress
                          ? ((this.localAddress = t.ipAddress),
                            (this.localPort = +t.portNumber))
                          : "string" == typeof e.googLocalAddress &&
                            ((t = e.googLocalAddress.split(":")),
                            (this.localAddress = t[0]),
                            (this.localPort = +t[1])),
                          this.localAddress &&
                            (this.localFamily = this.localAddress.includes(":")
                              ? "IPv6"
                              : "IPv4");
                        var n = r[e.remoteCandidateId];
                        n && (n.ip || n.address)
                          ? ((this.remoteAddress = n.ip || n.address),
                            (this.remotePort = +n.port))
                          : n && n.ipAddress
                          ? ((this.remoteAddress = n.ipAddress),
                            (this.remotePort = +n.portNumber))
                          : "string" == typeof e.googRemoteAddress &&
                            ((n = e.googRemoteAddress.split(":")),
                            (this.remoteAddress = n[0]),
                            (this.remotePort = +n[1])),
                          this.remoteAddress &&
                            (this.remoteFamily = this.remoteAddress.includes(
                              ":"
                            )
                              ? "IPv6"
                              : "IPv4"),
                          this._debug(
                            "connect local: %s:%s remote: %s:%s",
                            this.localAddress,
                            this.localPort,
                            this.remoteAddress,
                            this.remotePort
                          );
                      };
                      if (
                        (n.forEach(e => {
                          "transport" === e.type &&
                            e.selectedCandidatePairId &&
                            s(a[e.selectedCandidatePairId]),
                            (("googCandidatePair" === e.type &&
                              "true" === e.googActiveConnection) ||
                              (("candidatepair" === e.type ||
                                "candidate-pair" === e.type) &&
                                e.selected)) &&
                              s(e);
                        }),
                        !d && (!Object.keys(a).length || Object.keys(i).length))
                      )
                        return void setTimeout(e, 100);
                      if (
                        ((this._connecting = !1),
                        (this._connected = !0),
                        this._chunk)
                      ) {
                        try {
                          this.send(this._chunk);
                        } catch (e) {
                          return this.destroy(o(e, "ERR_DATA_CHANNEL"));
                        }
                        (this._chunk = null),
                          this._debug('sent chunk from "write before connect"');
                        var l = this._cb;
                        (this._cb = null), l(null);
                      }
                      "number" !=
                        typeof this._channel.bufferedAmountLowThreshold &&
                        ((this._interval = setInterval(
                          () => this._onInterval(),
                          150
                        )),
                        this._interval.unref && this._interval.unref()),
                        this._debug("connect"),
                        this.emit("connect");
                    });
                };
                e();
              }
              _onInterval() {
                this._cb &&
                  this._channel &&
                  !(this._channel.bufferedAmount > u) &&
                  this._onChannelBufferedAmountLow();
              }
              _onSignalingStateChange() {
                this.destroyed ||
                  ("stable" === this._pc.signalingState &&
                    !this._firstStable &&
                    ((this._isNegotiating = !1),
                    this._debug(
                      "flushing sender queue",
                      this._sendersAwaitingStable
                    ),
                    this._sendersAwaitingStable.forEach(e => {
                      this._pc.removeTrack(e), (this._queuedNegotiation = !0);
                    }),
                    (this._sendersAwaitingStable = []),
                    this._queuedNegotiation &&
                      (this._debug("flushing negotiation queue"),
                      (this._queuedNegotiation = !1),
                      this._needsNegotiation()),
                    this._debug("negotiate"),
                    this.emit("negotiate")),
                  (this._firstStable = !1),
                  this._debug(
                    "signalingStateChange %s",
                    this._pc.signalingState
                  ),
                  this.emit("signalingStateChange", this._pc.signalingState));
              }
              _onIceCandidate(e) {
                this.destroyed ||
                  (e.candidate && this.trickle
                    ? this.emit("signal", {
                        candidate: {
                          candidate: e.candidate.candidate,
                          sdpMLineIndex: e.candidate.sdpMLineIndex,
                          sdpMid: e.candidate.sdpMid
                        }
                      })
                    : !e.candidate &&
                      !this._iceComplete &&
                      ((this._iceComplete = !0), this.emit("_iceComplete")),
                  e.candidate && this._startIceCompleteTimeout());
              }
              _onChannelMessage(e) {
                if (!this.destroyed) {
                  var t = e.data;
                  t instanceof ArrayBuffer && (t = n.from(t)), this.push(t);
                }
              }
              _onChannelBufferedAmountLow() {
                if (!this.destroyed && this._cb) {
                  this._debug(
                    "ending backpressure: bufferedAmount %d",
                    this._channel.bufferedAmount
                  );
                  var e = this._cb;
                  (this._cb = null), e(null);
                }
              }
              _onChannelOpen() {
                this._connected ||
                  this.destroyed ||
                  (this._debug("on channel open"),
                  (this._channelReady = !0),
                  this._maybeReady());
              }
              _onChannelClose() {
                this.destroyed ||
                  (this._debug("on channel close"), this.destroy());
              }
              _onTrack(e) {
                this.destroyed ||
                  e.streams.forEach(t => {
                    this._debug("on track"),
                      this.emit("track", e.track, t),
                      this._remoteTracks.push({ track: e.track, stream: t });
                    this._remoteStreams.some(e => e.id === t.id) ||
                      (this._remoteStreams.push(t),
                      c(() => {
                        this.emit("stream", t);
                      }));
                  });
              }
              _debug() {
                var e = [].slice.call(arguments);
                (e[0] = "[" + this._id + "] " + e[0]), a.apply(null, e);
              }
            }
            (f.WEBRTC_SUPPORT = !!d()),
              (f.config = {
                iceServers: [
                  { urls: "stun:stun.l.google.com:19302" },
                  { urls: "stun:global.stun.twilio.com:3478?transport=udp" }
                ],
                sdpSemantics: "unified-plan"
              }),
              (f.channelConfig = {}),
              (t.exports = f);
          }.call(this, e("buffer").Buffer));
        },
        {
          buffer: 26,
          debug: 30,
          "get-browser-rtc": 35,
          "queue-microtask": 67,
          randombytes: 69,
          "readable-stream": 85
        }
      ],
      95: [
        function(e, t) {
          function n(e) {
            return s.digest(e);
          }
          function r(e, t) {
            return u
              ? void ("string" == typeof e && (e = o(e)),
                u.digest({ name: "sha-1" }, e).then(
                  function(e) {
                    t(i(new Uint8Array(e)));
                  },
                  function() {
                    t(n(e));
                  }
                ))
              : void ("undefined" == typeof window
                  ? queueMicrotask(() => t(n(e)))
                  : d(e, function(r, o) {
                      return r ? void t(n(e)) : void t(o);
                    }));
          }
          function o(e) {
            for (var t = e.length, n = new Uint8Array(t), r = 0; r < t; r++)
              n[r] = e.charCodeAt(r);
            return n;
          }
          function i(e) {
            for (var t = e.length, n = [], r = 0, o; r < t; r++)
              (o = e[r]),
                n.push((o >>> 4).toString(16)),
                n.push((15 & o).toString(16));
            return n.join("");
          }
          var a = e("rusha"),
            d = e("./rusha-worker-sha1"),
            s = new a(),
            l = "undefined" == typeof window ? self : window,
            c = l.crypto || l.msCrypto || {},
            u = c.subtle || c.webkitSubtle;
          try {
            u.digest({ name: "sha-1" }, new Uint8Array()).catch(function() {
              u = !1;
            });
          } catch (e) {
            u = !1;
          }
          (t.exports = r), (t.exports.sync = n);
        },
        { "./rusha-worker-sha1": 96, rusha: 90 }
      ],
      96: [
        function(e, t) {
          function n() {
            (i = o.createWorker()),
              (a = 1),
              (d = {}),
              (i.onmessage = function(t) {
                var e = t.data.id,
                  n = d[e];
                delete d[e],
                  null == t.data.error
                    ? n(null, t.data.hash)
                    : n(new Error("Rusha worker error: " + t.data.error));
              });
          }
          function r(e, t) {
            i || n(), (d[a] = t), i.postMessage({ id: a, data: e }), (a += 1);
          }
          var o = e("rusha"),
            i,
            a,
            d;
          t.exports = r;
        },
        { rusha: 90 }
      ],
      97: [
        function(e, t) {
          (function(n) {
            const r = e("debug")("simple-websocket"),
              o = e("randombytes"),
              i = e("readable-stream"),
              a = e("queue-microtask"),
              d = e("ws"),
              s = "function" == typeof d ? d : WebSocket,
              l = 65536;
            class c extends i.Duplex {
              constructor(e = {}) {
                if (
                  ("string" == typeof e && (e = { url: e }),
                  (e = Object.assign({ allowHalfOpen: !1 }, e)),
                  super(e),
                  null == e.url && null == e.socket)
                )
                  throw new Error("Missing required `url` or `socket` option");
                if (null != e.url && null != e.socket)
                  throw new Error(
                    "Must specify either `url` or `socket` option, not both"
                  );
                if (
                  ((this._id = o(4)
                    .toString("hex")
                    .slice(0, 7)),
                  this._debug("new websocket: %o", e),
                  (this.connected = !1),
                  (this.destroyed = !1),
                  (this._chunk = null),
                  (this._cb = null),
                  (this._interval = null),
                  e.socket)
                )
                  (this.url = e.socket.url),
                    (this._ws = e.socket),
                    (this.connected = e.socket.readyState === s.OPEN);
                else {
                  this.url = e.url;
                  try {
                    this._ws =
                      "function" == typeof d ? new s(e.url, e) : new s(e.url);
                  } catch (e) {
                    return void a(() => this.destroy(e));
                  }
                }
                (this._ws.binaryType = "arraybuffer"),
                  (this._ws.onopen = () => {
                    this._onOpen();
                  }),
                  (this._ws.onmessage = e => {
                    this._onMessage(e);
                  }),
                  (this._ws.onclose = () => {
                    this._onClose();
                  }),
                  (this._ws.onerror = () => {
                    this.destroy(new Error("connection error to " + this.url));
                  }),
                  (this._onFinishBound = () => {
                    this._onFinish();
                  }),
                  this.once("finish", this._onFinishBound);
              }
              send(e) {
                this._ws.send(e);
              }
              destroy(e) {
                this._destroy(e, () => {});
              }
              _destroy(e, t) {
                if (!this.destroyed) {
                  if (
                    (this._debug("destroy (error: %s)", e && (e.message || e)),
                    (this.readable = this.writable = !1),
                    this._readableState.ended || this.push(null),
                    this._writableState.finished || this.end(),
                    (this.connected = !1),
                    (this.destroyed = !0),
                    clearInterval(this._interval),
                    (this._interval = null),
                    (this._chunk = null),
                    (this._cb = null),
                    this._onFinishBound &&
                      this.removeListener("finish", this._onFinishBound),
                    (this._onFinishBound = null),
                    this._ws)
                  ) {
                    const e = this._ws,
                      t = () => {
                        e.onclose = null;
                      };
                    if (e.readyState === s.CLOSED) t();
                    else
                      try {
                        (e.onclose = t), e.close();
                      } catch (e) {
                        t();
                      }
                    (e.onopen = null),
                      (e.onmessage = null),
                      (e.onerror = () => {});
                  }
                  if (((this._ws = null), e)) {
                    if (
                      "undefined" != typeof DOMException &&
                      e instanceof DOMException
                    ) {
                      const t = e.code;
                      (e = new Error(e.message)), (e.code = t);
                    }
                    this.emit("error", e);
                  }
                  this.emit("close"), t();
                }
              }
              _read() {}
              _write(e, t, n) {
                if (this.destroyed)
                  return n(new Error("cannot write after socket is destroyed"));
                if (this.connected) {
                  try {
                    this.send(e);
                  } catch (e) {
                    return this.destroy(e);
                  }
                  "function" != typeof d && this._ws.bufferedAmount > l
                    ? (this._debug(
                        "start backpressure: bufferedAmount %d",
                        this._ws.bufferedAmount
                      ),
                      (this._cb = n))
                    : n(null);
                } else
                  this._debug("write before connect"),
                    (this._chunk = e),
                    (this._cb = n);
              }
              _onFinish() {
                if (!this.destroyed) {
                  const e = () => {
                    setTimeout(() => this.destroy(), 1e3);
                  };
                  this.connected ? e() : this.once("connect", e);
                }
              }
              _onMessage(e) {
                if (this.destroyed) return;
                let t = e.data;
                t instanceof ArrayBuffer && (t = n.from(t)), this.push(t);
              }
              _onOpen() {
                if (!(this.connected || this.destroyed)) {
                  if (((this.connected = !0), this._chunk)) {
                    try {
                      this.send(this._chunk);
                    } catch (e) {
                      return this.destroy(e);
                    }
                    (this._chunk = null),
                      this._debug('sent chunk from "write before connect"');
                    const e = this._cb;
                    (this._cb = null), e(null);
                  }
                  "function" != typeof d &&
                    ((this._interval = setInterval(
                      () => this._onInterval(),
                      150
                    )),
                    this._interval.unref && this._interval.unref()),
                    this._debug("connect"),
                    this.emit("connect");
                }
              }
              _onInterval() {
                if (this._cb && this._ws && !(this._ws.bufferedAmount > l)) {
                  this._debug(
                    "ending backpressure: bufferedAmount %d",
                    this._ws.bufferedAmount
                  );
                  const e = this._cb;
                  (this._cb = null), e(null);
                }
              }
              _onClose() {
                this.destroyed || (this._debug("on close"), this.destroy());
              }
              _debug() {
                const e = [].slice.call(arguments);
                (e[0] = "[" + this._id + "] " + e[0]), r.apply(null, e);
              }
            }
            (c.WEBSOCKET_SUPPORT = !!s), (t.exports = c);
          }.call(this, e("buffer").Buffer));
        },
        {
          buffer: 26,
          debug: 30,
          "queue-microtask": 67,
          randombytes: 69,
          "readable-stream": 85,
          ws: 21
        }
      ],
      98: [
        function(e, t) {
          var n = 1,
            r = 65535,
            o = 4,
            i = function() {
              n = (n + 1) & r;
            },
            a;
          t.exports = function(e) {
            a || ((a = setInterval(i, 0 | (1e3 / o))), a.unref && a.unref());
            var t = o * (e || 5),
              d = [0],
              s = 1,
              l = (n - 1) & r;
            return function(e) {
              var i = (n - l) & r;
              for (i > t && (i = t), l = n; i--; )
                s === t && (s = 0), (d[s] = d[0 === s ? t - 1 : s - 1]), s++;
              e && (d[s - 1] += e);
              var a = d[s - 1],
                c = d.length < t ? 0 : d[s === t ? 0 : s];
              return d.length < o ? a : ((a - c) * o) / d.length;
            };
          };
        },
        {}
      ],
      99: [
        function(e, t, n) {
          (function(t) {
            var r = e("./lib/request"),
              o = e("./lib/response"),
              i = e("xtend"),
              a = e("builtin-status-codes"),
              d = e("url"),
              s = n;
            (s.request = function(e, n) {
              e = "string" == typeof e ? d.parse(e) : i(e);
              var o =
                  -1 === t.location.protocol.search(/^https?:$/) ? "http:" : "",
                a = e.protocol || o,
                s = e.hostname || e.host,
                l = e.port,
                c = e.path || "/";
              s && -1 !== s.indexOf(":") && (s = "[" + s + "]"),
                (e.url = (s ? a + "//" + s : "") + (l ? ":" + l : "") + c),
                (e.method = (e.method || "GET").toUpperCase()),
                (e.headers = e.headers || {});
              var u = new r(e);
              return n && u.on("response", n), u;
            }),
              (s.get = function(e, t) {
                var n = s.request(e, t);
                return n.end(), n;
              }),
              (s.ClientRequest = r),
              (s.IncomingMessage = o.IncomingMessage),
              (s.Agent = function() {}),
              (s.Agent.defaultMaxSockets = 4),
              (s.globalAgent = new s.Agent()),
              (s.STATUS_CODES = a),
              (s.METHODS = [
                "CHECKOUT",
                "CONNECT",
                "COPY",
                "DELETE",
                "GET",
                "HEAD",
                "LOCK",
                "M-SEARCH",
                "MERGE",
                "MKACTIVITY",
                "MKCOL",
                "MOVE",
                "NOTIFY",
                "OPTIONS",
                "PATCH",
                "POST",
                "PROPFIND",
                "PROPPATCH",
                "PURGE",
                "PUT",
                "REPORT",
                "SEARCH",
                "SUBSCRIBE",
                "TRACE",
                "UNLOCK",
                "UNSUBSCRIBE"
              ]);
          }.call(
            this,
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {
          "./lib/request": 101,
          "./lib/response": 102,
          "builtin-status-codes": 27,
          url: 116,
          xtend: 123
        }
      ],
      100: [
        function(e, t, n) {
          (function(e) {
            function t() {
              if (i !== void 0) return i;
              if (e.XMLHttpRequest) {
                i = new e.XMLHttpRequest();
                try {
                  i.open("GET", e.XDomainRequest ? "/" : "https://example.com");
                } catch (t) {
                  i = null;
                }
              } else i = null;
              return i;
            }
            function r(e) {
              var n = t();
              if (!n) return !1;
              try {
                return (n.responseType = e), n.responseType === e;
              } catch (t) {}
              return !1;
            }
            function o(e) {
              return "function" == typeof e;
            }
            (n.fetch = o(e.fetch) && o(e.ReadableStream)),
              (n.writableStream = o(e.WritableStream)),
              (n.abortController = o(e.AbortController));
            var i;
            (n.arraybuffer = n.fetch || r("arraybuffer")),
              (n.msstream = !n.fetch && r("ms-stream")),
              (n.mozchunkedarraybuffer =
                !n.fetch && r("moz-chunked-arraybuffer")),
              (n.overrideMimeType =
                n.fetch || (!!t() && o(t().overrideMimeType))),
              (i = null);
          }.call(
            this,
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {}
      ],
      101: [
        function(e, t) {
          (function(n, r, o) {
            function i(e, t) {
              return d.fetch && t
                ? "fetch"
                : d.mozchunkedarraybuffer
                ? "moz-chunked-arraybuffer"
                : d.msstream
                ? "ms-stream"
                : d.arraybuffer && e
                ? "arraybuffer"
                : "text";
            }
            function a(e) {
              try {
                var t = e.status;
                return null !== t && 0 !== t;
              } catch (t) {
                return !1;
              }
            }
            var d = e("./capability"),
              s = e("inherits"),
              l = e("./response"),
              c = e("readable-stream"),
              u = l.IncomingMessage,
              f = l.readyStates,
              p = (t.exports = function(e) {
                var t = this;
                c.Writable.call(t),
                  (t._opts = e),
                  (t._body = []),
                  (t._headers = {}),
                  e.auth &&
                    t.setHeader(
                      "Authorization",
                      "Basic " + o.from(e.auth).toString("base64")
                    ),
                  Object.keys(e.headers).forEach(function(n) {
                    t.setHeader(n, e.headers[n]);
                  });
                var n = !0,
                  r;
                if (
                  "disable-fetch" === e.mode ||
                  ("requestTimeout" in e && !d.abortController)
                )
                  (n = !1), (r = !0);
                else if ("prefer-streaming" === e.mode) r = !1;
                else if ("allow-wrong-content-type" === e.mode)
                  r = !d.overrideMimeType;
                else if (
                  !e.mode ||
                  "default" === e.mode ||
                  "prefer-fast" === e.mode
                )
                  r = !0;
                else throw new Error("Invalid value for opts.mode");
                (t._mode = i(r, n)),
                  (t._fetchTimer = null),
                  t.on("finish", function() {
                    t._onFinish();
                  });
              });
            s(p, c.Writable),
              (p.prototype.setHeader = function(e, t) {
                var n = this,
                  r = e.toLowerCase();
                -1 !== h.indexOf(r) || (n._headers[r] = { name: e, value: t });
              }),
              (p.prototype.getHeader = function(e) {
                var t = this._headers[e.toLowerCase()];
                return t ? t.value : null;
              }),
              (p.prototype.removeHeader = function(e) {
                var t = this;
                delete t._headers[e.toLowerCase()];
              }),
              (p.prototype._onFinish = function() {
                var e = this;
                if (!e._destroyed) {
                  var t = e._opts,
                    o = e._headers,
                    i = null;
                  "GET" !== t.method &&
                    "HEAD" !== t.method &&
                    (i = new Blob(e._body, {
                      type: (o["content-type"] || {}).value || ""
                    }));
                  var a = [];
                  if (
                    (Object.keys(o).forEach(function(e) {
                      var t = o[e].name,
                        n = o[e].value;
                      Array.isArray(n)
                        ? n.forEach(function(e) {
                            a.push([t, e]);
                          })
                        : a.push([t, n]);
                    }),
                    "fetch" === e._mode)
                  ) {
                    var s = null;
                    if (d.abortController) {
                      var l = new AbortController();
                      (s = l.signal),
                        (e._fetchAbortController = l),
                        "requestTimeout" in t &&
                          0 !== t.requestTimeout &&
                          (e._fetchTimer = r.setTimeout(function() {
                            e.emit("requestTimeout"),
                              e._fetchAbortController &&
                                e._fetchAbortController.abort();
                          }, t.requestTimeout));
                    }
                    r.fetch(e._opts.url, {
                      method: e._opts.method,
                      headers: a,
                      body: i || void 0,
                      mode: "cors",
                      credentials: t.withCredentials
                        ? "include"
                        : "same-origin",
                      signal: s
                    }).then(
                      function(t) {
                        (e._fetchResponse = t), e._connect();
                      },
                      function(t) {
                        r.clearTimeout(e._fetchTimer),
                          e._destroyed || e.emit("error", t);
                      }
                    );
                  } else {
                    var c = (e._xhr = new r.XMLHttpRequest());
                    try {
                      c.open(e._opts.method, e._opts.url, !0);
                    } catch (t) {
                      return void n.nextTick(function() {
                        e.emit("error", t);
                      });
                    }
                    "responseType" in c && (c.responseType = e._mode),
                      "withCredentials" in c &&
                        (c.withCredentials = !!t.withCredentials),
                      "text" === e._mode &&
                        "overrideMimeType" in c &&
                        c.overrideMimeType(
                          "text/plain; charset=x-user-defined"
                        ),
                      "requestTimeout" in t &&
                        ((c.timeout = t.requestTimeout),
                        (c.ontimeout = function() {
                          e.emit("requestTimeout");
                        })),
                      a.forEach(function(e) {
                        c.setRequestHeader(e[0], e[1]);
                      }),
                      (e._response = null),
                      (c.onreadystatechange = function() {
                        switch (c.readyState) {
                          case f.LOADING:
                          case f.DONE:
                            e._onXHRProgress();
                        }
                      }),
                      "moz-chunked-arraybuffer" === e._mode &&
                        (c.onprogress = function() {
                          e._onXHRProgress();
                        }),
                      (c.onerror = function() {
                        e._destroyed || e.emit("error", new Error("XHR error"));
                      });
                    try {
                      c.send(i);
                    } catch (t) {
                      return void n.nextTick(function() {
                        e.emit("error", t);
                      });
                    }
                  }
                }
              }),
              (p.prototype._onXHRProgress = function() {
                var e = this;
                !a(e._xhr) ||
                  e._destroyed ||
                  (!e._response && e._connect(), e._response._onXHRProgress());
              }),
              (p.prototype._connect = function() {
                var e = this;
                e._destroyed ||
                  ((e._response = new u(
                    e._xhr,
                    e._fetchResponse,
                    e._mode,
                    e._fetchTimer
                  )),
                  e._response.on("error", function(t) {
                    e.emit("error", t);
                  }),
                  e.emit("response", e._response));
              }),
              (p.prototype._write = function(e, t, n) {
                var r = this;
                r._body.push(e), n();
              }),
              (p.prototype.abort = p.prototype.destroy = function() {
                var e = this;
                (e._destroyed = !0),
                  r.clearTimeout(e._fetchTimer),
                  e._response && (e._response._destroyed = !0),
                  e._xhr
                    ? e._xhr.abort()
                    : e._fetchAbortController &&
                      e._fetchAbortController.abort();
              }),
              (p.prototype.end = function(e, t, n) {
                var r = this;
                "function" == typeof e && ((n = e), (e = void 0)),
                  c.Writable.prototype.end.call(r, e, t, n);
              }),
              (p.prototype.flushHeaders = function() {}),
              (p.prototype.setTimeout = function() {}),
              (p.prototype.setNoDelay = function() {}),
              (p.prototype.setSocketKeepAlive = function() {});
            var h = [
              "accept-charset",
              "accept-encoding",
              "access-control-request-headers",
              "access-control-request-method",
              "connection",
              "content-length",
              "cookie",
              "cookie2",
              "date",
              "dnt",
              "expect",
              "host",
              "keep-alive",
              "origin",
              "referer",
              "te",
              "trailer",
              "transfer-encoding",
              "upgrade",
              "via"
            ];
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global,
            e("buffer").Buffer
          ));
        },
        {
          "./capability": 100,
          "./response": 102,
          _process: 61,
          buffer: 26,
          inherits: 39,
          "readable-stream": 85
        }
      ],
      102: [
        function(e, t, n) {
          (function(t, r, o) {
            var i = e("./capability"),
              a = e("inherits"),
              d = e("readable-stream"),
              s = (n.readyStates = {
                UNSENT: 0,
                OPENED: 1,
                HEADERS_RECEIVED: 2,
                LOADING: 3,
                DONE: 4
              }),
              l = (n.IncomingMessage = function(e, n, a, s) {
                var l = this;
                if (
                  (d.Readable.call(l),
                  (l._mode = a),
                  (l.headers = {}),
                  (l.rawHeaders = []),
                  (l.trailers = {}),
                  (l.rawTrailers = []),
                  l.on("end", function() {
                    t.nextTick(function() {
                      l.emit("close");
                    });
                  }),
                  "fetch" === a)
                ) {
                  function e() {
                    u.read()
                      .then(function(t) {
                        return l._destroyed
                          ? void 0
                          : t.done
                          ? (r.clearTimeout(s), void l.push(null))
                          : void (l.push(o.from(t.value)), e());
                      })
                      .catch(function(e) {
                        r.clearTimeout(s), l._destroyed || l.emit("error", e);
                      });
                  }
                  if (
                    ((l._fetchResponse = n),
                    (l.url = n.url),
                    (l.statusCode = n.status),
                    (l.statusMessage = n.statusText),
                    n.headers.forEach(function(e, t) {
                      (l.headers[t.toLowerCase()] = e), l.rawHeaders.push(t, e);
                    }),
                    i.writableStream)
                  ) {
                    var c = new WritableStream({
                      write: function(e) {
                        return new Promise(function(t, n) {
                          l._destroyed
                            ? n()
                            : l.push(o.from(e))
                            ? t()
                            : (l._resumeFetch = t);
                        });
                      },
                      close: function() {
                        r.clearTimeout(s), l._destroyed || l.push(null);
                      },
                      abort: function(e) {
                        l._destroyed || l.emit("error", e);
                      }
                    });
                    try {
                      return void n.body.pipeTo(c).catch(function(e) {
                        r.clearTimeout(s), l._destroyed || l.emit("error", e);
                      });
                    } catch (t) {}
                  }
                  var u = n.body.getReader();
                  e();
                } else {
                  (l._xhr = e),
                    (l._pos = 0),
                    (l.url = e.responseURL),
                    (l.statusCode = e.status),
                    (l.statusMessage = e.statusText);
                  var f = e.getAllResponseHeaders().split(/\r?\n/);
                  if (
                    (f.forEach(function(e) {
                      var t = e.match(/^([^:]+):\s*(.*)/);
                      if (t) {
                        var n = t[1].toLowerCase();
                        "set-cookie" === n
                          ? (void 0 === l.headers[n] && (l.headers[n] = []),
                            l.headers[n].push(t[2]))
                          : void 0 === l.headers[n]
                          ? (l.headers[n] = t[2])
                          : (l.headers[n] += ", " + t[2]),
                          l.rawHeaders.push(t[1], t[2]);
                      }
                    }),
                    (l._charset = "x-user-defined"),
                    !i.overrideMimeType)
                  ) {
                    var p = l.rawHeaders["mime-type"];
                    if (p) {
                      var h = p.match(/;\s*charset=([^;])(;|$)/);
                      h && (l._charset = h[1].toLowerCase());
                    }
                    l._charset || (l._charset = "utf-8");
                  }
                }
              });
            a(l, d.Readable),
              (l.prototype._read = function() {
                var e = this,
                  t = e._resumeFetch;
                t && ((e._resumeFetch = null), t());
              }),
              (l.prototype._onXHRProgress = function() {
                var e = this,
                  t = e._xhr,
                  n = null;
                switch (e._mode) {
                  case "text":
                    if (((n = t.responseText), n.length > e._pos)) {
                      var a = n.substr(e._pos);
                      if ("x-user-defined" === e._charset) {
                        for (
                          var d = o.alloc(a.length), l = 0;
                          l < a.length;
                          l++
                        )
                          d[l] = 255 & a.charCodeAt(l);
                        e.push(d);
                      } else e.push(a, e._charset);
                      e._pos = n.length;
                    }
                    break;
                  case "arraybuffer":
                    if (t.readyState !== s.DONE || !t.response) break;
                    (n = t.response), e.push(o.from(new Uint8Array(n)));
                    break;
                  case "moz-chunked-arraybuffer":
                    if (((n = t.response), t.readyState !== s.LOADING || !n))
                      break;
                    e.push(o.from(new Uint8Array(n)));
                    break;
                  case "ms-stream":
                    if (((n = t.response), t.readyState !== s.LOADING)) break;
                    var c = new r.MSStreamReader();
                    (c.onprogress = function() {
                      c.result.byteLength > e._pos &&
                        (e.push(o.from(new Uint8Array(c.result.slice(e._pos)))),
                        (e._pos = c.result.byteLength));
                    }),
                      (c.onload = function() {
                        e.push(null);
                      }),
                      c.readAsArrayBuffer(n);
                }
                e._xhr.readyState === s.DONE &&
                  "ms-stream" !== e._mode &&
                  e.push(null);
              });
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global,
            e("buffer").Buffer
          ));
        },
        {
          "./capability": 100,
          _process: 61,
          buffer: 26,
          inherits: 39,
          "readable-stream": 85
        }
      ],
      103: [
        function(e, t) {
          t.exports = async function(e, t) {
            const r = await n(e, t),
              o = URL.createObjectURL(r);
            return o;
          };
          const n = e("stream-to-blob");
        },
        { "stream-to-blob": 104 }
      ],
      104: [
        function(e, t) {
          t.exports = function(e, t) {
            if (null != t && "string" != typeof t)
              throw new Error("Invalid mimetype, expected string.");
            return new Promise((n, r) => {
              const o = [];
              e.on("data", e => o.push(e))
                .once("end", () => {
                  const e = null == t ? new Blob(o) : new Blob(o, { type: t });
                  n(e);
                })
                .once("error", r);
            });
          };
        },
        {}
      ],
      105: [
        function(e, t) {
          (function(n) {
            var r = e("once");
            t.exports = function(e, t, o) {
              o = r(o);
              var i = n.alloc(t),
                a = 0;
              e.on("data", function(e) {
                e.copy(i, a), (a += e.length);
              })
                .on("end", function() {
                  o(null, i);
                })
                .on("error", o);
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26, once: 56 }
      ],
      106: [
        function(e, t, n) {
          "use strict";
          function r(e) {
            if (!e) return "utf8";
            for (var t; ; )
              switch (e) {
                case "utf8":
                case "utf-8":
                  return "utf8";
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                  return "utf16le";
                case "latin1":
                case "binary":
                  return "latin1";
                case "base64":
                case "ascii":
                case "hex":
                  return e;
                default:
                  if (t) return;
                  (e = ("" + e).toLowerCase()), (t = !0);
              }
          }
          function o(e) {
            var t = r(e);
            if ("string" != typeof t && (g.isEncoding === _ || !_(e)))
              throw new Error("Unknown encoding: " + e);
            return t || e;
          }
          function i(e) {
            this.encoding = o(e);
            var t;
            switch (this.encoding) {
              case "utf16le":
                (this.text = c), (this.end = u), (t = 4);
                break;
              case "utf8":
                (this.fillLast = l), (t = 4);
                break;
              case "base64":
                (this.text = f), (this.end = p), (t = 3);
                break;
              default:
                return (this.write = h), void (this.end = m);
            }
            (this.lastNeed = 0),
              (this.lastTotal = 0),
              (this.lastChar = g.allocUnsafe(t));
          }
          function a(e) {
            if (127 >= e) return 0;
            return 6 == e >> 5
              ? 2
              : 14 == e >> 4
              ? 3
              : 30 == e >> 3
              ? 4
              : 2 == e >> 6
              ? -1
              : -2;
          }
          function d(e, t, n) {
            var r = t.length - 1;
            if (r < n) return 0;
            var o = a(t[r]);
            return 0 <= o
              ? (0 < o && (e.lastNeed = o - 1), o)
              : --r < n || -2 === o
              ? 0
              : ((o = a(t[r])), 0 <= o)
              ? (0 < o && (e.lastNeed = o - 2), o)
              : --r < n || -2 === o
              ? 0
              : ((o = a(t[r])),
                0 <= o
                  ? (0 < o && (2 === o ? (o = 0) : (e.lastNeed = o - 3)), o)
                  : 0);
          }
          function s(e, t) {
            if (128 != (192 & t[0])) return (e.lastNeed = 0), "\uFFFD";
            if (1 < e.lastNeed && 1 < t.length) {
              if (128 != (192 & t[1])) return (e.lastNeed = 1), "\uFFFD";
              if (2 < e.lastNeed && 2 < t.length && 128 != (192 & t[2]))
                return (e.lastNeed = 2), "\uFFFD";
            }
          }
          function l(e) {
            var t = this.lastTotal - this.lastNeed,
              n = s(this, e, t);
            return void 0 === n
              ? this.lastNeed <= e.length
                ? (e.copy(this.lastChar, t, 0, this.lastNeed),
                  this.lastChar.toString(this.encoding, 0, this.lastTotal))
                : void (e.copy(this.lastChar, t, 0, e.length),
                  (this.lastNeed -= e.length))
              : n;
          }
          function c(e, t) {
            if (0 == (e.length - t) % 2) {
              var n = e.toString("utf16le", t);
              if (n) {
                var r = n.charCodeAt(n.length - 1);
                if (55296 <= r && 56319 >= r)
                  return (
                    (this.lastNeed = 2),
                    (this.lastTotal = 4),
                    (this.lastChar[0] = e[e.length - 2]),
                    (this.lastChar[1] = e[e.length - 1]),
                    n.slice(0, -1)
                  );
              }
              return n;
            }
            return (
              (this.lastNeed = 1),
              (this.lastTotal = 2),
              (this.lastChar[0] = e[e.length - 1]),
              e.toString("utf16le", t, e.length - 1)
            );
          }
          function u(e) {
            var t = e && e.length ? this.write(e) : "";
            if (this.lastNeed) {
              var n = this.lastTotal - this.lastNeed;
              return t + this.lastChar.toString("utf16le", 0, n);
            }
            return t;
          }
          function f(e, t) {
            var r = (e.length - t) % 3;
            return 0 == r
              ? e.toString("base64", t)
              : ((this.lastNeed = 3 - r),
                (this.lastTotal = 3),
                1 == r
                  ? (this.lastChar[0] = e[e.length - 1])
                  : ((this.lastChar[0] = e[e.length - 2]),
                    (this.lastChar[1] = e[e.length - 1])),
                e.toString("base64", t, e.length - r));
          }
          function p(e) {
            var t = e && e.length ? this.write(e) : "";
            return this.lastNeed
              ? t + this.lastChar.toString("base64", 0, 3 - this.lastNeed)
              : t;
          }
          function h(e) {
            return e.toString(this.encoding);
          }
          function m(e) {
            return e && e.length ? this.write(e) : "";
          }
          var g = e("safe-buffer").Buffer,
            _ =
              g.isEncoding ||
              function(e) {
                switch (((e = "" + e), e && e.toLowerCase())) {
                  case "hex":
                  case "utf8":
                  case "utf-8":
                  case "ascii":
                  case "binary":
                  case "base64":
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                  case "raw":
                    return !0;
                  default:
                    return !1;
                }
              };
          (n.StringDecoder = i),
            (i.prototype.write = function(e) {
              if (0 === e.length) return "";
              var t, n;
              if (this.lastNeed) {
                if (((t = this.fillLast(e)), void 0 === t)) return "";
                (n = this.lastNeed), (this.lastNeed = 0);
              } else n = 0;
              return n < e.length
                ? t
                  ? t + this.text(e, n)
                  : this.text(e, n)
                : t || "";
            }),
            (i.prototype.end = function(e) {
              var t = e && e.length ? this.write(e) : "";
              return this.lastNeed ? t + "\uFFFD" : t;
            }),
            (i.prototype.text = function(e, t) {
              var n = d(this, e, t);
              if (!this.lastNeed) return e.toString("utf8", t);
              this.lastTotal = n;
              var r = e.length - (n - this.lastNeed);
              return e.copy(this.lastChar, 0, r), e.toString("utf8", t, r);
            }),
            (i.prototype.fillLast = function(e) {
              return this.lastNeed <= e.length
                ? (e.copy(
                    this.lastChar,
                    this.lastTotal - this.lastNeed,
                    0,
                    this.lastNeed
                  ),
                  this.lastChar.toString(this.encoding, 0, this.lastTotal))
                : void (e.copy(
                    this.lastChar,
                    this.lastTotal - this.lastNeed,
                    0,
                    e.length
                  ),
                  (this.lastNeed -= e.length));
            });
        },
        { "safe-buffer": 91 }
      ],
      107: [
        function(e, t, n) {
          var r = e("./thirty-two");
          (n.encode = r.encode), (n.decode = r.decode);
        },
        { "./thirty-two": 108 }
      ],
      108: [
        function(e, t, n) {
          (function(e) {
            "use strict";
            function t(e) {
              var t = r(e.length / 5);
              return 0 == e.length % 5 ? t : t + 1;
            }
            var o = [
              255,
              255,
              26,
              27,
              28,
              29,
              30,
              31,
              255,
              255,
              255,
              255,
              255,
              255,
              255,
              255,
              255,
              0,
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23,
              24,
              25,
              255,
              255,
              255,
              255,
              255,
              255,
              0,
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23,
              24,
              25,
              255,
              255,
              255,
              255,
              255
            ];
            (n.encode = function(n) {
              e.isBuffer(n) || (n = new e(n));
              for (
                var r = 0, o = 0, a = 0, d = 0, s = new e(8 * t(n));
                r < n.length;

              ) {
                var l = n[r];
                3 < a
                  ? ((d = l & (255 >> a)),
                    (a = (a + 5) % 8),
                    (d =
                      (d << a) |
                      ((r + 1 < n.length ? n[r + 1] : 0) >> (8 - a))),
                    r++)
                  : ((d = 31 & (l >> (8 - (a + 5)))),
                    (a = (a + 5) % 8),
                    0 === a && r++),
                  (s[o] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".charCodeAt(d)),
                  o++;
              }
              for (r = o; r < s.length; r++) s[r] = 61;
              return s;
            }),
              (n.decode = function(t) {
                var n = 0,
                  r = 0,
                  d = 0,
                  s;
                e.isBuffer(t) || (t = new e(t));
                for (
                  var l = new e(a((5 * t.length) / 8)), c = 0;
                  c < t.length && !(61 === t[c]);
                  c++
                ) {
                  var u = t[c] - 48;
                  if (u < o.length)
                    (r = o[u]),
                      3 >= n
                        ? ((n = (n + 5) % 8),
                          0 === n
                            ? ((s |= r), (l[d] = s), d++, (s = 0))
                            : (s |= 255 & (r << (8 - n))))
                        : ((n = (n + 5) % 8),
                          (s |= 255 & (r >>> n)),
                          (l[d] = s),
                          d++,
                          (s = 255 & (r << (8 - n))));
                  else
                    throw new Error(
                      "Invalid input - it is not base32 encoded string"
                    );
                }
                return l.slice(0, d);
              });
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      109: [
        function(e, t) {
          var n = e("buffer").Buffer;
          t.exports = function(e) {
            if (e instanceof Uint8Array) {
              if (0 === e.byteOffset && e.byteLength === e.buffer.byteLength)
                return e.buffer;
              if ("function" == typeof e.buffer.slice)
                return e.buffer.slice(
                  e.byteOffset,
                  e.byteOffset + e.byteLength
                );
            }
            if (n.isBuffer(e)) {
              for (
                var t = new Uint8Array(e.length), r = e.length, o = 0;
                o < r;
                o++
              )
                t[o] = e[o];
              return t.buffer;
            }
            throw new Error("Argument must be a Buffer");
          };
        },
        { buffer: 26 }
      ],
      110: [
        function(e, t) {
          (function(n) {
            const o = e("debug")("torrent-discovery"),
              i = e("bittorrent-dht/client"),
              a = e("events").EventEmitter,
              d = e("run-parallel"),
              s = e("bittorrent-tracker/client");
            t.exports = class extends a {
              constructor(e) {
                if ((super(), !e.peerId))
                  throw new Error("Option `peerId` is required");
                if (!e.infoHash)
                  throw new Error("Option `infoHash` is required");
                if (!n.browser && !e.port)
                  throw new Error("Option `port` is required");
                (this.peerId =
                  "string" == typeof e.peerId
                    ? e.peerId
                    : e.peerId.toString("hex")),
                  (this.infoHash =
                    "string" == typeof e.infoHash
                      ? e.infoHash.toLowerCase()
                      : e.infoHash.toString("hex")),
                  (this._port = e.port),
                  (this._userAgent = e.userAgent),
                  (this.destroyed = !1),
                  (this._announce = e.announce || []),
                  (this._intervalMs = e.intervalMs || 900000),
                  (this._trackerOpts = null),
                  (this._dhtAnnouncing = !1),
                  (this._dhtTimeout = !1),
                  (this._internalDHT = !1),
                  (this._onWarning = e => {
                    this.emit("warning", e);
                  }),
                  (this._onError = e => {
                    this.emit("error", e);
                  }),
                  (this._onDHTPeer = (e, t) => {
                    t.toString("hex") !== this.infoHash ||
                      this.emit("peer", `${e.host}:${e.port}`, "dht");
                  }),
                  (this._onTrackerPeer = e => {
                    this.emit("peer", e, "tracker");
                  }),
                  (this._onTrackerAnnounce = () => {
                    this.emit("trackerAnnounce");
                  });
                const t = (e, t) => {
                  const n = new i(t);
                  return (
                    n.on("warning", this._onWarning),
                    n.on("error", this._onError),
                    n.listen(e),
                    (this._internalDHT = !0),
                    n
                  );
                };
                !1 === e.tracker
                  ? (this.tracker = null)
                  : e.tracker && "object" == typeof e.tracker
                  ? ((this._trackerOpts = Object.assign({}, e.tracker)),
                    (this.tracker = this._createTracker()))
                  : (this.tracker = this._createTracker()),
                  (this.dht =
                    !1 === e.dht || "function" != typeof i
                      ? null
                      : e.dht && "function" == typeof e.dht.addNode
                      ? e.dht
                      : e.dht && "object" == typeof e.dht
                      ? t(e.dhtPort, e.dht)
                      : t(e.dhtPort)),
                  this.dht &&
                    (this.dht.on("peer", this._onDHTPeer), this._dhtAnnounce());
              }
              updatePort(e) {
                e === this._port ||
                  ((this._port = e),
                  this.dht && this._dhtAnnounce(),
                  this.tracker &&
                    (this.tracker.stop(),
                    this.tracker.destroy(() => {
                      this.tracker = this._createTracker();
                    })));
              }
              complete(e) {
                this.tracker && this.tracker.complete(e);
              }
              destroy(e) {
                if (!this.destroyed) {
                  (this.destroyed = !0), clearTimeout(this._dhtTimeout);
                  const t = [];
                  this.tracker &&
                    (this.tracker.stop(),
                    this.tracker.removeListener("warning", this._onWarning),
                    this.tracker.removeListener("error", this._onError),
                    this.tracker.removeListener("peer", this._onTrackerPeer),
                    this.tracker.removeListener(
                      "update",
                      this._onTrackerAnnounce
                    ),
                    t.push(e => {
                      this.tracker.destroy(e);
                    })),
                    this.dht &&
                      this.dht.removeListener("peer", this._onDHTPeer),
                    this._internalDHT &&
                      (this.dht.removeListener("warning", this._onWarning),
                      this.dht.removeListener("error", this._onError),
                      t.push(e => {
                        this.dht.destroy(e);
                      })),
                    d(t, e),
                    (this.dht = null),
                    (this.tracker = null),
                    (this._announce = null);
                }
              }
              _createTracker() {
                const e = Object.assign({}, this._trackerOpts, {
                    infoHash: this.infoHash,
                    announce: this._announce,
                    peerId: this.peerId,
                    port: this._port,
                    userAgent: this._userAgent
                  }),
                  t = new s(e);
                return (
                  t.on("warning", this._onWarning),
                  t.on("error", this._onError),
                  t.on("peer", this._onTrackerPeer),
                  t.on("update", this._onTrackerAnnounce),
                  t.setInterval(this._intervalMs),
                  t.start(),
                  t
                );
              }
              _dhtAnnounce() {
                this._dhtAnnouncing ||
                  (o("dht announce"),
                  (this._dhtAnnouncing = !0),
                  clearTimeout(this._dhtTimeout),
                  this.dht.announce(this.infoHash, this._port, e => {
                    (this._dhtAnnouncing = !1),
                      o("dht announce complete"),
                      e && this.emit("warning", e),
                      this.emit("dhtAnnounce"),
                      this.destroyed ||
                        ((this._dhtTimeout = setTimeout(() => {
                          this._dhtAnnounce();
                        }, this._intervalMs + r((Math.random() * this._intervalMs) / 5))),
                        this._dhtTimeout.unref && this._dhtTimeout.unref());
                  }));
              }
            };
          }.call(this, e("_process")));
        },
        {
          _process: 61,
          "bittorrent-dht/client": 21,
          "bittorrent-tracker/client": 15,
          debug: 30,
          events: 33,
          "run-parallel": 89
        }
      ],
      111: [
        function(e, t) {
          (function(e) {
            const n = 16384;
            class r {
              constructor(e) {
                (this.length = e),
                  (this.missing = e),
                  (this.sources = null),
                  (this._chunks = a(e / n)),
                  (this._remainder = e % n || n),
                  (this._buffered = 0),
                  (this._buffer = null),
                  (this._cancellations = null),
                  (this._reservations = 0),
                  (this._flushed = !1);
              }
              chunkLength(e) {
                return e === this._chunks - 1 ? this._remainder : n;
              }
              chunkLengthRemaining(e) {
                return this.length - e * n;
              }
              chunkOffset(e) {
                return e * n;
              }
              reserve() {
                return this.init()
                  ? this._cancellations.length
                    ? this._cancellations.pop()
                    : this._reservations < this._chunks
                    ? this._reservations++
                    : -1
                  : -1;
              }
              reserveRemaining() {
                if (!this.init()) return -1;
                if (this._reservations < this._chunks) {
                  const e = this._reservations;
                  return (this._reservations = this._chunks), e;
                }
                return -1;
              }
              cancel(e) {
                this.init() && this._cancellations.push(e);
              }
              cancelRemaining(e) {
                this.init() && (this._reservations = e);
              }
              get(e) {
                return this.init() ? this._buffer[e] : null;
              }
              set(e, t, r) {
                if (!this.init()) return !1;
                const o = t.length,
                  i = a(o / n);
                for (let o = 0; o < i; o++)
                  if (!this._buffer[e + o]) {
                    const i = o * n,
                      a = t.slice(i, i + n);
                    this._buffered++,
                      (this._buffer[e + o] = a),
                      (this.missing -= a.length),
                      this.sources.includes(r) || this.sources.push(r);
                  }
                return this._buffered === this._chunks;
              }
              flush() {
                if (!this._buffer || this._chunks !== this._buffered)
                  return null;
                const t = e.concat(this._buffer, this.length);
                return (
                  (this._buffer = null),
                  (this._cancellations = null),
                  (this.sources = null),
                  (this._flushed = !0),
                  t
                );
              }
              init() {
                return (
                  !this._flushed &&
                  (!!this._buffer ||
                    ((this._buffer = Array(this._chunks)),
                    (this._cancellations = []),
                    (this.sources = []),
                    !0))
                );
              }
            }
            Object.defineProperty(r, "BLOCK_LENGTH", { value: 16384 }),
              (t.exports = r);
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26 }
      ],
      112: [
        function(e, t) {
          (function(n) {
            var r = e("is-typedarray").strict;
            t.exports = function(e) {
              if (r(e)) {
                var t = n.from(e.buffer);
                return (
                  e.byteLength !== e.buffer.byteLength &&
                    (t = t.slice(e.byteOffset, e.byteOffset + e.byteLength)),
                  t
                );
              }
              return n.from(e);
            };
          }.call(this, e("buffer").Buffer));
        },
        { buffer: 26, "is-typedarray": 42 }
      ],
      113: [
        function(e, t, o) {
          var i = e("buffer-alloc"),
            a = n(2, 32);
          (o.encodingLength = function() {
            return 8;
          }),
            (o.encode = function(e, t, n) {
              t || (t = i(8)), n || (n = 0);
              var o = r(e / a);
              return (
                t.writeUInt32BE(o, n), t.writeUInt32BE(e - o * a, n + 4), t
              );
            }),
            (o.decode = function(e, t) {
              t || (t = 0);
              var n = e.readUInt32BE(t),
                r = e.readUInt32BE(t + 4);
              return n * a + r;
            }),
            (o.encode.bytes = 8),
            (o.decode.bytes = 8);
        },
        { "buffer-alloc": 24 }
      ],
      114: [
        function(e, t) {
          "use strict";
          function n(e, t) {
            for (var n = 1, r = e.length, o = e[0], d = e[0], s = 1; s < r; ++s)
              if (((d = o), (o = e[s]), t(o, d))) {
                if (s === n) {
                  n++;
                  continue;
                }
                e[n++] = o;
              }
            return (e.length = n), e;
          }
          function r(e) {
            for (
              var t = 1, n = e.length, r = e[0], o = e[0], d = 1;
              d < n;
              ++d, o = r
            )
              if (((o = r), (r = e[d]), r !== o)) {
                if (d === t) {
                  t++;
                  continue;
                }
                e[t++] = r;
              }
            return (e.length = t), e;
          }
          t.exports = function(e, t, o) {
            return 0 === e.length
              ? e
              : t
              ? (o || e.sort(t), n(e, t))
              : (o || e.sort(), r(e));
          };
        },
        {}
      ],
      115: [
        function(e, t) {
          t.exports = function(e, t) {
            if (!(t >= e.length || 0 > t)) {
              var n = e.pop();
              if (t < e.length) {
                var r = e[t];
                return (e[t] = n), r;
              }
              return n;
            }
          };
        },
        {}
      ],
      116: [
        function(e, t, n) {
          "use strict";
          function r() {
            (this.protocol = null),
              (this.slashes = null),
              (this.auth = null),
              (this.host = null),
              (this.port = null),
              (this.hostname = null),
              (this.hash = null),
              (this.search = null),
              (this.query = null),
              (this.pathname = null),
              (this.path = null),
              (this.href = null);
          }
          function o(e, t, n) {
            if (e && d.isObject(e) && e instanceof r) return e;
            var o = new r();
            return o.parse(e, t, n), o;
          }
          var a = e("punycode"),
            d = e("./util");
          (n.parse = o),
            (n.resolve = function(e, t) {
              return o(e, !1, !0).resolve(t);
            }),
            (n.resolveObject = function(e, t) {
              return e ? o(e, !1, !0).resolveObject(t) : t;
            }),
            (n.format = function(e) {
              return (
                d.isString(e) && (e = o(e)),
                e instanceof r ? e.format() : r.prototype.format.call(e)
              );
            }),
            (n.Url = r);
          var c = /^([a-z0-9.+-]+:)/i,
            u = /:[0-9]*$/,
            f = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
            p = ["{", "}", "|", "\\", "^", "`"].concat([
              "<",
              ">",
              '"',
              "`",
              " ",
              "\r",
              "\n",
              "\t"
            ]),
            h = ["'"].concat(p),
            m = ["%", "/", "?", ";", "#"].concat(h),
            g = ["/", "?", "#"],
            _ = /^[+a-z0-9A-Z_-]{0,63}$/,
            b = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
            y = { javascript: !0, "javascript:": !0 },
            w = { javascript: !0, "javascript:": !0 },
            E = {
              http: !0,
              https: !0,
              ftp: !0,
              gopher: !0,
              file: !0,
              "http:": !0,
              "https:": !0,
              "ftp:": !0,
              "gopher:": !0,
              "file:": !0
            },
            x = e("querystring");
          (r.prototype.parse = function(e, t, n) {
            if (!d.isString(e))
              throw new TypeError(
                "Parameter 'url' must be a string, not " + typeof e
              );
            var r = e.indexOf("?"),
              o = -1 !== r && r < e.indexOf("#") ? "?" : "#",
              u = e.split(o),
              v = /\\/g;
            (u[0] = u[0].replace(v, "/")), (e = u.join(o));
            var S = e;
            if (((S = S.trim()), !n && 1 === e.split("#").length)) {
              var C = f.exec(S);
              if (C)
                return (
                  (this.path = S),
                  (this.href = S),
                  (this.pathname = C[1]),
                  C[2]
                    ? ((this.search = C[2]),
                      (this.query = t
                        ? x.parse(this.search.substr(1))
                        : this.search.substr(1)))
                    : t && ((this.search = ""), (this.query = {})),
                  this
                );
            }
            var I = c.exec(S);
            if (I) {
              I = I[0];
              var L = I.toLowerCase();
              (this.protocol = L), (S = S.substr(I.length));
            }
            if (n || I || S.match(/^\/\/[^@\/]+@[^@\/]+/)) {
              var T = "//" === S.substr(0, 2);
              T && !(I && w[I]) && ((S = S.substr(2)), (this.slashes = !0));
            }
            if (!w[I] && (T || (I && !E[I]))) {
              for (var B = -1, R = 0, A; R < g.length; R++)
                (A = S.indexOf(g[R])),
                  -1 !== A && (-1 === B || A < B) && (B = A);
              var U, P;
              (P = -1 === B ? S.lastIndexOf("@") : S.lastIndexOf("@", B)),
                -1 !== P &&
                  ((U = S.slice(0, P)),
                  (S = S.slice(P + 1)),
                  (this.auth = decodeURIComponent(U))),
                (B = -1);
              for (var R = 0, A; R < m.length; R++)
                (A = S.indexOf(m[R])),
                  -1 !== A && (-1 === B || A < B) && (B = A);
              -1 === B && (B = S.length),
                (this.host = S.slice(0, B)),
                (S = S.slice(B)),
                this.parseHost(),
                (this.hostname = this.hostname || "");
              var O =
                "[" === this.hostname[0] &&
                "]" === this.hostname[this.hostname.length - 1];
              if (!O)
                for (
                  var N = this.hostname.split(/\./), R = 0, M = N.length, H;
                  R < M;
                  R++
                )
                  if (((H = N[R]), H && !H.match(_))) {
                    for (var q = "", D = 0, F = H.length; D < F; D++)
                      q += 127 < H.charCodeAt(D) ? "x" : H[D];
                    if (!q.match(_)) {
                      var k = N.slice(0, R),
                        W = N.slice(R + 1),
                        z = H.match(b);
                      z && (k.push(z[1]), W.unshift(z[2])),
                        W.length && (S = "/" + W.join(".") + S),
                        (this.hostname = k.join("."));
                      break;
                    }
                  }
              (this.hostname =
                255 < this.hostname.length ? "" : this.hostname.toLowerCase()),
                O || (this.hostname = a.toASCII(this.hostname));
              var V = this.port ? ":" + this.port : "",
                G = this.hostname || "";
              (this.host = G + V),
                (this.href += this.host),
                O &&
                  ((this.hostname = this.hostname.substr(
                    1,
                    this.hostname.length - 2
                  )),
                  "/" !== S[0] && (S = "/" + S));
            }
            if (!y[L])
              for (var R = 0, M = h.length, K; R < M; R++)
                if (((K = h[R]), -1 !== S.indexOf(K))) {
                  var Y = encodeURIComponent(K);
                  Y === K && (Y = escape(K)), (S = S.split(K).join(Y));
                }
            var X = S.indexOf("#");
            -1 !== X && ((this.hash = S.substr(X)), (S = S.slice(0, X)));
            var $ = S.indexOf("?");
            if (
              (-1 === $
                ? t && ((this.search = ""), (this.query = {}))
                : ((this.search = S.substr($)),
                  (this.query = S.substr($ + 1)),
                  t && (this.query = x.parse(this.query)),
                  (S = S.slice(0, $))),
              S && (this.pathname = S),
              E[L] && this.hostname && !this.pathname && (this.pathname = "/"),
              this.pathname || this.search)
            ) {
              var V = this.pathname || "",
                Q = this.search || "";
              this.path = V + Q;
            }
            return (this.href = this.format()), this;
          }),
            (r.prototype.format = function() {
              var e = this.auth || "";
              e &&
                ((e = encodeURIComponent(e)),
                (e = e.replace(/%3A/i, ":")),
                (e += "@"));
              var t = this.protocol || "",
                n = this.pathname || "",
                r = this.hash || "",
                o = !1,
                i = "";
              this.host
                ? (o = e + this.host)
                : this.hostname &&
                  ((o =
                    e +
                    (-1 === this.hostname.indexOf(":")
                      ? this.hostname
                      : "[" + this.hostname + "]")),
                  this.port && (o += ":" + this.port)),
                this.query &&
                  d.isObject(this.query) &&
                  Object.keys(this.query).length &&
                  (i = x.stringify(this.query));
              var a = this.search || (i && "?" + i) || "";
              return (
                t && ":" !== t.substr(-1) && (t += ":"),
                this.slashes || ((!t || E[t]) && !1 !== o)
                  ? ((o = "//" + (o || "")),
                    n && "/" !== n.charAt(0) && (n = "/" + n))
                  : !o && (o = ""),
                r && "#" !== r.charAt(0) && (r = "#" + r),
                a && "?" !== a.charAt(0) && (a = "?" + a),
                (n = n.replace(/[?#]/g, function(e) {
                  return encodeURIComponent(e);
                })),
                (a = a.replace("#", "%23")),
                t + o + n + a + r
              );
            }),
            (r.prototype.resolve = function(e) {
              return this.resolveObject(o(e, !1, !0)).format();
            }),
            (r.prototype.resolveObject = function(e) {
              if (d.isString(e)) {
                var t = new r();
                t.parse(e, !1, !0), (e = t);
              }
              for (
                var n = new r(), o = Object.keys(this), a = 0, l;
                a < o.length;
                a++
              )
                (l = o[a]), (n[l] = this[l]);
              if (((n.hash = e.hash), "" === e.href))
                return (n.href = n.format()), n;
              if (e.slashes && !e.protocol) {
                for (var c = Object.keys(e), u = 0, f; u < c.length; u++)
                  (f = c[u]), "protocol" !== f && (n[f] = e[f]);
                return (
                  E[n.protocol] &&
                    n.hostname &&
                    !n.pathname &&
                    (n.path = n.pathname = "/"),
                  (n.href = n.format()),
                  n
                );
              }
              if (e.protocol && e.protocol !== n.protocol) {
                if (!E[e.protocol]) {
                  for (var h = Object.keys(e), m = 0, g; m < h.length; m++)
                    (g = h[m]), (n[g] = e[g]);
                  return (n.href = n.format()), n;
                }
                if (((n.protocol = e.protocol), !e.host && !w[e.protocol])) {
                  for (
                    var _ = (e.pathname || "").split("/");
                    _.length && !(e.host = _.shift());

                  );
                  e.host || (e.host = ""),
                    e.hostname || (e.hostname = ""),
                    "" !== _[0] && _.unshift(""),
                    2 > _.length && _.unshift(""),
                    (n.pathname = _.join("/"));
                } else n.pathname = e.pathname;
                if (
                  ((n.search = e.search),
                  (n.query = e.query),
                  (n.host = e.host || ""),
                  (n.auth = e.auth),
                  (n.hostname = e.hostname || e.host),
                  (n.port = e.port),
                  n.pathname || n.search)
                ) {
                  var b = n.pathname || "",
                    p = n.search || "";
                  n.path = b + p;
                }
                return (
                  (n.slashes = n.slashes || e.slashes), (n.href = n.format()), n
                );
              }
              var s = n.pathname && "/" === n.pathname.charAt(0),
                y = e.host || (e.pathname && "/" === e.pathname.charAt(0)),
                x = y || s || (n.host && e.pathname),
                S = x,
                C = (n.pathname && n.pathname.split("/")) || [],
                _ = (e.pathname && e.pathname.split("/")) || [],
                I = n.protocol && !E[n.protocol];
              if (
                (I &&
                  ((n.hostname = ""),
                  (n.port = null),
                  n.host && ("" === C[0] ? (C[0] = n.host) : C.unshift(n.host)),
                  (n.host = ""),
                  e.protocol &&
                    ((e.hostname = null),
                    (e.port = null),
                    e.host &&
                      ("" === _[0] ? (_[0] = e.host) : _.unshift(e.host)),
                    (e.host = null)),
                  (x = x && ("" === _[0] || "" === C[0]))),
                y)
              )
                (n.host = e.host || "" === e.host ? e.host : n.host),
                  (n.hostname =
                    e.hostname || "" === e.hostname ? e.hostname : n.hostname),
                  (n.search = e.search),
                  (n.query = e.query),
                  (C = _);
              else if (_.length)
                C || (C = []),
                  C.pop(),
                  (C = C.concat(_)),
                  (n.search = e.search),
                  (n.query = e.query);
              else if (!d.isNullOrUndefined(e.search)) {
                if (I) {
                  n.hostname = n.host = C.shift();
                  var L =
                    !!(n.host && 0 < n.host.indexOf("@")) && n.host.split("@");
                  L &&
                    ((n.auth = L.shift()), (n.host = n.hostname = L.shift()));
                }
                return (
                  (n.search = e.search),
                  (n.query = e.query),
                  (d.isNull(n.pathname) && d.isNull(n.search)) ||
                    (n.path =
                      (n.pathname ? n.pathname : "") +
                      (n.search ? n.search : "")),
                  (n.href = n.format()),
                  n
                );
              }
              if (!C.length)
                return (
                  (n.pathname = null),
                  (n.path = n.search ? "/" + n.search : null),
                  (n.href = n.format()),
                  n
                );
              for (
                var T = C.slice(-1)[0],
                  B =
                    ((n.host || e.host || 1 < C.length) &&
                      ("." === T || ".." === T)) ||
                    "" === T,
                  R = 0,
                  A = C.length;
                0 <= A;
                A--
              )
                (T = C[A]),
                  "." === T
                    ? C.splice(A, 1)
                    : ".." === T
                    ? (C.splice(A, 1), R++)
                    : R && (C.splice(A, 1), R--);
              if (!x && !S) for (; R--; R) C.unshift("..");
              x &&
                "" !== C[0] &&
                (!C[0] || "/" !== C[0].charAt(0)) &&
                C.unshift(""),
                B && "/" !== C.join("/").substr(-1) && C.push("");
              var U = "" === C[0] || (C[0] && "/" === C[0].charAt(0));
              if (I) {
                n.hostname = n.host = U ? "" : C.length ? C.shift() : "";
                var L =
                  !!(n.host && 0 < n.host.indexOf("@")) && n.host.split("@");
                L && ((n.auth = L.shift()), (n.host = n.hostname = L.shift()));
              }
              return (
                (x = x || (n.host && C.length)),
                x && !U && C.unshift(""),
                C.length
                  ? (n.pathname = C.join("/"))
                  : ((n.pathname = null), (n.path = null)),
                (d.isNull(n.pathname) && d.isNull(n.search)) ||
                  (n.path =
                    (n.pathname ? n.pathname : "") +
                    (n.search ? n.search : "")),
                (n.auth = e.auth || n.auth),
                (n.slashes = n.slashes || e.slashes),
                (n.href = n.format()),
                n
              );
            }),
            (r.prototype.parseHost = function() {
              var e = this.host,
                t = u.exec(e);
              t &&
                ((t = t[0]),
                ":" !== t && (this.port = t.substr(1)),
                (e = e.substr(0, e.length - t.length))),
                e && (this.hostname = e);
            });
        },
        { "./util": 117, punycode: 63, querystring: 66 }
      ],
      117: [
        function(e, t) {
          "use strict";
          t.exports = {
            isString: function(e) {
              return "string" == typeof e;
            },
            isObject: function(e) {
              return "object" == typeof e && null !== e;
            },
            isNull: function(e) {
              return null === e;
            },
            isNullOrUndefined: function(e) {
              return null == e;
            }
          };
        },
        {}
      ],
      118: [
        function(e, t) {
          (function(n) {
            const { EventEmitter: r } = e("events"),
              o = e("bencode"),
              i = e("bitfield"),
              d = e("debug")("ut_metadata"),
              s = e("simple-sha1"),
              l = 1e3,
              c = 16384;
            t.exports = e => {
              class t extends r {
                constructor(t) {
                  super(),
                    (this._wire = t),
                    (this._fetching = !1),
                    (this._metadataComplete = !1),
                    (this._metadataSize = null),
                    (this._remainingRejects = null),
                    (this._bitfield = new i(0, { grow: l })),
                    n.isBuffer(e) && this.setMetadata(e);
                }
                onHandshake(e, t, n) {
                  this._infoHash = e;
                }
                onExtendedHandshake(e) {
                  return e.m && e.m.ut_metadata
                    ? e.metadata_size
                      ? "number" != typeof e.metadata_size ||
                        1e7 < e.metadata_size ||
                        0 >= e.metadata_size
                        ? this.emit(
                            "warning",
                            new Error("Peer gave invalid metadata size")
                          )
                        : void ((this._metadataSize = e.metadata_size),
                          (this._numPieces = a(this._metadataSize / c)),
                          (this._remainingRejects = 2 * this._numPieces),
                          this._requestPieces())
                      : this.emit(
                          "warning",
                          new Error("Peer does not have metadata")
                        )
                    : this.emit(
                        "warning",
                        new Error("Peer does not support ut_metadata")
                      );
                }
                onMessage(e) {
                  let t, n;
                  try {
                    const r = e.toString(),
                      i = r.indexOf("ee") + 2;
                    (t = o.decode(r.substring(0, i))), (n = e.slice(i));
                  } catch (e) {
                    return;
                  }
                  switch (t.msg_type) {
                    case 0:
                      this._onRequest(t.piece);
                      break;
                    case 1:
                      this._onData(t.piece, n, t.total_size);
                      break;
                    case 2:
                      this._onReject(t.piece);
                  }
                }
                fetch() {
                  this._metadataComplete ||
                    ((this._fetching = !0),
                    this._metadataSize && this._requestPieces());
                }
                cancel() {
                  this._fetching = !1;
                }
                setMetadata(e) {
                  if (this._metadataComplete) return !0;
                  d("set metadata");
                  try {
                    const t = o.decode(e).info;
                    t && (e = o.encode(t));
                  } catch (e) {}
                  return (
                    !(this._infoHash && this._infoHash !== s.sync(e)) &&
                    (this.cancel(),
                    (this.metadata = e),
                    (this._metadataComplete = !0),
                    (this._metadataSize = this.metadata.length),
                    (this._wire.extendedHandshake.metadata_size = this._metadataSize),
                    this.emit(
                      "metadata",
                      o.encode({ info: o.decode(this.metadata) })
                    ),
                    !0)
                  );
                }
                _send(e, t) {
                  let r = o.encode(e);
                  n.isBuffer(t) && (r = n.concat([r, t])),
                    this._wire.extended("ut_metadata", r);
                }
                _request(e) {
                  this._send({ msg_type: 0, piece: e });
                }
                _data(e, t, n) {
                  const r = { msg_type: 1, piece: e };
                  "number" == typeof n && (r.total_size = n), this._send(r, t);
                }
                _reject(e) {
                  this._send({ msg_type: 2, piece: e });
                }
                _onRequest(e) {
                  if (!this._metadataComplete) return void this._reject(e);
                  const t = e * c;
                  let n = t + c;
                  n > this._metadataSize && (n = this._metadataSize);
                  const r = this.metadata.slice(t, n);
                  this._data(e, r, this._metadataSize);
                }
                _onData(e, t, n) {
                  t.length > c ||
                    !this._fetching ||
                    (t.copy(this.metadata, e * c),
                    this._bitfield.set(e),
                    this._checkDone());
                }
                _onReject(e) {
                  0 < this._remainingRejects && this._fetching
                    ? (this._request(e), (this._remainingRejects -= 1))
                    : this.emit(
                        "warning",
                        new Error('Peer sent "reject" too much')
                      );
                }
                _requestPieces() {
                  if (this._fetching) {
                    this.metadata = n.alloc(this._metadataSize);
                    for (let e = 0; e < this._numPieces; e++) this._request(e);
                  }
                }
                _checkDone() {
                  let e = !0;
                  for (let t = 0; t < this._numPieces; t++)
                    if (!this._bitfield.get(t)) {
                      e = !1;
                      break;
                    }
                  if (e) {
                    const e = this.setMetadata(this.metadata);
                    e || this._failedMetadata();
                  }
                }
                _failedMetadata() {
                  (this._bitfield = new i(0, { grow: l })),
                    (this._remainingRejects -= this._numPieces),
                    0 < this._remainingRejects
                      ? this._requestPieces()
                      : this.emit(
                          "warning",
                          new Error("Peer sent invalid metadata")
                        );
                }
              }
              return (t.prototype.name = "ut_metadata"), t;
            };
          }.call(this, e("buffer").Buffer));
        },
        {
          bencode: 11,
          bitfield: 13,
          buffer: 26,
          debug: 30,
          events: 33,
          "simple-sha1": 95
        }
      ],
      119: [
        function(e, t) {
          (function(e) {
            function n(t) {
              try {
                if (!e.localStorage) return !1;
              } catch (e) {
                return !1;
              }
              var n = e.localStorage[t];
              return null != n && "true" === (n + "").toLowerCase();
            }
            t.exports = function(e, t) {
              function r() {
                if (!o) {
                  if (n("throwDeprecation")) throw new Error(t);
                  else
                    n("traceDeprecation") ? console.trace(t) : console.warn(t);
                  o = !0;
                }
                return e.apply(this, arguments);
              }
              if (n("noDeprecation")) return e;
              var o = !1;
              return r;
            };
          }.call(
            this,
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global
          ));
        },
        {}
      ],
      120: [
        function(e, t) {
          (function(n) {
            function o() {
              return { version: 0, flags: 0, entries: [] };
            }
            const i = e("binary-search"),
              a = e("events"),
              d = e("mp4-stream"),
              s = e("mp4-box-encoding"),
              l = e("range-slice-stream");
            class c {
              constructor(e, t) {
                (this._entries = e),
                  (this._countName = t || "count"),
                  (this._index = 0),
                  (this._offset = 0),
                  (this.value = this._entries[0]);
              }
              inc() {
                this._offset++,
                  this._offset >= this._entries[this._index][this._countName] &&
                    (this._index++, (this._offset = 0)),
                  (this.value = this._entries[this._index]);
              }
            }
            t.exports = class extends a {
              constructor(e) {
                super(),
                  (this._tracks = []),
                  (this._file = e),
                  (this._decoder = null),
                  this._findMoov(0);
              }
              _findMoov(e) {
                this._decoder && this._decoder.destroy();
                let t = 0;
                this._decoder = d.decode();
                const n = this._file.createReadStream({ start: e });
                n.pipe(this._decoder);
                const r = o => {
                  "moov" === o.type
                    ? (this._decoder.removeListener("box", r),
                      this._decoder.decode(e => {
                        n.destroy();
                        try {
                          this._processMoov(e);
                        } catch (e) {
                          (e.message = `Cannot parse mp4 file: ${e.message}`),
                            this.emit("error", e);
                        }
                      }))
                    : o.length < 4096
                    ? ((t += o.length), this._decoder.ignore())
                    : (this._decoder.removeListener("box", r),
                      (t += o.length),
                      n.destroy(),
                      this._decoder.destroy(),
                      this._findMoov(e + t));
                };
                this._decoder.on("box", r);
              }
              _processMoov(e) {
                const t = e.traks;
                (this._tracks = []),
                  (this._hasVideo = !1),
                  (this._hasAudio = !1);
                for (let n = 0; n < t.length; n++) {
                  const i = t[n],
                    a = i.mdia.minf.stbl,
                    d = a.stsd.entries[0],
                    s = i.mdia.hdlr.handlerType;
                  let l, u;
                  if ("vide" === s && "avc1" === d.type) {
                    if (this._hasVideo) continue;
                    (this._hasVideo = !0),
                      (l = "avc1"),
                      d.avcC && (l += `.${d.avcC.mimeCodec}`),
                      (u = `video/mp4; codecs="${l}"`);
                  } else if ("soun" === s && "mp4a" === d.type) {
                    if (this._hasAudio) continue;
                    (this._hasAudio = !0),
                      (l = "mp4a"),
                      d.esds &&
                        d.esds.mimeCodec &&
                        (l += `.${d.esds.mimeCodec}`),
                      (u = `audio/mp4; codecs="${l}"`);
                  } else continue;
                  const f = [];
                  let p = 0,
                    h = 0,
                    m = 0,
                    g = 0,
                    _ = 0,
                    b = 0;
                  const y = new c(a.stts.entries);
                  let w = null;
                  a.ctts && (w = new c(a.ctts.entries));
                  for (let e = 0; ; ) {
                    var r = a.stsc.entries[_];
                    const t = a.stsz.entries[p],
                      n = y.value.duration,
                      o = w ? w.value.compositionOffset : 0;
                    let i = !0;
                    a.stss && (i = a.stss.entries[e] === p + 1);
                    const d = a.stco || a.co64;
                    if (
                      (f.push({
                        size: t,
                        duration: n,
                        dts: b,
                        presentationOffset: o,
                        sync: i,
                        offset: g + d.entries[m]
                      }),
                      p++,
                      p >= a.stsz.entries.length)
                    )
                      break;
                    if ((h++, (g += t), h >= r.samplesPerChunk)) {
                      (h = 0), (g = 0), m++;
                      const e = a.stsc.entries[_ + 1];
                      e && m + 1 >= e.firstChunk && _++;
                    }
                    (b += n), y.inc(), w && w.inc(), i && e++;
                  }
                  (i.mdia.mdhd.duration = 0), (i.tkhd.duration = 0);
                  const k = r.sampleDescriptionId,
                    E = {
                      type: "moov",
                      mvhd: e.mvhd,
                      traks: [
                        {
                          tkhd: i.tkhd,
                          mdia: {
                            mdhd: i.mdia.mdhd,
                            hdlr: i.mdia.hdlr,
                            elng: i.mdia.elng,
                            minf: {
                              vmhd: i.mdia.minf.vmhd,
                              smhd: i.mdia.minf.smhd,
                              dinf: i.mdia.minf.dinf,
                              stbl: {
                                stsd: a.stsd,
                                stts: o(),
                                ctts: o(),
                                stsc: o(),
                                stsz: o(),
                                stco: o(),
                                stss: o()
                              }
                            }
                          }
                        }
                      ],
                      mvex: {
                        mehd: { fragmentDuration: e.mvhd.duration },
                        trexs: [
                          {
                            trackId: i.tkhd.trackId,
                            defaultSampleDescriptionIndex: k,
                            defaultSampleDuration: 0,
                            defaultSampleSize: 0,
                            defaultSampleFlags: 0
                          }
                        ]
                      }
                    };
                  this._tracks.push({
                    fragmentSequence: 1,
                    trackId: i.tkhd.trackId,
                    timeScale: i.mdia.mdhd.timeScale,
                    samples: f,
                    currSample: null,
                    currTime: null,
                    moov: E,
                    mime: u
                  });
                }
                if (0 === this._tracks.length)
                  return void this.emit(
                    "error",
                    new Error("no playable tracks")
                  );
                (e.mvhd.duration = 0),
                  (this._ftyp = {
                    type: "ftyp",
                    brand: "iso5",
                    brandVersion: 0,
                    compatibleBrands: ["iso5"]
                  });
                const i = s.encode(this._ftyp),
                  a = this._tracks.map(e => {
                    const t = s.encode(e.moov);
                    return { mime: e.mime, init: n.concat([i, t]) };
                  });
                this.emit("ready", a);
              }
              seek(e) {
                if (!this._tracks)
                  throw new Error("Not ready yet; wait for 'ready' event");
                this._fileStream &&
                  (this._fileStream.destroy(), (this._fileStream = null));
                let t = -1;
                if (
                  (this._tracks.map((n, r) => {
                    n.outStream && n.outStream.destroy(),
                      n.inStream && (n.inStream.destroy(), (n.inStream = null));
                    const o = (n.outStream = d.encode()),
                      i = this._generateFragment(r, e);
                    if (!i) return o.finalize();
                    (-1 === t || i.ranges[0].start < t) &&
                      (t = i.ranges[0].start);
                    const a = e => {
                      o.destroyed ||
                        o.box(e.moof, t => {
                          if (t) return this.emit("error", t);
                          if (!o.destroyed) {
                            const t = n.inStream.slice(e.ranges);
                            t.pipe(
                              o.mediaData(e.length, e => {
                                if (e) return this.emit("error", e);
                                if (!o.destroyed) {
                                  const e = this._generateFragment(r);
                                  return e ? void a(e) : o.finalize();
                                }
                              })
                            );
                          }
                        });
                    };
                    a(i);
                  }),
                  0 <= t)
                ) {
                  const e = (this._fileStream = this._file.createReadStream({
                    start: t
                  }));
                  this._tracks.forEach(n => {
                    (n.inStream = new l(t, { highWaterMark: 1e7 })),
                      e.pipe(n.inStream);
                  });
                }
                return this._tracks.map(e => e.outStream);
              }
              _findSampleBefore(e, t) {
                const n = this._tracks[e],
                  o = r(n.timeScale * t);
                let a = i(n.samples, o, (e, n) => {
                  const t = e.dts + e.presentationOffset;
                  return t - n;
                });
                for (
                  -1 === a ? (a = 0) : 0 > a && (a = -a - 2);
                  !n.samples[a].sync;

                )
                  a--;
                return a;
              }
              _generateFragment(e, t) {
                const n = this._tracks[e];
                let r;
                if (
                  ((r =
                    void 0 === t ? n.currSample : this._findSampleBefore(e, t)),
                  r >= n.samples.length)
                )
                  return null;
                const o = n.samples[r].dts;
                let i = 0;
                const a = [];
                for (var d = r; d < n.samples.length; d++) {
                  const e = n.samples[d];
                  if (e.sync && e.dts - o >= n.timeScale * 1) break;
                  i += e.size;
                  const t = a.length - 1;
                  0 > t || a[t].end !== e.offset
                    ? a.push({ start: e.offset, end: e.offset + e.size })
                    : (a[t].end += e.size);
                }
                return (
                  (n.currSample = d),
                  { moof: this._generateMoof(e, r, d), ranges: a, length: i }
                );
              }
              _generateMoof(e, t, n) {
                const r = this._tracks[e],
                  o = [];
                let i = 0;
                for (let a = t; a < n; a++) {
                  const e = r.samples[a];
                  0 > e.presentationOffset && (i = 1),
                    o.push({
                      sampleDuration: e.duration,
                      sampleSize: e.size,
                      sampleFlags: e.sync ? 33554432 : 16842752,
                      sampleCompositionTimeOffset: e.presentationOffset
                    });
                }
                const a = {
                  type: "moof",
                  mfhd: { sequenceNumber: r.fragmentSequence++ },
                  trafs: [
                    {
                      tfhd: { flags: 131072, trackId: r.trackId },
                      tfdt: { baseMediaDecodeTime: r.samples[t].dts },
                      trun: {
                        flags: 3841,
                        dataOffset: 8,
                        entries: o,
                        version: i
                      }
                    }
                  ]
                };
                return (a.trafs[0].trun.dataOffset += s.encodingLength(a)), a;
              }
            };
          }.call(this, e("buffer").Buffer));
        },
        {
          "binary-search": 12,
          buffer: 26,
          events: 33,
          "mp4-box-encoding": 49,
          "mp4-stream": 52,
          "range-slice-stream": 70
        }
      ],
      121: [
        function(e, t) {
          function n(e, t, o = {}) {
            return this instanceof n
              ? void ((this.detailedError = null),
                (this._elem = t),
                (this._elemWrapper = new r(t)),
                (this._waitingFired = !1),
                (this._trackMeta = null),
                (this._file = e),
                (this._tracks = null),
                "none" !== this._elem.preload && this._createMuxer(),
                (this._onError = () => {
                  (this.detailedError = this._elemWrapper.detailedError),
                    this.destroy();
                }),
                (this._onWaiting = () => {
                  (this._waitingFired = !0),
                    this._muxer
                      ? this._tracks && this._pump()
                      : this._createMuxer();
                }),
                t.autoplay && (t.preload = "auto"),
                t.addEventListener("waiting", this._onWaiting),
                t.addEventListener("error", this._onError))
              : (console.warn("don't invoked VideoStream without 'new'"),
                new n(e, t, o));
          }
          const r = e("mediasource"),
            o = e("pump"),
            i = e("./mp4-remuxer");
          (n.prototype = {
            _createMuxer() {
              (this._muxer = new i(this._file)),
                this._muxer.on("ready", e => {
                  (this._tracks = e.map(e => {
                    const t = this._elemWrapper.createWriteStream(e.mime);
                    t.on("error", e => {
                      this._elemWrapper.error(e);
                    });
                    const n = {
                      muxed: null,
                      mediaSource: t,
                      initFlushed: !1,
                      onInitFlushed: null
                    };
                    return (
                      t.write(e.init, e => {
                        (n.initFlushed = !0),
                          n.onInitFlushed && n.onInitFlushed(e);
                      }),
                      n
                    );
                  })),
                    (this._waitingFired || "auto" === this._elem.preload) &&
                      this._pump();
                }),
                this._muxer.on("error", e => {
                  this._elemWrapper.error(e);
                });
            },
            _pump() {
              const e = this._muxer.seek(this._elem.currentTime, !this._tracks);
              this._tracks.forEach((t, n) => {
                const r = () => {
                  t.muxed &&
                    (t.muxed.destroy(),
                    (t.mediaSource = this._elemWrapper.createWriteStream(
                      t.mediaSource
                    )),
                    t.mediaSource.on("error", e => {
                      this._elemWrapper.error(e);
                    })),
                    (t.muxed = e[n]),
                    o(t.muxed, t.mediaSource);
                };
                t.initFlushed
                  ? r()
                  : (t.onInitFlushed = e =>
                      e ? void this._elemWrapper.error(e) : void r());
              });
            },
            destroy() {
              this.destroyed ||
                ((this.destroyed = !0),
                this._elem.removeEventListener("waiting", this._onWaiting),
                this._elem.removeEventListener("error", this._onError),
                this._tracks &&
                  this._tracks.forEach(e => {
                    e.muxed && e.muxed.destroy();
                  }),
                (this._elem.src = ""));
            }
          }),
            (t.exports = n);
        },
        { "./mp4-remuxer": 120, mediasource: 45, pump: 62 }
      ],
      122: [
        function(e, t) {
          function n(e, t) {
            function r() {
              for (var t = Array(arguments.length), n = 0; n < t.length; n++)
                t[n] = arguments[n];
              var r = e.apply(this, t),
                o = t[t.length - 1];
              return (
                "function" == typeof r &&
                  r !== o &&
                  Object.keys(o).forEach(function(e) {
                    r[e] = o[e];
                  }),
                r
              );
            }
            if (e && t) return n(e)(t);
            if ("function" != typeof e)
              throw new TypeError("need wrapper function");
            return (
              Object.keys(e).forEach(function(t) {
                r[t] = e[t];
              }),
              r
            );
          }
          t.exports = n;
        },
        {}
      ],
      123: [
        function(e, t) {
          t.exports = function() {
            for (var e = {}, t = 0, r; t < arguments.length; t++)
              for (var o in ((r = arguments[t]), r))
                n.call(r, o) && (e[o] = r[o]);
            return e;
          };
          var n = Object.prototype.hasOwnProperty;
        },
        {}
      ],
      124: [
        function(e, t) {
          t.exports = { version: "0.107.17" };
        },
        {}
      ],
      125: [
        function(e, t) {
          (function(n, r, o) {
            function i(e) {
              return (
                "object" == typeof e && null != e && "function" == typeof e.pipe
              );
            }
            function a(e) {
              return "undefined" != typeof FileList && e instanceof FileList;
            }
            const { EventEmitter: d } = e("events"),
              s = e("simple-concat"),
              l = e("create-torrent"),
              c = e("debug")("webtorrent"),
              u = e("bittorrent-dht/client"),
              f = e("load-ip-set"),
              p = e("run-parallel"),
              h = e("parse-torrent"),
              m = e("path"),
              g = e("simple-peer"),
              _ = e("randombytes"),
              b = e("speedometer"),
              y = e("./lib/tcp-pool"),
              w = e("./lib/torrent"),
              k = e("./package.json").version,
              E = k.replace(/\d*./g, e => `0${e % 100}`.slice(-2)).slice(0, 4);
            class x extends d {
              constructor(e = {}) {
                super(),
                  (this.peerId =
                    "string" == typeof e.peerId
                      ? e.peerId
                      : o.isBuffer(e.peerId)
                      ? e.peerId.toString("hex")
                      : o
                          .from(`-WW${E}-` + _(9).toString("base64"))
                          .toString("hex")),
                  (this.peerIdBuffer = o.from(this.peerId, "hex")),
                  (this.nodeId =
                    "string" == typeof e.nodeId
                      ? e.nodeId
                      : o.isBuffer(e.nodeId)
                      ? e.nodeId.toString("hex")
                      : _(20).toString("hex")),
                  (this.nodeIdBuffer = o.from(this.nodeId, "hex")),
                  (this._debugId = this.peerId.toString("hex").substring(0, 7)),
                  (this.destroyed = !1),
                  (this.listening = !1),
                  (this.torrentPort = e.torrentPort || 0),
                  (this.dhtPort = e.dhtPort || 0),
                  (this.tracker = e.tracker === void 0 ? {} : e.tracker),
                  (this.torrents = []),
                  (this.maxConns = +e.maxConns || 55),
                  this._debug(
                    "new webtorrent (peerId %s, nodeId %s, port %s)",
                    this.peerId,
                    this.nodeId,
                    this.torrentPort
                  ),
                  this.tracker &&
                    ("object" != typeof this.tracker && (this.tracker = {}),
                    e.rtcConfig &&
                      (console.warn(
                        "WebTorrent: opts.rtcConfig is deprecated. Use opts.tracker.rtcConfig instead"
                      ),
                      (this.tracker.rtcConfig = e.rtcConfig)),
                    e.wrtc &&
                      (console.warn(
                        "WebTorrent: opts.wrtc is deprecated. Use opts.tracker.wrtc instead"
                      ),
                      (this.tracker.wrtc = e.wrtc)),
                    r.WRTC &&
                      !this.tracker.wrtc &&
                      (this.tracker.wrtc = r.WRTC)),
                  "function" == typeof y
                    ? (this._tcpPool = new y(this))
                    : n.nextTick(() => {
                        this._onListening();
                      }),
                  (this._downloadSpeed = b()),
                  (this._uploadSpeed = b()),
                  !1 !== e.dht && "function" == typeof u
                    ? ((this.dht = new u(
                        Object.assign({}, { nodeId: this.nodeId }, e.dht)
                      )),
                      this.dht.once("error", e => {
                        this._destroy(e);
                      }),
                      this.dht.once("listening", () => {
                        const e = this.dht.address();
                        e && (this.dhtPort = e.port);
                      }),
                      this.dht.setMaxListeners(0),
                      this.dht.listen(this.dhtPort))
                    : (this.dht = !1),
                  (this.enableWebSeeds = !1 !== e.webSeeds);
                const t = () => {
                  this.destroyed || ((this.ready = !0), this.emit("ready"));
                };
                "function" == typeof f && null != e.blocklist
                  ? f(
                      e.blocklist,
                      {
                        headers: {
                          "user-agent": `WebTorrent/${k} (https://webtorrent.io)`
                        }
                      },
                      (e, n) =>
                        e
                          ? this.error(`Failed to load blocklist: ${e.message}`)
                          : void ((this.blocked = n), t())
                    )
                  : n.nextTick(t);
              }
              get downloadSpeed() {
                return this._downloadSpeed();
              }
              get uploadSpeed() {
                return this._uploadSpeed();
              }
              get progress() {
                const e = this.torrents.filter(e => 1 !== e.progress),
                  t = e.reduce((e, t) => e + t.downloaded, 0),
                  n = e.reduce((e, t) => e + (t.length || 0), 0) || 1;
                return t / n;
              }
              get ratio() {
                const e = this.torrents.reduce((e, t) => e + t.uploaded, 0),
                  t = this.torrents.reduce((e, t) => e + t.received, 0) || 1;
                return e / t;
              }
              get(e) {
                if (!(e instanceof w)) {
                  let t;
                  try {
                    t = h(e);
                  } catch (e) {}
                  if (!t) return null;
                  if (!t.infoHash)
                    throw new Error("Invalid torrent identifier");
                  for (const e of this.torrents)
                    if (e.infoHash === t.infoHash) return e;
                } else if (this.torrents.includes(e)) return e;
                return null;
              }
              download(e, t, n) {
                return (
                  console.warn(
                    "WebTorrent: client.download() is deprecated. Use client.add() instead"
                  ),
                  this.add(e, t, n)
                );
              }
              add(e, t = {}, n) {
                function r() {
                  a.removeListener("_infoHash", o),
                    a.removeListener("ready", i),
                    a.removeListener("close", r);
                }
                if (this.destroyed) throw new Error("client is destroyed");
                "function" == typeof t && ([t, n] = [{}, t]);
                const o = () => {
                    if (!this.destroyed)
                      for (const e of this.torrents)
                        if (e.infoHash === a.infoHash && e !== a)
                          return void a._destroy(
                            new Error(
                              `Cannot add duplicate torrent ${a.infoHash}`
                            )
                          );
                  },
                  i = () => {
                    this.destroyed ||
                      ("function" == typeof n && n(a), this.emit("torrent", a));
                  };
                this._debug("add"), (t = t ? Object.assign({}, t) : {});
                const a = new w(e, this, t);
                return (
                  this.torrents.push(a),
                  a.once("_infoHash", o),
                  a.once("ready", i),
                  a.once("close", r),
                  a
                );
              }
              seed(e, t, n) {
                if (this.destroyed) throw new Error("client is destroyed");
                "function" == typeof t && ([t, n] = [{}, t]),
                  this._debug("seed"),
                  (t = t ? Object.assign({}, t) : {}),
                  (t.skipVerify = !0);
                const r = "string" == typeof e;
                r && (t.path = m.dirname(e)),
                  t.createdBy || (t.createdBy = `WebTorrent/${E}`);
                const o = e => {
                    this._debug("on seed"),
                      "function" == typeof n && n(e),
                      e.emit("seed"),
                      this.emit("seed", e);
                  },
                  d = this.add(null, t, e => {
                    const t = [t => (r ? t() : void e.load(c, t))];
                    this.dht &&
                      t.push(t => {
                        e.once("dhtAnnounce", t);
                      }),
                      p(t, t =>
                        this.destroyed ? void 0 : t ? e._destroy(t) : void o(e)
                      );
                  });
                let c;
                return (
                  a(e) ? (e = Array.from(e)) : !Array.isArray(e) && (e = [e]),
                  p(
                    e.map(e => t => {
                      i(e) ? s(e, t) : t(null, e);
                    }),
                    (e, n) =>
                      this.destroyed
                        ? void 0
                        : e
                        ? d._destroy(e)
                        : void l.parseInput(n, t, (e, r) =>
                            this.destroyed
                              ? void 0
                              : e
                              ? d._destroy(e)
                              : void ((c = r.map(e => e.getStream)),
                                l(n, t, (e, t) => {
                                  if (!this.destroyed) {
                                    if (e) return d._destroy(e);
                                    const n = this.get(t);
                                    n
                                      ? d._destroy(
                                          new Error(
                                            `Cannot add duplicate torrent ${n.infoHash}`
                                          )
                                        )
                                      : d._onTorrentId(t);
                                  }
                                }))
                          )
                  ),
                  d
                );
              }
              remove(e, t) {
                this._debug("remove");
                const n = this.get(e);
                if (!n) throw new Error(`No torrent with id ${e}`);
                this._remove(e, t);
              }
              _remove(e, t) {
                const n = this.get(e);
                n &&
                  (this.torrents.splice(this.torrents.indexOf(n), 1),
                  n.destroy(t));
              }
              address() {
                return this.listening
                  ? this._tcpPool
                    ? this._tcpPool.server.address()
                    : { address: "0.0.0.0", family: "IPv4", port: 0 }
                  : null;
              }
              destroy(e) {
                if (this.destroyed) throw new Error("client already destroyed");
                this._destroy(null, e);
              }
              _destroy(e, t) {
                this._debug("client destroy"), (this.destroyed = !0);
                const n = this.torrents.map(e => t => {
                  e.destroy(t);
                });
                this._tcpPool &&
                  n.push(e => {
                    this._tcpPool.destroy(e);
                  }),
                  this.dht &&
                    n.push(e => {
                      this.dht.destroy(e);
                    }),
                  p(n, t),
                  e && this.emit("error", e),
                  (this.torrents = []),
                  (this._tcpPool = null),
                  (this.dht = null);
              }
              _onListening() {
                if (
                  (this._debug("listening"),
                  (this.listening = !0),
                  this._tcpPool)
                ) {
                  const e = this._tcpPool.server.address();
                  e && (this.torrentPort = e.port);
                }
                this.emit("listening");
              }
              _debug() {
                const e = [].slice.call(arguments);
                (e[0] = `[${this._debugId}] ${e[0]}`), c(...e);
              }
            }
            (x.WEBRTC_SUPPORT = g.WEBRTC_SUPPORT),
              (x.VERSION = k),
              (t.exports = x);
          }.call(
            this,
            e("_process"),
            "undefined" == typeof global
              ? "undefined" == typeof self
                ? "undefined" == typeof window
                  ? {}
                  : window
                : self
              : global,
            e("buffer").Buffer
          ));
        },
        {
          "./lib/tcp-pool": 21,
          "./lib/torrent": 5,
          "./package.json": 124,
          _process: 61,
          "bittorrent-dht/client": 21,
          buffer: 26,
          "create-torrent": 29,
          debug: 30,
          events: 33,
          "load-ip-set": 21,
          "parse-torrent": 58,
          path: 59,
          randombytes: 69,
          "run-parallel": 89,
          "simple-concat": 92,
          "simple-peer": 94,
          speedometer: 98
        }
      ]
    },
    {},
    [125]
  )(125);
});
