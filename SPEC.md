# GS01 Multicloud — Spec de Implementação

## Arquitetura

```
Usuário
  │
  ▼
Cloudflare Pages  (frontend React)
  │  fetch /api/subjects
  ▼
DNS Cloudflare "api-rm562192.<zona>"  (round-robin A)
  ├──▶ AWS EKS LoadBalancer → Pod Node.js+Express  (CLOUD_NAME=aws)
  └──▶ Azure AKS LoadBalancer → Pod Node.js+Express  (CLOUD_NAME=azure)
                                         │
                          ┌──────────────┘
                          ▼
               CockroachDB Serverless  (Postgres, externo)
               mesma connection string nos 2 clusters
```

---

## Task 1 — Limpeza do repo **[CONCLUÍDA]**

- [x] Deletar `gcp/` (provider, vpc, gke, state local)
- [x] Deletar `sa-rm562192-key.json` (nunca foi commitada — só no filesystem)

---

## Task 2 — Backend (`app/backend/`)

**Deps:** `express`, `cors`, `pg`

**Arquivos:**
```
app/backend/
├── package.json
├── server.js
├── db.js
├── Dockerfile
└── README.md
```

**Endpoints (`server.js`):**

| Método | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/subjects` | — | `{ data: Subject[], cloud }` |
| POST | `/api/subjects` | `{ name }` | `{ data: Subject, cloud }` |
| PATCH | `/api/subjects/:id` | — | `{ data: Subject, cloud }` (toggle completed) |
| DELETE | `/api/subjects/:id` | — | `{ cloud }` |

- `cloud` = `process.env.CLOUD_NAME || "unknown"` em todos os endpoints
- CORS via `cors({ origin: process.env.FRONTEND_ORIGIN || "*" })`

**Schema (`db.js`):**
```sql
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- Seed automático no startup se `COUNT(*) = 0`:
  1. Cloud Advanced Engineering
  2. Cloud Artificial Intelligence
  3. Cloud Database
  4. Cloud Native Development
  5. Cloud Security
  6. DevOps CI CD
  7. IT Governance
  8. Private Cloud
- Conexão SSL: `new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true } })`

**Variáveis de ambiente:**
- `DATABASE_URL` — connection string CockroachDB
- `CLOUD_NAME` — `aws` | `azure`
- `FRONTEND_ORIGIN` — default `"*"`
- `PORT` — default `3000`

**Imagem Docker:**
- Registry: `ghcr.io`
- Imagem: `ghcr.io/luizbrito7/gs01-multicloud.fiap/gs01-api:v1`

**Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Task 3 — Frontend (`app/frontend/`)

**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui (preto e branco)

**Arquivos:**
```
app/frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── CloudBadge.tsx
│   │   ├── SubjectTable.tsx
│   │   └── AddSubjectForm.tsx
│   ├── hooks/
│   │   └── useSubjects.ts
│   └── lib/
│       └── api.ts
└── README.md
```

**`App.tsx`:**
- Header: "Global Solutions · FIAP" + `<CloudBadge cloud={cloud} />`
- Corpo: `<SubjectTable />` + `<AddSubjectForm />`

**`CloudBadge.tsx`:**
- Badge `● Servido por AWS` / `● Servido por Azure`
- Atualiza a cada response da API (recebe `cloud` como prop de `useSubjects`)

**`SubjectTable.tsx`:**
- Colunas: Concluído (Checkbox) | Matéria | Criado em | Ações (botão deletar)
- Checkbox chama `toggleSubject(id)`
- Linha riscada quando `completed = true`

**`AddSubjectForm.tsx`:**
- Botão "+ Adicionar matéria" abre `Dialog` (shadcn/ui)
- Input text para nome
- Toast ao criar/deletar

**`useSubjects.ts`:**
- state: `subjects`, `loading`, `error`, `cloud`
- `fetchSubjects()` — GET, atualiza `cloud` do response
- `createSubject(name)` — POST, atualiza `cloud`
- `toggleSubject(id)` — PATCH, atualiza `cloud`
- `deleteSubject(id)` — DELETE, atualiza `cloud`

