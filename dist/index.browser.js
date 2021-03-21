'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var _objectWithoutPropertiesLoose = _interopDefault(require('@babel/runtime/helpers/objectWithoutPropertiesLoose'));
var React = require('react');

var event = "hydrate";
var io =  typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting || entry.intersectionRatio > 0) {
      entry.target.dispatchEvent(new CustomEvent(event));
    }
  });
}, {
  rootMargin: "250px"
}) : null; // React currently throws a warning when using useLayoutEffect on the server.

var useIsomorphicLayoutEffect =  React.useLayoutEffect ;

function LazyHydrate(props) {
  var childRef = React.useRef(null); // Always render on server

  var _React$useState = React.useState(!(true )),
      hydrated = _React$useState[0],
      setHydrated = _React$useState[1];

  var noWrapper = props.noWrapper,
      ssrOnly = props.ssrOnly,
      whenIdle = props.whenIdle,
      whenVisible = props.whenVisible,
      promise = props.promise,
      _props$on = props.on,
      on = _props$on === void 0 ? [] : _props$on,
      children = props.children,
      didHydrate = props.didHydrate,
      _props$wrapper = props.wrapper,
      wrapper = _props$wrapper === void 0 ? 'div' : _props$wrapper,
      rest = _objectWithoutPropertiesLoose(props, ["noWrapper", "ssrOnly", "whenIdle", "whenVisible", "promise", "on", "children", "didHydrate", "wrapper"]);

  if ('production' !== process.env.NODE_ENV && !ssrOnly && !whenIdle && !whenVisible && !on.length && !promise) {
    console.error("LazyHydration: Enable atleast one trigger for hydration.\n" + "If you don't want to hydrate, use ssrOnly");
  }

  useIsomorphicLayoutEffect(function () {
    // No SSR Content
    if (!childRef.current.hasChildNodes()) {
      setHydrated(true);
    }
  }, []);
  React.useEffect(function () {
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
    if (noWrapper) {
      return children;
    }

    return React.createElement(wrapper, _extends({
      ref: childRef
    }, rest), children); // (
    //   <div ref={childRef} style={{ display: "contents" }} {...rest}>
    //     {children}
    //   </div>
    // );
  } else {
    return React.createElement(wrapper, _extends({
      ref: childRef,
      suppressHydrationWarning: true
    }, rest, {
      dangerouslySetInnerHTML: {
        __html: ''
      }
    })); // return (
    //   <div
    //     ref={childRef}
    //     style={{ display: "contents" }}
    //     suppressHydrationWarning
    //     {...rest}
    //     dangerouslySetInnerHTML={{ __html: "" }}
    //   />
    // );
  }
}

exports.default = LazyHydrate;
