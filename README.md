# Main prometheus collectors for basic http api server (node.js)

	- Collect main metrics such as request time and path, response code, time db reqest, time http 
clietn  
equests
	- Implemets express like middleware for auto collect http requests
	- Implemets express like route for provide metrics prometheus agents 

## Contains collectors
- Counters 
	- numOfRequests labels: [method]
	- pathTaken labels: [path]
- Summaries
	- apiRequests labels: requestName
	- responses labels: [method, path, status]
	- numErrors labels: [type]
	- summarybyType labels: [type, measure_unit]
	- dbRequests labels: [dbReqName]

- Methods
	- incError(typeOfError)
	- summaryByType(typeEvent, measureUnit, value)
	- endDbRequestTimer(dbRequestName, startTime)
	- endApiRequestTimes(requestName, startTime)
	

- Express like middleware
	- requestMonitor (use for method configure feather.js)
	```js
		app.configure(promClient.requestMonitor)
	```
	- requestCounters, responseCounters
	```js
		app.use(promClient.requestCounters)
  		   .use(promClient.responseCounters)
	```
	- injectMetricsRoute
	```js
		Prometheus.injectMetricsRoute(app);
	```


 
