#!/bin/bash
# ============================================
# Mirante — Emissao inicial de cert Let's Encrypt
# ============================================
# Uso: ssh root@<vps>; cd /opt/mirante/docker; LETSENCRYPT_EMAIL=<seu e-mail> bash setup-letsencrypt-mirante.sh
#
# O Mirante NAO tem nginx publico proprio: quem detem as portas 80/443 e o nginx
# do PLANUZ (container planuz-nginx), que roteia por dominio via
# conf.d/site-mirante.conf. Este script reutiliza os volumes de
# certificado do Planuz — o container planuz-certbot renova TODOS os certs
# do volume automaticamente a cada 12h.
#
# Pre-requisitos:
#   - DNS de mirante.felipemarcianodev.com apontando pro IP do servidor.
#   - /opt/planuz atualizado com nginx/conf.d/site-mirante.conf + rede edge.
#   - docker network create edge (uma unica vez).
#
# Idempotente: se o cert real ja existe no volume, sai sem fazer nada novo.
# ============================================

set -e

DOMAIN="${DOMAIN:-mirante.felipemarcianodev.com}"
# E-mail de aviso do Let's Encrypt: obrigatório e fora do repositório (que é público).
EMAIL="${LETSENCRYPT_EMAIL:?Defina LETSENCRYPT_EMAIL, ex.: LETSENCRYPT_EMAIL=voce@exemplo.com bash setup-letsencrypt-mirante.sh}"
CERTS_VOL="planuz_certbot-certs"
WEBROOT_VOL="planuz_certbot-webroot"
PLANUZ_DIR="${PLANUZ_DIR:-/opt/planuz/docker}"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

cyan()  { echo -e "${CYAN}$1${NC}"; }
ok()    { echo -e "${GREEN}[OK] $1${NC}"; }
fail()  { echo -e "${RED}[ERRO] $1${NC}"; }

cyan "=== Mirante Let's Encrypt — Bootstrap ==="
echo -e "Dominio: ${DOMAIN}"
echo -e "Email:   ${EMAIL}"
echo ""

if ! docker volume ls --format '{{.Name}}' | grep -q "^${CERTS_VOL}$"; then
    fail "Volume ${CERTS_VOL} nao existe — o Planuz precisa estar em prod neste servidor."
    exit 1
fi
if ! docker network ls --format '{{.Name}}' | grep -q "^edge$"; then
    fail "Rede 'edge' nao existe. Rode: docker network create edge"
    exit 1
fi
if [ ! -f "${PLANUZ_DIR}/nginx/conf.d/site-mirante.conf" ]; then
    fail "site-mirante.conf nao encontrado em ${PLANUZ_DIR}/nginx/conf.d — atualize o repo do Planuz (git pull)."
    exit 1
fi

# Decide pelo arquivo de renovação, sem mascarar erro: test devolve 1 quando o arquivo não
# existe; qualquer outro código é falha do docker, e aí o script para em vez de sobrescrever um
# cert real.
set +e
docker run --rm -v "${CERTS_VOL}:/etc/letsencrypt:ro" alpine:3 test -f "/etc/letsencrypt/renewal/${DOMAIN}.conf"
CERT_RC=$?
set -e
case "${CERT_RC}" in
    0)
        ok "Cert real do Let's Encrypt ja emitido pra ${DOMAIN}. Renovacao roda no container planuz-certbot."
        exit 0
        ;;
    1) ;;
    *)
        fail "Nao foi possivel verificar o volume ${CERTS_VOL} (docker saiu com ${CERT_RC}). Nada foi alterado."
        exit 1
        ;;
esac

cyan "--- 1/4: Gerando cert dummy self-signed ---"
docker run --rm -v "${CERTS_VOL}:/etc/letsencrypt" \
    --entrypoint /bin/sh \
    certbot/certbot:latest -c "
        mkdir -p /etc/letsencrypt/live/${DOMAIN}
        openssl req -x509 -nodes -newkey rsa:2048 \
            -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
            -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
            -days 1 -subj '/CN=localhost' 2>/dev/null
    "
ok "Dummy emitido em /etc/letsencrypt/live/${DOMAIN}/."

cyan "--- 2/4: Recriando nginx do Planuz (site-mirante.conf ativo, ACME na 80) ---"
# O nginx do Planuz atende todos os sites da VPS: validar antes e só recarregar. Recriar o
# container com um conf quebrado derrubaria todos.
docker exec planuz-nginx nginx -t
docker exec planuz-nginx nginx -s reload
sleep 2
ok "Nginx do Planuz no ar com o dominio do Mirante."

cyan "--- 3/4: Emitindo cert real via certbot --webroot ---"
docker run --rm -v "${CERTS_VOL}:/etc/letsencrypt" \
    --entrypoint /bin/sh \
    certbot/certbot:latest -c "rm -rf /etc/letsencrypt/live/${DOMAIN} /etc/letsencrypt/archive/${DOMAIN} /etc/letsencrypt/renewal/${DOMAIN}.conf 2>/dev/null || true"

if ! docker run --rm \
    -v "${CERTS_VOL}:/etc/letsencrypt" \
    -v "${WEBROOT_VOL}:/var/www/certbot" \
    certbot/certbot:latest \
    certonly --webroot -w /var/www/certbot \
        --email "${EMAIL}" --agree-tos --no-eff-email --non-interactive \
        -d "${DOMAIN}"; then
    fail "Emissao falhou (DNS propagado? porta 80 acessivel?). Restaurando cert dummy para o nginx nao cair."
    docker run --rm -v "${CERTS_VOL}:/etc/letsencrypt" \
        --entrypoint /bin/sh \
        certbot/certbot:latest -c "
            mkdir -p /etc/letsencrypt/live/${DOMAIN}
            openssl req -x509 -nodes -newkey rsa:2048 \
                -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
                -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
                -days 90 -subj '/CN=localhost' 2>/dev/null
        "
    docker exec planuz-nginx nginx -s reload || docker restart planuz-nginx
    exit 1
fi

ok "Cert real emitido por Let's Encrypt."

cyan "--- 4/4: Recarregando nginx do Planuz ---"
docker exec planuz-nginx nginx -s reload
ok "Nginx recarregado com cert real."

echo ""
cyan "=== Concluido ==="
echo "Testar: curl -I https://${DOMAIN}/"
echo "Renovacao automatica: container planuz-certbot renova todos os certs do volume a cada 12h."
