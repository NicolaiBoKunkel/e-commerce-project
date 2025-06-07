#!/bin/bash

build_services() {
  echo "Building Docker images..."
  docker build -t user-service:latest ./services/user-service
  docker build -t product-service:latest ./services/product-service
  docker build -t order-service:latest ./services/order-service
  docker build -t notification-service:latest ./services/notification-service
  docker build -t api-gateway:latest ./api-gateway
  echo "Done building images."
}

apply_k8s() {
  echo "Applying Kubernetes configs..."
  kubectl apply -f k8s/
  echo "Kubernetes configs applied."
}

restart_pods() {
  echo "Restarting pods to load new images..."
  kubectl delete pod -l app=user-service
  kubectl delete pod -l app=product-service
  kubectl delete pod -l app=order-service
  kubectl delete pod -l app=notification-service
  kubectl delete pod -l app=api-gateway
  # Prometheus and Grafana don't need rebuilt images, but included for consistency
  kubectl delete pod -l app=prometheus
  kubectl delete pod -l app=grafana
  echo "Pods deleted. Kubernetes will recreate them automatically."
}

teardown() {
  echo "Tearing down Kubernetes setup..."
  kubectl delete -f k8s/
  echo "All resources deleted."
}

show_help() {
  echo "Usage: ./k8s-tools.sh [command]"
  echo "Available commands:"
  echo "  build       Build all Docker service images"
  echo "  apply       Apply Kubernetes configuration"
  echo "  restart     Restart all service pods"
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
