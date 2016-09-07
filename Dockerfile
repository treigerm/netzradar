FROM python:2-onbuild

COPY . /usr/src/app

# Install bower
RUN apt-get update -qq
RUN apt-get install -y -qq git curl wget

RUN apt-get install -y -qq npm
RUN ln -s /usr/bin/nodejs /usr/bin/node

RUN npm install --global bower

RUN bower --allow-root install

# Start server
CMD ["python", "app.py"]

EXPOSE 5000
