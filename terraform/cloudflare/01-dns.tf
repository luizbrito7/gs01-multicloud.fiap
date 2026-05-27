resource "cloudflare_record" "frontend" {
  zone_id = var.cloudflare_zone_id
  name    = "multicloud"
  type    = "CNAME"
  value   = cloudflare_pages_project.frontend.subdomain
  proxied = true
  ttl     = 1
}