**`lib/api.ts`:**
```ts
import axios from 'axios'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})
```

**Variável de ambiente:**
- `VITE_API_URL` — ex: `https://api-rm562192.<zona>`

**Build para Cloudflare Pages:**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 20

---

## Task 4 — FluxCD via Terraform Helm (`fluxcd/` + `aws/03-fluxcd.tf` + `azure/03-fluxcd.tf`)

*Bloqueada até Task 2 estar completa (imagem Docker precisa existir no registry).*

### 4a — Arquivos YAML em `fluxcd/`

```
fluxcd/
├── apps/
│   ├── base/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml          # ns: demo
│   │   ├── db-credentials.sops.yaml
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── overlays/
│       ├── aws/
│       │   └── kustomization.yaml  # configMapGenerator CLOUD_NAME=aws
│       └── azure/
│           └── kustomization.yaml  # configMapGenerator CLOUD_NAME=azure
```

**`apps/base/namespace.yaml`:** namespace `demo`

**`apps/base/deployment.yaml`:**
- 1 replica
- image: `ghcr.io/luizbrito7/gs01-multicloud.fiap/gs01-api:v1`
- imagePullSecret: `ghcr-credentials`
- env `CLOUD_NAME` via `configMapKeyRef` (configmap `cloud-config`)
- env `DATABASE_URL` via `secretKeyRef` (secret `db-credentials`, key `DATABASE_URL`, criptografado no Git com SOPS + age)
- env `FRONTEND_ORIGIN` = `"*"`

**`apps/base/service.yaml`:**
- type: `LoadBalancer`, port 80 → targetPort 3000

**`apps/overlays/aws/kustomization.yaml`:**
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
configMapGenerator:
  - name: cloud-config
    literals:
      - CLOUD_NAME=aws
```

**`apps/overlays/azure/kustomization.yaml`:** igual, com `CLOUD_NAME=azure`

> **Secret `sops-age`** é criado manualmente no namespace `flux-system` em cada cluster para o Flux descriptografar secrets SOPS:
> ```bash
> kubectl create secret generic sops-age -n flux-system --context <ctx> \
>   --from-file=identity.agekey=.sops/age.key
> ```
>
> **Secret `ghcr-credentials`** é criado manualmente depois do Flux criar o namespace `demo`:
> ```bash
> kubectl create secret docker-registry ghcr-credentials -n demo --context <ctx> \
>   --docker-server=ghcr.io \
>   --docker-username=luizbrito7 \
>   --docker-password="$GHCR_TOKEN"
> ```

### 4b — Terraform Helm: `aws/03-fluxcd.tf` e `azure/03-fluxcd.tf`

O bootstrap do FluxCD é feito via dois `helm_release` no mesmo `terraform apply` que cria o cluster.

**Provider Helm** — adicionar ao `aws/00-provider.tf` e `azure/00-provider.tf`:

*AWS:*
```hcl
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name, "--region", local.region]
    }
  }
}
```

*Azure:*
```hcl
provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.aks.kube_config[0].host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.aks.kube_config[0].cluster_ca_certificate)
  }
}
```

**`aws/03-fluxcd.tf`** (e equivalente para azure com `path` diferente):
```hcl
locals {
  flux_repo_url  = "https://github.com/luizbrito7/gs01-multicloud.fiap"
  flux_repo_path = "./fluxcd/apps/overlays/aws"  # azure usa "overlays/azure"
}

resource "helm_release" "flux" {
  name             = "flux2"
  repository       = "https://fluxcd-community.github.io/helm-charts"
  chart            = "flux2"
  version          = "~> 2.13"
  namespace        = "flux-system"
  create_namespace = true
  depends_on       = [module.eks]  # ou azurerm_kubernetes_cluster.aks para Azure
}

