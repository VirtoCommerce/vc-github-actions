FROM alpine:3.14

RUN apk add py3-pip
RUN apk add gcc  \ 
            musl-dev \ 
            python3-dev \ 
            libffi-dev \ 
            openssl-dev \ 
            cargo \
	    make
RUN pip install --upgrade pip
RUN pip install azure-cli

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY start.py .


ENTRYPOINT ["python3","start.py"]
