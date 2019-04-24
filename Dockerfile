FROM ubuntu:18.04

EXPOSE 5000

RUN apt-get update -qq \
	&& apt-get install --no-install-recommends -y \
		locales unzip netbase ca-certificates \
		python3 python3-dev python3-pip python3-wheel python3-setuptools \
		build-essential \
	&& echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
	&& locale-gen \
	&& rm -rf /var/lib/apt/lists/* \
	&& mkdir /opt/erna_webinterface

ENV LC_ALL="en_US.UTF-8"
ENV LANG="en_US.UTF-8"

COPY Pipfile* /opt/erna_webinterface/

WORKDIR /opt/erna_webinterface

RUN python3 -m pip install pipenv \
	&& python3 -m pipenv install --deploy --system

COPY erna_webinterface /opt/erna_webinterface/erna_webinterface
CMD gunicorn -b 0.0.0.0:5000 erna_webinterface:app
