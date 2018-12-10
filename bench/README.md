# Benchmarks

## Methodology

All libs return a simple JSON response and the proper content-type headers.
Each server is run in its own forked process and gets a warm up run for 3
seconds before we start tracking the results.

## Results

### Read / GET

The standard result set mimics a simple resourceful read action. It's a GET
request with a specified ID, though that ID is not being used for anything atm.
Then a simple integer response is placed in an object of the form
`{ data: 1, error: null }` which is sent back. If the framework has built-in
JSON handling we simply pass in the object, otherwise we `JSON.stringify` it.

![Benchmark](results/read.png)

### Create / POST

In this benchmark we mimic a resourceful create action. It's a POST request
with a JSON body which is parsed and then returned to the client as the `data`
object in the previously mentioned response format.

![Benchmark](results/create.png)
