variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "cloudflare_zone_name" {
  type        = string
  description = "Public DNS zone, for example example.com."
}

variable "cloudflare_account_id" {
  type = string
}

variable "lb_aws_hostname" {
  type        = string
  description = "AWS EKS LoadBalancer external hostname (ELB DNS name)."
}

variable "lb_ip_azure" {
  type        = string
  description = "Azure AKS LoadBalancer external IP."
}
