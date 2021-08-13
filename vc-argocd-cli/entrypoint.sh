#!/bin/sh -l
echo "*********ARGOCD LOGIN*********"
argocd login $1 --grpc-web --username $2 --password $3
echo "*********ARGOCD RUN COMMAND*********"
argocd $4