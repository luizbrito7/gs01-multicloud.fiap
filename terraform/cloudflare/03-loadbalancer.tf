resource "cloudflare_load_balancer_monitor" "api_health" {
  account_id     = var.cloudflare_account_id
  type           = "http"
  method         = "GET"
  path           = "/health"
  port           = 80
  expected_codes = "200"
  interval       = 60
  timeout        = 5
  retries        = 2
  description    = "gs01-api health check"
}

resource "cloudflare_load_balancer_pool" "api" {
  account_id      = var.cloudflare_account_id
  name            = "api-multicloud"
  monitor         = cloudflare_load_balancer_monitor.api_health.id
  minimum_origins = 1
  check_regions   = ["WEU"]

  origins {
    name    = "aws"
    address = var.lb_aws_hostname
    enabled = true
  }

  origins {
    name    = "azure"
    address = var.lb_ip_azure
    enabled = true
  }

  origin_steering {
    policy = "random"
  }
}

resource "cloudflare_load_balancer" "api" {
  zone_id         = var.cloudflare_zone_id
  name            = "api-${local.project}.${var.cloudflare_zone_name}"
  default_pool_ids = [cloudflare_load_balancer_pool.api.id]
  fallback_pool_id = cloudflare_load_balancer_pool.api.id
  proxied         = true
  steering_policy = "off"
}
