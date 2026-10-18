/* intro.js — the tap-to-open CURTAIN INTRO. The invitation's opening scene.
 *
 * A closed-curtain still fills the device column from the first paint, a chip invites
 * the tap, and that one tap starts BOTH the 4.67s silent clip of the curtains parting
 * on "Muskan & Shourya" AND the background music (autoplay policy allows neither
 * outside a gesture). When the clip ends, the overlay dissolves into scene 1.
 *
 * Loaded as a classic `defer` script BEFORE js/main.js, so it is running before the
 * stage engine exists; the overlay itself is static markup in index.html, so the
 * poster paints without waiting for any module graph.
 *
 * ---------------------------------------------------------------------------
 * THE HANDOFF (how the cover scene is held back, without touching js/stage.js)
 *
 *   html.intro-active     set inline in <head>, in force on the very first frame.
 *                         css/intro.css uses it to null out the engine's entry cascade
 *                         and to make the stage inert; js/scenes/cover.js uses it to
 *                         know it must wait.
 *   document "intro:done" dispatched here at the START of the exit fade — not at its
 *                         end. That is the whole point: the cover plays its arrival
 *                         (art fade-in, copy reveal, gesture chip) WHILE the curtain
 *                         dissolves, so the two surfaces genuinely crossfade instead
 *                         of cutting. The class is dropped in the same task.
 *
 * Remove the overlay markup and nothing else has to change: the class is never set,
 * every gated call in cover.js runs inline, and the invitation behaves as before.
 *
 * ---------------------------------------------------------------------------
 * NEVER DEAD-ENDS. A play() rejection, a <video>/<source> error, a decode stall, a
 * missing file, or a browser that never fires `ended` all route to finish(). Reduced
 * motion skips the clip entirely (the tap still opens, and still starts the music).
 * A no-JS visitor never sees the overlay at all — see the <noscript> in index.html.
 * Plays on every load; no storage of any kind.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  window.MS = window.MS || {};

  var intro = document.querySelector("[data-intro]");
  if (!intro) {
    /* no overlay in the DOM — make sure nothing is left gated */
    root.classList.remove("intro-active");
    return;
  }

  /* js/main.js's failsafe: without this flag it assumes intro.js never loaded and
     tears the (static) overlay down itself, so a 404 on this file can never seal the
     invitation shut. */
  window.MS.introAlive = true;

  var video = intro.querySelector("[data-intro-video]");
  var posterImg = intro.querySelector("[data-intro-poster]");
  var hintEl = intro.querySelector("[data-intro-hint]");
  var chipEl = intro.querySelector("[data-intro-chip]");

  /* KEEP IN LOCK-STEP with js/main.js and js/fx/kit.js — one token, one cache entry. */
  var COPY_URL = "data/template.json?v=6";
  var HINT_DELAY_MS = 1000; /* let the curtain land before asking for anything */
  var ART_CAP_MS = 3000; /* hard cap on waiting for the cover art to decode */
  var REMOVE_MS = 1700; /* > --intro-fade (1200ms) — never yanks the node mid-dissolve */

  var reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var activated = false; /* a tap has started the open */
  var finished = false; /* finish() has run — guards every exit path */
  var videoErrored = false;
  var safetyTimer = 0;
  var hintTimer = 0;

  /* ------------------------------------------------------------- hint copy */
  /* The string lives in data/template.json `hints.intro`, alongside every other
     gesture chip, so all seven read from one file. The pill stays display:none until
     real copy lands — an empty pill is worse than none (same rule as js/fx/kit.js). */

  hintTimer = window.setTimeout(function () {
    if (!activated && hintEl) hintEl.classList.add("is-on");
  }, HINT_DELAY_MS);

  if (chipEl && typeof fetch === "function") {
    Promise.resolve({json: function () { return Promise.resolve(window.LS_WEDDING); }, ok: true})
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        var copy = j && j.hints && typeof j.hints.intro === "string" ? j.hints.intro.trim() : "";
        if (!copy || finished) return;
        chipEl.textContent = copy;
        if (hintEl) hintEl.classList.add("has-label");
      })
      .catch(function () {
        /* missing or unparseable copy just means no pill — the mark still invites */
      });
  }

  /* ---------------------------------------------------------------- video */

  function onVideoError() {
    videoErrored = true;
    if (activated) finish();
  }

  /**
   * Is the clip unusable? Both halves matter.
   *
   * The EVENT half: a <source> failure surfaces on the <source> element, not always on
   * the <video>, so both are listened to.
   *
   * The STATE half: resource selection starts while the document is still parsing, so a
   * file that fails fast (missing, blocked, offline) can fire its error BEFORE this
   * deferred script ever runs — and a listener attached afterwards hears nothing.
   * Measured: without this read, a blocked curtain.mp4 fell through to the safety timer
   * and held the guest on a dead poster for 7.2s. Reading the element's own state
   * instead makes that failure instant. networkState 3 is NETWORK_NO_SOURCE, which is
   * only ever set once every candidate source has been exhausted.
   */
  function videoDead() {
    if (!video || videoErrored) return true;
    if (video.error) return true;
    return video.networkState === 3;
  }

  if (video) {
    video.addEventListener("error", onVideoError, { once: true });
    var srcEl = video.querySelector("source");
    if (srcEl) srcEl.addEventListener("error", onVideoError, { once: true });
    video.addEventListener("ended", finish, { once: true });
  }

  /* Chrome drops the <video>'s own poster the instant play() is called, but the first
     decoded frame is not presented for ~430ms after that — a bare flash the guest
     absolutely sees. The separate <img> poster stays painted across that gap and is
     dropped in ONE step (display:none, no transition: a fade would only prolong a
     stale closed-curtain frame over live moving video) the moment the frame it stands
     in for is genuinely on screen. */
  function hidePosterOnFirstFrame() {
    if (!posterImg || !video) return;
    var drop = function () {
      posterImg.classList.add("is-hidden");
    };
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(drop);
      return;
    }
    /* No rVFC: `playing` fires once decode has produced a frame, but not necessarily
       the moment it is composited — wait one extra rAF past the paint that already
       happened before swapping. */
    video.addEventListener(
      "playing",
      function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(drop);
        });
      },
      { once: true }
    );
  }

  function freeVideo() {
    if (!video) return;
    try {
      video.pause();
      video.removeAttribute("src");
      var s = video.querySelector("source");
      if (s) s.removeAttribute("src");
      video.load(); /* release the decoded buffers — the clip never comes back */
    } catch (e) {}
  }

  /* Reduced motion never plays the clip, so do not make that guest pay 691KB for it.
     The `preload="auto"` attribute stays in the markup — the preload scanner needs it to
     start the fetch early for everybody else — and the in-flight load is aborted here,
     the first moment we know it will never be watched. activate() checks `reduced`
     before it ever looks at the video, so nothing downstream sees an emptied element. */
  if (reduced) freeVideo();

  /* ------------------------------------------------------------- activate */

  /** First activation only: pointerup / click, or Enter / Space on the focusable overlay. */
  function activate() {
    if (activated || finished) return;
    activated = true;

    window.clearTimeout(hintTimer);
    if (hintEl) hintEl.classList.remove("is-on");
    intro.classList.add("is-playing");

    /* The MUSIC rides this same gesture. js/audio.js owns the <audio> (lazy creation,
       volume ramp, mute toggle, pause-on-hidden) and listens for the first gesture on
       `document` — this tap bubbles there, inside the gesture, so nothing has to be
       started from here. The flag is only for the sliver before js/main.js has booted
       and attached that listener; main.js reads it and plays on our behalf. */
    window.MS.introTapped = true;

    /* reduced motion: skip the clip, dissolve straight to the invitation */
    if (reduced) {
      finish();
      return;
    }
    /* no usable clip: reveal rather than trap */
    if (videoDead()) {
      finish();
      return;
    }

    /* If `ended` never fires (stall, decode hiccup, a tab backgrounded mid-clip),
       finish a beat past the clip's natural length so this can never dead-end. */
    var dur = isFinite(video.duration) && video.duration > 0 ? video.duration : 4.667;
    safetyTimer = window.setTimeout(finish, dur * 1000 + 2500);

    /* Register the first-frame watch BEFORE play(), or the callback races the very
       frame it exists to catch. */
    hidePosterOnFirstFrame();

    video.muted = true; /* set programmatically too — WebKit's muted-autoplay policy */
    var p;
    try {
      p = video.play();
    } catch (e) {
      p = null;
    }
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        finish(); /* autoplay/gesture rejection -> reveal instead of trapping */
      });
    }
  }

  /* --------------------------------------------------------------- finish */

  /**
   * Hold on the clip's last frame until the cover's artwork has actually DECODED, so
   * the dissolve can never land on a half-painted scene. Capped, so a slow network or
   * a 404 cannot dead-end the invitation.
   */
  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(safetyTimer);
    window.clearTimeout(hintTimer);
    safetyTimer = 0;

    var proceeded = false;
    var poll = 0;
    var cap = 0;

    var go = function () {
      if (proceeded) return;
      proceeded = true;
      window.clearInterval(poll);
      window.clearTimeout(cap);
      proceed();
    };

    var tryDecode = function () {
      /* js/stage.js builds the scenes asynchronously (it awaits two JSON fetches), so
         on a very fast tap the cover's <img>s may not exist yet — keep polling. */
      var imgs = document.querySelectorAll('.scene[data-scene="cover"] img');
      if (!imgs.length) return;
      window.clearInterval(poll);
      var pending = [];
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (typeof img.decode === "function") {
          pending.push(img.decode().catch(function () {}));
        } else if (!img.complete) {
          pending.push(
            new Promise(function (res) {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            })
          );
        }
      }
      Promise.all(pending).then(go, go);
    };

    cap = window.setTimeout(go, ART_CAP_MS);
    poll = window.setInterval(tryDecode, 60);
    tryDecode();
  }

  function proceed() {
    /* Fire BEFORE the fade so the cover's arrival and this dissolve overlap — see the
       header. js/scenes/cover.js is the only listener. */
    try {
      document.dispatchEvent(new CustomEvent("intro:done"));
    } catch (e) {
      document.dispatchEvent(new Event("intro:done"));
    }
    root.classList.remove("intro-active");
    setInert(false);
    intro.classList.add("is-done");

    var removed = false;
    var onEnd = function (e) {
      if (e.target === intro && e.propertyName === "opacity") remove();
    };
    function remove() {
      if (removed) return;
      removed = true;
      intro.removeEventListener("transitionend", onEnd);
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      freeVideo();
    }
    intro.addEventListener("transitionend", onEnd);
    /* Fallback if transitionend never fires. MUST outlast --intro-fade (1200ms). */
    window.setTimeout(remove, REMOVE_MS);
  }

  /* ----------------------------------------------------------------- inert */
  /* The overlay covers the stage for pointers, but a keyboard user could otherwise
     Tab straight past it into the cover's hidden tap button and the nav rail. */

  function setInert(on) {
    var mounts = [
      document.querySelector("[data-stage-viewport]"),
      document.querySelector("[data-nav-mount]")
    ];
    for (var i = 0; i < mounts.length; i++) {
      if (!mounts[i]) continue;
      if (on) mounts[i].setAttribute("inert", "");
      else mounts[i].removeAttribute("inert");
    }
  }

  setInert(true);

  /* ---------------------------------------------------------------- input */

  intro.addEventListener("pointerup", function (e) {
    if (e.button != null && e.button !== 0) return; /* primary button / touch only */
    activate();
  });
  intro.addEventListener("click", activate); /* fallback where Pointer Events are absent */
  intro.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar" || e.code === "Space") {
      e.preventDefault();
      activate();
    }
  });
})();
