# ==============================================================================
# Terraform — k3s Cluster on EC2 (Free Tier Compatible)
# ==============================================================================

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID to launch instance in"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = ""
}

# --- AMI Data Source (Amazon Linux 2023) ---
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- k3s Security Group ---
resource "aws_security_group" "k3s" {
  name_prefix = "${var.project}-${var.environment}-k3s-"
  vpc_id      = data.aws_subnet.selected.vpc_id

  # Kubernetes API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # NodePort range
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-${var.environment}-k3s-sg"
    Project     = var.project
    Environment = var.environment
  }
}

data "aws_subnet" "selected" {
  id = var.subnet_id
}

# --- EC2 Instance with k3s ---
resource "aws_instance" "k3s_server" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id, aws_security_group.k3s.id]
  key_name               = var.key_name != "" ? var.key_name : null

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail

    # Install k3s
    curl -sfL https://get.k3s.io | sh -s - \
      --write-kubeconfig-mode 644 \
      --disable traefik \
      --node-name "${var.project}-${var.environment}"

    # Wait for k3s
    until kubectl get nodes; do sleep 5; done

    # Install Helm
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

    # Create namespaces
    kubectl create namespace veyor-${var.environment} --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace biomedical-${var.environment} --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace platform --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

    echo "k3s cluster ready: ${var.project}-${var.environment}"
  EOF

  tags = {
    Name        = "${var.project}-${var.environment}-k3s"
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# --- Elastic IP (free tier: 1 EIP associated to running instance) ---
resource "aws_eip" "k3s" {
  instance = aws_instance.k3s_server.id
  domain   = "vpc"

  tags = {
    Name = "${var.project}-${var.environment}-k3s-eip"
  }
}

# --- Outputs ---
output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.k3s_server.id
}

output "public_ip" {
  description = "Public IP of k3s server"
  value       = aws_eip.k3s.public_ip
}

output "k3s_kubeconfig_command" {
  description = "Command to fetch kubeconfig"
  value       = "ssh ec2-user@${aws_eip.k3s.public_ip} 'sudo cat /etc/rancher/k3s/k3s.yaml' | sed 's/127.0.0.1/${aws_eip.k3s.public_ip}/g'"
}
