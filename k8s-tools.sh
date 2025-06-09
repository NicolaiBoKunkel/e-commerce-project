#!/bin/bash

DOCKER_USER="likrotdb2025"

build_services() {
  echo "Building and pushing Docker images to Docker Hub..."

  docker build -t $DOCKER_USER/user-service:latest ./services/user-service
  docker push $DOCKER_USER/user-service:latest

  docker build -t $DOCKER_USER/product-service:latest ./services/product-service
  docker push $DOCKER_USER/product-service:latest

  docker build -t $DOCKER_USER/order-service:latest ./services/order-service
  docker push $DOCKER_USER/order-service:latest

  docker build -t $DOCKER_USER/notification-service:latest ./services/notification-service
  docker push $DOCKER_USER/notification-service:latest

  docker build -t $DOCKER_USER/api-gateway:latest ./api-gateway
  docker push $DOCKER_USER/api-gateway:latest

  echo "All images built and pushed."
}

apply_k8s() {
  echo "Applying Kubernetes configs..."
  kubectl apply -f k8s/
  echo "Kubernetes configs applied."
}

restart_pods() {
  echo "Rolling out new deployments..."
  kubectl rollout restart deployment/user-service
  kubectl rollout restart deployment/product-service
  kubectl rollout restart deployment/order-service
  kubectl rollout restart deployment/notification-service
  kubectl rollout restart deployment/api-gateway
  kubectl rollout restart deployment/prometheus || echo "Prometheus not found."
  kubectl rollout restart deployment/grafana || echo "Grafana not found."
  echo "Deployments restarted."
}

teardown() {
  echo "Tearing down Kubernetes setup..."
  kubectl delete -f k8s/
  echo "All resources deleted."
}

show_help() {
  echo "Usage: ./k8s-tools.sh [command]"
  echo "Available commands:"
  echo "  build       Build & push Docker images to Docker Hub"
  echo "  apply       Apply Kubernetes configuration"
  echo "  restart     Restart deployments (pull latest image)"
  echo "  teardown    Delete all Kubernetes resources"
  echo "  all         Run build, apply, and restart in sequence"
}

# Main logic
case "$1" in
  build) build_services ;;
  apply) apply_k8s ;;
  restart) restart_pods ;;
  teardown) teardown ;;
  all)
    build_services
    apply_k8s
    restart_pods
    ;;
  *) show_help ;;
esac
