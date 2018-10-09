/**
 * Newly added requires
 */

import ResponseTime from "response-time";
import { register, Counter, Summary, collectDefaultMetrics } from "prom-client";

class Prometheus {
  constructor() {
    /**
     * A Prometheus counter that counts the invocations of the different HTTP verbs
     * e.g. a GET and a POST call will be counted as 2 different calls
     */
    this.numOfRequests = new Counter({
      name: "numOfRequests",
      help: "Number of requests made",
      labelNames: ["method"]
    });

    /**
     * A Prometheus counter that counts the invocations with different paths
     * e.g. /foo and /bar will be counted as 2 different paths
     */
    this.pathsTaken = new Counter({
      name: "pathsTaken",
      help: "Paths taken in the app",
      labelNames: ["path"]
    });

    /**
     * A Prometheus summary to record the HTTP method, path, response code and response time
     */
    this.responses = new Summary({
      name: "responses",
      help: "Response time in millis",
      labelNames: ["method", "path", "status"]
    });

    this.apiRequests = new Summary({
      name: "api",
      help: "client api requests",
      labelNames: ["requestName"]
    });

    this.numErrors = new Counter({
      name: "numOfErrors",
      help: "Number of errors",
      labelNames: ["type"]
    });

    this.summaryByType = new Summary({
      name: "summaryByType",
      help: "Summury by type",
      labelNames: ["type", "measure_unit"]
    });

    this.dbRequests = new Summary({
      name: "dbResponses",
      help: "Database requests time in millis",
      labelNames: ["dbReqName"]
    });
  }

  incError = typeOfError => {
    this.numErrors.inc({ type: typeOfError });
  };

  summaryByType = (typeEvent, mu, num) => {
    if (!mu && num && num % 1 != 0) mu = "sec";
    if (!mu && !num) mu = "count";

    this.summaryByType.set({ type: typeEvent, measure: mu }, num || 1);
  };

  /**
   * This funtion will start the collection of metrics and should be called from within in the main js file
   */
  startCollection = () => {
    console.log(
      "Starting the collection of metrics, the metrics are available on /metrics"
    );
    collectDefaultMetrics();
    return this;
  };

  /**
   * This function increments the counters that are executed on the request side of an invocation
   * Currently it increments the counters for numOfPaths and pathsTaken
   */
  requestCounters = (req, res, next) => {
    if (
      req.originalUrl !== "/metrics" &&
      req.originalUrl !== "/health" &&
      req.originalUrl !== "/favicon.ico"
    ) {
      this.numOfRequests.inc({ method: req.method });
      this.pathsTaken.inc({ path: req.path });
    }
    next();
  };

  /**
   * This function increments the counters that are executed on the response side of an invocation
   * Currently it updates the responses summary miliseconds
   */
  responseCounters = () =>
    ResponseTime((req, res, time) => {
      if (
        req.originalUrl !== "/metrics" &&
        req.originalUrl !== "/health" &&
        req.originalUrl !== "/favicon.ico"
      ) {
        this.responses
          .labels(req.method, req.originalUrl, res.statusCode)
          .observe(time);
      }
    });

  /**
   * In order to have Prometheus get the data from this app a specific URL is registered
   */
  injectMetricsRoute = (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(register.metrics());
  };

  /*
   * Measure database request time in seconds
   */

  endDbRequestTimer = (dbReqName, startTime) => {
    this.dbRequests.labels(dbReqName).observe((new Date() - startTime) / 1000);
  };

  endApiRequestTimer = (requestName, startTime) => {
    this.apiRequests
      .labels(requestName)
      .observe((new Date() - startTime) / 1000);
  };
}

const prom = new Prometheus().startCollection();

export default {
  requestMonitor: app =>
    app
      .use(prom.requestCounters)
      .use(prom.responseCounters())
      .use("/metrics", prom.injectMetricsRoute),

  endDbRequestTimer: prom.endDbRequestTimer,
  endApiRequestTimer: prom.endApiRequestTimer,
  incError: prom.incError,
  summaryByType: prom.summaryByType
};
