FROM node
RUN apt-get -y update

RUN apt-get -y upgrade

RUN apt-get -y install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev avahi-discover libnss-mdns

RUN npm install pm2 -g

# Create app directory

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source

COPY . /usr/src/app
# Install app dependencies
RUN npm install
RUN npm install -g @angular/cli --unsafe
RUN npm run build

EXPOSE 3042

CMD service dbus start && service avahi-daemon start &&  pm2-docker npm -- start