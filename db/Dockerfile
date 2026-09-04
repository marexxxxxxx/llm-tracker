FROM alpine:3.20

RUN apk add --no-cache sqlite

VOLUME ["/var/lib/tracker"]

WORKDIR /var/lib/tracker

COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

CMD ["/usr/local/bin/init.sh"]
