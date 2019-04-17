"use strict";

const jobs = document.getElementById('jobs');
let states = [];
let colors = {
  failed: 'crimson',
  success: 'green',
  walltime_exceeded: 'OrangeRed',
  input_file_missing: 'DarkRed',
  running: 'black',
  queued: 'Gray',
  inserted: 'LightGray',
}

let labels = {
  failed: 'failed',
  success: 'success',
  walltime_exceeded: 'walltime',
  input_file_missing: 'missing input',
  running: 'running',
  queued: 'queued',
  inserted: 'created',
}

function getStates() {
  return fetch('/states').then(response => {
    if (response.status >= 400) {throw response.statusText;}
    return response.json();
  }).then(data => {
    states = data.states;
    return data.states;
  }).catch(e => console.log(e))
}

function updateJobStats() {
  fetch('/jobstats').then(response => {
    if (response.status >= 400) {throw response.statusText;}
    return response.json();
  }).then(newData => {

    let processings = new Set();
    newData['jobstats'].forEach(row => processings.add(row.version + ' ' + row.xml));
    processings = Array.from(processings);

    let update = {
      x: Array(states.length).fill(processings),
      y: Array(states.length).fill(null).map(e => Array(processings.length).fill(0))
    };

    newData['jobstats'].forEach(row => {
      let trace = states.indexOf(row.description);
      let idx = processings.indexOf(row.version + ' ' + row.xml)
      update.y[trace][idx] = row.n_jobs;
    });

    Plotly.restyle(jobs, update);
    console.log('Update done');
  }).catch(err => {console.log(err);});
}

function initPlots(states) {
  let traces = [];
  states.forEach((state, i) => {
    let trace = {
      x: [''],
      y: [0],
      name: labels[state],
      type: 'bar',
    };

    if (state in colors) {
      trace.marker = {color: colors[state]};
    }
    traces.push(trace);
  })
  
  let layout = {
    barmode: 'stack',
    legend: {
      orientation: 'h'
    },
    margin: {
      t: 15
    }
  };

  Plotly.newPlot(jobs, traces, layout, {responsive: true});
  console.log(traces);
}

getStates()
  .then(initPlots)
  .catch(e => console.log(e))
  .then(updateJobStats)
  .catch(e => console.log(e))
;

setInterval(updateJobStats, 15000);
