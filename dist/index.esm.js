import _extends from '@babel/runtime/helpers/esm/extends';
import _objectWithoutPropertiesLoose from '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose';
import { useRef, useState, useEffect, createElement, isValidElement, cloneElement, useLayoutEffect } from 'react';

var isBrowser = typeof document !== "undefined";

var event = "hydrate";
var io = ( isBrowser) && typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting || entry.intersectionRatio > 0) {
      entry.target.dispatchEvent(new CustomEvent(event));
    }
  });
}, {
  rootMargin: "250px"
}) : null; // React currently throws a warning when using useLayoutEffect on the server.

var useIsomorphicLayoutEffect =  isBrowser ? useLayoutEffect : useEffect;

function LazyHydrate(props) {
  var childRef = useRef(null); // Always render on server

  var _React$useState = useState(!( isBrowser)),
      hydrated = _React$useState[0],
      setHydrated = _React$useState[1];

  var noWrapper = props.noWrapper,
      ssrOnly = props.ssrOnly,
      whenIdle = props.whenIdle,
      whenVisible = props.whenVisible,
      promise = props.promise,
      _props$on = props.on,
      on = _props$on === void 0 ? [] : _props$on,
      dangerouslyClone = props.dangerouslyClone,
      children = props.children,
      didHydrate = props.didHydrate,
      rest = _objectWithoutPropertiesLoose(props, ["noWrapper", "ssrOnly", "whenIdle", "whenVisible", "promise", "on", "dangerouslyClone", "children", "didHydrate"]);

  if ('production' !== process.env.NODE_ENV && !ssrOnly && !whenIdle && !whenVisible && !on.length && !promise) {
    console.error("LazyHydration: Enable atleast one trigger for hydration.\n" + "If you don't want to hydrate, use ssrOnly");
  }

  useIsomorphicLayoutEffect(function () {
    // No SSR Content
    if (!childRef.current.hasChildNodes()) {
      setHydrated(true);
    }
  }, []);
  useEffect(function () {
    if (ssrOnly || hydrated) return;
    var cleanupFns = [];

    function cleanup() {
      while (cleanupFns.length) {
        cleanupFns.pop()();
      }
    }

    function hydrate() {
      setHydrated(true);
      if (didHydrate) didHydrate();
    }

    if (promise) {
      promise.then(hydrate)["catch"](hydrate);
    }

    if (whenIdle) {
      // @ts-ignore
      if (typeof requestIdleCallback !== "undefined") {
        // @ts-ignore
        var idleCallbackId = requestIdleCallback(hydrate, {
          timeout: 500
        });
        cleanupFns.push(function () {
          // @ts-ignore
          cancelIdleCallback(idleCallbackId);
        });
      } else {
        var id = setTimeout(hydrate, 2000);
        cleanupFns.push(function () {
          clearTimeout(id);
        });
      }
    }

    var events = Array.isArray(on) ? on.slice() : [on];

    if (whenVisible) {
      if (io && childRef.current.childElementCount) {
        // As root node does not have any box model, it cannot intersect.
        var el = childRef.current.children[0];
        io.observe(el);
        events.push(event);
        cleanupFns.push(function () {
          io.unobserve(el);
        });
      } else {
        return hydrate();
      }
    }

    events.forEach(function (event) {
      var instance = childRef.current;
      instance.addEventListener(event, hydrate, {
        once: true,
        capture: true,
        passive: true
      });
      cleanupFns.push(function () {
        instance.removeEventListener(event, hydrate, {
          capture: true
        });
      });
    });
    return cleanup;
  }, [hydrated, on, ssrOnly, whenIdle, whenVisible, didHydrate, promise]);

  if (hydrated) {
    if (noWrapper || dangerouslyClone) {
      return children;
    }

    return /*#__PURE__*/createElement("div", _extends({
      ref: childRef,
      style: {
        display: "contents"
      }
    }, rest), children);
  } else if (dangerouslyClone && isValidElement(children)) {
    return cloneElement(children, {
      dangerouslySetInnerHTML: {
        __html: ""
      },
      forwardedRef: childRef
    });
  } else {
    return /*#__PURE__*/createElement("div", _extends({
      ref: childRef,
      style: {
        display: "contents"
      },
      suppressHydrationWarning: true
    }, rest, {
      dangerouslySetInnerHTML: {
        __html: ""
      }
    }));
  }
}

export default LazyHydrate;