resource "helm_release" "flux_sync" {
  name       = "flux2-sync"
  repository = "https://fluxcd-community.github.io/helm-charts"
  chart      = "flux2-sync"
  version    = "~> 1.8"
  namespace  = "flux-system"

  set {
    name  = "gitRepository.spec.url"
    value = local.flux_repo_url
  }
  set {
    name  = "gitRepository.spec.ref.branch"
    value = "main"
  }
  set {
    name  = "kustomization.spec.path"
    value = local.flux_repo_path
  }

  depends_on = [helm_release.flux]
}
```

---

## Task 5 — Cloudflare Terraform (`cloudflare/`)

**Arquivos:**
```
cloudflare/
├── 00-provider.tf
├── 01-dns.tf
├── 02-pages.tf
├── variables.tf
└── terraform.tfvars.example
```

**`00-provider.tf`:**
```hcl
locals {
  project = "rm562192"
  env     = "dev"
}

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  required_version = ">= 1.5"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

**`01-dns.tf`:** 2x `cloudflare_record` com mesmo `name = "api-${local.project}"`, tipo `A`, `proxied = false`
- Um com `value = var.lb_ip_aws`, outro com `value = var.lb_ip_azure`

**`02-pages.tf`:** `cloudflare_pages_project`
- `name = "gs01-${local.project}-${local.env}"`
- `production_branch = "main"`
- `build_config`: `build_command = "npm run build"`, `destination_dir = "dist"`, `root_dir = "app/frontend"`
- `deployment_configs.production.environment_variables`: `VITE_API_URL = "https://api-${local.project}.<var.cloudflare_zone_name>"`

**`variables.tf`:**
- `cloudflare_api_token` (sensitive)
- `cloudflare_zone_id`
- `cloudflare_zone_name` (ex: `"example.com"`)
- `cloudflare_account_id`
- `lb_ip_aws`
- `lb_ip_azure`

**`terraform.tfvars.example`:**
```hcl
cloudflare_api_token  = "COLOQUE_SEU_TOKEN_AQUI"
cloudflare_zone_id    = "COLOQUE_SEU_ZONE_ID_AQUI"
cloudflare_zone_name  = "example.com"
cloudflare_account_id = "COLOQUE_SEU_ACCOUNT_ID_AQUI"
lb_ip_aws             = "1.2.3.4"   # obtido após: kubectl get svc -n demo --context aws-dev
lb_ip_azure           = "5.6.7.8"   # obtido após: kubectl get svc -n demo --context azure-dev
```

**Token Cloudflare necessário:** `Zone:DNS:Edit` + `Account:Cloudflare Pages:Edit`

---

## Task 6 — README.md raiz

*Bloqueada até todas as outras tasks estarem completas.*

Conteúdo:
- Objetivo do projeto (1 parágrafo)
- Diagrama ASCII da arquitetura completa
- Pré-requisitos (terraform ≥1.5, aws cli, az cli, kubectl, docker, conta Cloudflare, conta CockroachDB)
- Ordem de execução passo a passo:
  1. Criar CockroachDB Serverless + copiar `DATABASE_URL`
  2. `cd aws && terraform init && terraform apply` (~15–20min, já instala FluxCD)
  3. `cd azure && terraform init && terraform apply` (~10min, já instala FluxCD)
  4. Conectar kubectl + criar Secret `db-credentials` em cada cluster
  5. `docker build & push` para `ghcr.io/luizbrito7/gs01-multicloud.fiap/gs01-api:v1`
  6. `git push` → FluxCD sincroniza automaticamente
  7. `kubectl get svc -n demo` → anotar EXTERNAL-IPs
  8. Preencher `cloudflare/terraform.tfvars` + `cd cloudflare && terraform apply`
  9. Abrir URL do Pages no navegador
- Como testar end-to-end

---

## Ordem de execução das tasks

```
Task 1 (limpeza) ──► Task 2 (backend) ──► Task 4 (fluxcd + helm)  ──┐
                     Task 3 (frontend)                                ├──► Task 6 (README)
                     Task 5 (cloudflare) ─────────────────────────────┘
```
