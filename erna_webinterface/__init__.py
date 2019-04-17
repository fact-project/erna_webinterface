from flask import Flask, render_template, jsonify
import yaml
import os
import peewee
from collections import defaultdict

from erna.automatic_processing.database import Job, ProcessingState, XML, Jar, database

sortkey = defaultdict(
    int,
    walltime_exceeded=-1,
    failed=-2,
    input_file_missing=-3,
    inserted=0,
    queued=1,
    running=2,
    success=3,
)


with open(os.environ.get('ERNAWEB_CONFIG', 'erna_web.yaml')) as f:
    config = yaml.safe_load(f)

app = Flask(__name__)
app.secret_key = config['app'].pop('secret_key')
app.config.update(config['app'])
database.init(**config['processing_database'])


@app.before_request
def _db_connect():
    database.connect()


@app.teardown_request
def _db_close(exc):
    if not database.is_closed():
        database.close()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/states')
def states():
    states = [p.description for p in ProcessingState.select()]
    states = sorted(states, key=lambda k: sortkey[k])
    return jsonify({'status': 'success', 'states': states})


@app.route('/jobstats')
def jobstats():
    jobstats = list(
        ProcessingState.select(
            ProcessingState.description,
            Jar.version,
            XML.name.alias('xml'),
            peewee.fn.COUNT(Job.id).alias('n_jobs')
        )
        .join(Job)
        .join(XML)
        .switch(Job)
        .join(Jar)
        .group_by(Jar.version, XML.name, ProcessingState.description)
        .dicts()
    )
    return jsonify({'status': 'success', 'jobstats': jobstats})
